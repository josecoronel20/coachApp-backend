import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getAthleteById = async (req: any, res: any) => {
  const id = req.params.id;

  try {
    const athlete = await prisma.athlete.findUnique({
      where: {
        id: id,
      },
      include: {
        routine: {
          include: {
            exercises: {
              include: {
                history: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1, // Solo el más reciente
                },
              },
            },
          },
          orderBy: {
            dayIndex: 'asc',
          },
        },
      },
    });

    if (!athlete) {
      return res.status(404).json({ message: "Atleta no encontrado" });
    }

    // Transformar la rutina para que coincida con la estructura del frontend
    const transformedRoutine = athlete.routine.map(day => 
      day.exercises.map(exercise => ({
        exercise: exercise.exercise,
        sets: exercise.sets,
        rangeMin: exercise.rangeMin,
        rangeMax: exercise.rangeMax,
        coachNotes: exercise.coachNotes,
        athleteNotes: exercise.athleteNotes,
        exerciseHistory: exercise.history.length > 0 ? [exercise.history[0]] : null,
      }))
    );

    const transformedAthlete = {
      ...athlete,
      routine: transformedRoutine,
    };

    return res.status(200).json(transformedAthlete);
  } catch (error) {
    console.error("Error al obtener el atleta:", error);
    return res.status(500).json({ message: "Error al obtener el atleta" });
  }
};

const updateExercise = async (req: any, res: any) => {
  const { id, dayIndex, exerciseIndex, updatedExercise } = req.body;
  
  try {
    // Buscar el día de rutina específico
    const routineDay = await prisma.routineDay.findFirst({
      where: {
        athleteId: id,
        dayIndex: dayIndex,
      },
      include: {
        exercises: true,
      },
    });

    if (!routineDay) {
      return res.status(404).json({ message: "Día de rutina no encontrado" });
    }

    const exercise = routineDay.exercises[exerciseIndex];
    if (!exercise) {
      return res.status(404).json({ message: "Ejercicio no encontrado" });
    }

    // Actualizar el ejercicio
    await prisma.exercise.update({
      where: {
        id: exercise.id,
      },
      data: {
        exercise: updatedExercise.exercise,
        sets: parseInt(updatedExercise.sets),
        rangeMin: parseInt(updatedExercise.rangeMin),
        rangeMax: parseInt(updatedExercise.rangeMax),
        coachNotes: updatedExercise.coachNotes || "",
        athleteNotes: updatedExercise.athleteNotes || "",
      },
    });

    return res.status(200).json({ message: "Ejercicio actualizado" });
  } catch (error) {
    console.error("Error al actualizar el ejercicio:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar el ejercicio" });
  }
};

const saveSession = async (req: any, res: any) => {
  const { id, dayIndex, sessionProgress } = req.body;

  console.log("=== SAVE SESSION DEBUG ===");
  console.log("id:", id);
  console.log("dayIndex:", dayIndex);
  console.log("sessionProgress:", JSON.stringify(sessionProgress, null, 2));

  try {
    // Validar datos de entrada
    if (!sessionProgress || sessionProgress.length === 0) {
      return res.status(400).json({ message: "No hay datos de sesión para guardar" });
    }

    // Buscar atleta y validar que existe
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        routine: {
          where: { dayIndex: dayIndex }, // Corregido: especificar el campo
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!athlete) {
      return res.status(404).json({ message: "Atleta no encontrado" });
    }

    // Validar rutina y día
    if (!athlete.routine || athlete.routine.length === 0) {
      return res.status(400).json({ message: "Día de rutina inválido" });
    }

    const routineDay = athlete.routine[0];
    const dayExercises = routineDay.exercises;

    console.log("dayExercises:", dayExercises.map(e => ({ id: e.id, name: e.exercise })));

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Crear nueva sesión
      const session = await tx.session.create({
        data: {
          athleteId: id,
          dayIndex,
          date: sessionProgress[0]?.date || new Date().toISOString().split("T")[0],
        },
      });

      console.log("Session created:", session.id);

      // Procesar cada ejercicio de la sesión
      for (let i = 0; i < sessionProgress.length; i++) {
        const sessionData = sessionProgress[i];
        const exercise = dayExercises[i];

        console.log(`Processing exercise ${i}:`, {
          sessionData: sessionData,
          exercise: exercise ? { id: exercise.id, name: exercise.exercise } : null
        });

        if (!exercise) {
          console.log(`No exercise found for index ${i}, skipping`);
          continue;
        }

        if (!sessionData || sessionData.weight === undefined || !sessionData.sets) {
          console.log(`Invalid session data for exercise ${i}, skipping`);
          continue;
        }

        // Crear registro de ejercicio de sesión
        const sessionExercise = await tx.sessionExercise.create({
          data: {
            sessionId: session.id,
            exerciseId: exercise.id,
            weight: parseFloat(sessionData.weight),
            sets: sessionData.sets.map((set: any) => parseInt(set)),
            athleteNotes: sessionData.athleteNotes || "",
          },
        });

        console.log("SessionExercise created:", sessionExercise.id);

        // Crear registro en historial de ejercicios
        const exerciseHistory = await tx.exerciseHistory.create({
          data: {
            exerciseId: exercise.id,
            date: sessionData.date || session.date,
            weight: parseFloat(sessionData.weight),
            sets: sessionData.sets.map((set: any) => parseInt(set)),
          },
        });

        console.log("ExerciseHistory created:", exerciseHistory.id);

        // Actualizar notas del atleta en el ejercicio si existen
        if (sessionData.athleteNotes) {
          await tx.exercise.update({
            where: { id: exercise.id },
            data: { athleteNotes: sessionData.athleteNotes },
          });
        }

        // Mantener solo las últimas 5 sesiones en el historial
        const historyCount = await tx.exerciseHistory.count({
          where: { exerciseId: exercise.id },
        });

        if (historyCount > 5) {
          const oldestHistory = await tx.exerciseHistory.findFirst({
            where: { exerciseId: exercise.id },
            orderBy: { createdAt: "asc" },
          });

          if (oldestHistory) {
            await tx.exerciseHistory.delete({
              where: { id: oldestHistory.id },
            });
            console.log(`Deleted oldest history for exercise ${exercise.id}`);
          }
        }
      }

      return { sessionId: session.id };
    });

    console.log("=== SESSION SAVED SUCCESSFULLY ===");
    return res.json({
      message: "Sesión guardada con éxito",
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("=== SAVE SESSION ERROR ===");
    console.error("Error saving session:", error);
    return res.status(500).json({
      message: "Error al guardar la sesión",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

const updateBodyWeight = async (req: any, res: any) => {
  const { id, bodyWeight } = req.body;
  try {
    const athlete = await prisma.athlete.update({
      where: {
        id: id,
      },
      data: {
        bodyWeight: parseFloat(bodyWeight), // Convertir string a float
      },
    });
    return res.status(200).json(athlete);
  } catch (error) {
    console.error("Error al actualizar el peso:", error);
    return res.status(500).json({ message: "Error al actualizar el peso" });
  }
};

const updateRepsTracked = async (req: any, res: any) => {
  const { id, repsTracked } = req.body;
  try {
    const athlete = await prisma.athlete.update({
      where: {
        id: id,
      },
      data: {
        repsTracked: Boolean(repsTracked), // Asegurar que sea boolean
      },
    });
    return res.status(200).json(athlete);
  } catch (error) {
    console.error("Error al actualizar los reps tracked:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar los reps tracked" });
  }
};

export default {
  getAthleteById,
  updateExercise,
  saveSession,
  updateBodyWeight,
  updateRepsTracked,
};
