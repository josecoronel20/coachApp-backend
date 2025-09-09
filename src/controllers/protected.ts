
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updatePaymentDate = async (req: any, res: any) => {
  const { paymentDate, id } = req.body;

  try {
    await prisma.athlete.update({
      where: {
        id: id,
      },
      data: {
        paymentDate: paymentDate,
      },
    });
    return res.status(200).json({ message: "Fecha de pago actualizada" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al actualizar la fecha de pago" });
  }
};

const deleteAthlete = async (req: any, res: any) => {
  const { id } = req.body;
  try {
    await prisma.athlete.delete({
      where: {
        id: id,
      },
      include: {
        routine: true,
        sessions: true,
      },
    });
    return res.status(200).json({ message: "Atleta eliminado" });
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar el atleta" });
  }
};

const updateAthleteBasicInfo = async (req: any, res: any) => {
  const { id, name, email, phone, notes } = req.body;

  try {
    await prisma.athlete.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        email: email,
        phone: phone,
        notes: notes,
      },
    });
    return res
      .status(200)
      .json({ message: "Información del atleta actualizada" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al actualizar la información del atleta" });
  }
};

const updateRoutine = async (req: any, res: any) => {
  const { idAthlete, routine } = req.body;
  
  try {
    await prisma.$transaction(async (tx) => {
      // Obtener los días existentes
      const existingDays = await tx.routineDay.findMany({
        where: { athleteId: idAthlete },
        include: { exercises: true },
        orderBy: { dayIndex: 'asc' }
      });

      // Procesar cada día de la nueva rutina
      for (let dayIndex = 0; dayIndex < routine.length; dayIndex++) {
        const day = routine[dayIndex];
        const existingDay = existingDays.find(d => d.dayIndex === dayIndex);

        if (existingDay) {
          // Día existente - actualizar ejercicios
          if (day && day.length > 0) {
            // Obtener ejercicios existentes con su historial
            const existingExercises = await tx.exercise.findMany({
              where: { routineDayId: existingDay.id },
              include: { history: true }
            });

            // Actualizar o crear ejercicios
            for (let exerciseIndex = 0; exerciseIndex < day.length; exerciseIndex++) {
              const exerciseData = day[exerciseIndex];
              const existingExercise = existingExercises[exerciseIndex];

              if (existingExercise) {
                // Actualizar ejercicio existente (preserva el historial)
                await tx.exercise.update({
                  where: { id: existingExercise.id },
                  data: {
                    exercise: exerciseData.exercise,
                    sets: parseInt(exerciseData.sets),
                    rangeMin: parseInt(exerciseData.rangeMin),
                    rangeMax: parseInt(exerciseData.rangeMax),
                    coachNotes: exerciseData.coachNotes || "",
                    athleteNotes: exerciseData.athleteNotes || "",
                  }
                });
              } else {
                // Crear nuevo ejercicio
                await tx.exercise.create({
                  data: {
                    routineDayId: existingDay.id,
                    exercise: exerciseData.exercise,
                    sets: parseInt(exerciseData.sets),
                    rangeMin: parseInt(exerciseData.rangeMin),
                    rangeMax: parseInt(exerciseData.rangeMax),
                    coachNotes: exerciseData.coachNotes || "",
                    athleteNotes: exerciseData.athleteNotes || "",
                  }
                });
              }
            }

            // Eliminar ejercicios que ya no existen
            if (day.length < existingExercises.length) {
              const exercisesToDelete = existingExercises.slice(day.length);
              for (const exerciseToDelete of exercisesToDelete) {
                await tx.exercise.delete({
                  where: { id: exerciseToDelete.id }
                });
              }
            }
          } else {
            // Día vacío - eliminar ejercicios existentes
            await tx.exercise.deleteMany({
              where: { routineDayId: existingDay.id }
            });
          }
        } else {
          // Día nuevo - crear
          const newDay = await tx.routineDay.create({
            data: {
              athleteId: idAthlete,
              dayIndex: dayIndex,
            }
          });

          if (day && day.length > 0) {
            // Crear ejercicios para el nuevo día
            await tx.exercise.createMany({
              data: day.map((exercise: any) => ({
                routineDayId: newDay.id,
                exercise: exercise.exercise,
                sets: parseInt(exercise.sets),
                rangeMin: parseInt(exercise.rangeMin),
                rangeMax: parseInt(exercise.rangeMax),
                coachNotes: exercise.coachNotes || "",
                athleteNotes: exercise.athleteNotes || "",
              }))
            });
          }
        }
      }

      // Eliminar días que ya no existen en la nueva rutina
      const newDayIndexes = routine.map((_: any, index: number) => index);
      const daysToDelete = existingDays.filter(d => !newDayIndexes.includes(d.dayIndex));
      
      for (const dayToDelete of daysToDelete) {
        await tx.routineDay.delete({
          where: { id: dayToDelete.id }
        });
      }
    });

    return res.status(200).json({ message: "Rutina actualizada" });
  } catch (error) {
    console.error("Error al actualizar la rutina:", error);
    return res.status(500).json({ message: "Error al actualizar la rutina" });
  }
};

export default {
  updatePaymentDate,
  deleteAthlete,
  updateAthleteBasicInfo,
  updateRoutine,
};
