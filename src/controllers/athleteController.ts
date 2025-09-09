import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getAthleteById = async (req: any, res: any) => {
  const id = req.params.id;

  try {
    const athlete = await prisma.athlete.findUnique({
      where: {
        id: id,
      },
    });
    return res.status(200).json(athlete);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener el atleta" });
  }
};

const updateExercise = async (req: any, res: any) => {
  const { id, dayIndex, exerciseIndex, updatedExercise } = req.body;
  try {
    const athlete = await prisma.athlete.update({
      where: {
        id: id,
      },
      data: {
        routine: {
          [dayIndex]: {
            [exerciseIndex]: updatedExercise,
          },
        },
      },
    });

    return res.status(200).json(athlete);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al actualizar el ejercicio" });
  }
};

const saveSession = async (req: any, res: any) => {
  const { id, dayIndex, sessionProgress } = req.body;

  try {
    // Buscar atleta y validar que existe
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        routine: {
          where: { dayIndex },
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

    // Crear nueva sesión
    const session = await prisma.session.create({
      data: {
        athleteId: id,
        dayIndex,
        date:
          sessionProgress[0]?.date || new Date().toISOString().split("T")[0],
      },
    });

    // Procesar cada ejercicio de la sesión
    for (let i = 0; i < sessionProgress.length; i++) {
      const sessionData = sessionProgress[i];
      const exercise = dayExercises[i];

      if (!exercise) continue; // Si hay más resultados que ejercicios, lo ignora

      // Crear registro de ejercicio de sesión
      await prisma.sessionExercise.create({
        data: {
          sessionId: session.id,
          exerciseId: exercise.id,
          weight: sessionData.weight,
          sets: sessionData.sets,
          athleteNotes: sessionData.athleteNotes || "",
        },
      });

      // Crear registro en historial de ejercicios
      await prisma.exerciseHistory.create({
        data: {
          exerciseId: exercise.id,
          date: sessionData.date,
          weight: sessionData.weight,
          sets: sessionData.sets,
        },
      });

      // Actualizar notas del atleta en el ejercicio si existen
      if (sessionData.athleteNotes) {
        await prisma.exercise.update({
          where: { id: exercise.id },
          data: { athleteNotes: sessionData.athleteNotes },
        });
      }

      // Mantener solo las últimas 5 sesiones en el historial
      const historyCount = await prisma.exerciseHistory.count({
        where: { exerciseId: exercise.id },
      });

      if (historyCount > 5) {
        const oldestHistory = await prisma.exerciseHistory.findFirst({
          where: { exerciseId: exercise.id },
          orderBy: { createdAt: "asc" },
        });

        if (oldestHistory) {
          await prisma.exerciseHistory.delete({
            where: { id: oldestHistory.id },
          });
        }
      }
    }

    return res.json({
      message: "Sesión guardada con éxito",
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error saving session:", error);
    return res.status(500).json({
      message: "Error al guardar la sesión",
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
        bodyWeight: bodyWeight,
      },
    });
    return res.status(200).json(athlete);
  } catch (error) {
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
        repsTracked: repsTracked,
      },
    });
    return res.status(200).json(athlete);
  } catch (error) {
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
