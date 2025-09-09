
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;

const getCoachInfo = async (req: any, res: any) => {

  //get coach info from token
  const token = req.cookies.token;
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

  const coach = await prisma.coach.findUnique({
    where: {
      id: decoded.id.toString(),
    },
  });


  if (!coach) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.status(200).json(coach);
};

const createNewAthlete = async (req: any, res: any) => {
  try {
    console.log("se ejecuto createNewAthlete");
    const { name, email, phone, routine } = req.body;

    const existingAthlete = await prisma.athlete.findUnique({
      where: {
        phone,
      },
    });
      
    if (existingAthlete) {
      console.log("Este número ya está asociado a un atleta");
      return res.status(400).json({ message: "Este número ya está asociado a un atleta" });
    }

    // Get coach ID from token
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    if (!decoded) {
      return res.status(401).json({ message: "No se pudo obtener el ID del entrenador, vuelva a iniciar sesión" });
    }

    const newAthlete = {
      id: uuidv4(),
      name,
      email,
      phone,
      coachId: decoded.id,
      paymentDate: "",
      repsTracked: false,
      notes: "",
      bodyWeight: 0,
    };

    await prisma.athlete.create({
      data: newAthlete,
    });

    return res.status(201).json({
      message: "Atleta creado exitosamente",
      athlete: newAthlete
    });
  } catch (error) {
    console.error("Error creating athlete:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getAthleteInfo = async (req: any, res: any) => {
  const { id: athleteId } = req.params;

  const athlete = await prisma.athlete.findUnique({
    where: {
      id: athleteId,
    },
    include: {
      routine: {
        include: {
          exercises: true,
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
      exerciseHistory: null, // Por ahora null, se puede implementar después
    }))
  );

  const transformedAthlete = {
    ...athlete,
    routine: transformedRoutine,
  };

  return res.status(200).json(transformedAthlete);
};

const getAllAthletes = async (req: any, res: any) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

  const allAthletesFromCurrentCoach = await prisma.athlete.findMany({
    where: {
      coachId: decoded.id,
    },
  });


  return res.status(200).json(allAthletesFromCurrentCoach);
};


export default { getCoachInfo, createNewAthlete, getAthleteInfo, getAllAthletes };
