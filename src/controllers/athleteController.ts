import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataAthletePath = path.join(__dirname, "../data/athletesData.json");

const getAthleteById = (req: any, res: any) => {
  console.log("getAthleteById");
  const id = req.params.id;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);
  const athlete = allAthletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  return res.status(200).json(athlete);
};

const updateExercise = (req: any, res: any) => {
  const { id, dayIndex, exerciseIndex, updatedExercise } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);
  const athlete = allAthletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  athlete.routine[dayIndex][exerciseIndex] = updatedExercise;

  fs.writeFileSync(dataAthletePath, JSON.stringify(allAthletes, null, 2));

  return res.status(200).json({ message: "Ejercicio actualizado" });
};

const saveSession = (req: any, res: any) => {
  const { id, dayIndex, sessionProgress } = req.body;

  // leer archivo
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);

  // buscar atleta
  const athlete = allAthletes.find((athlete: any) => athlete.id === id);
  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  // validar rutina y día
  if (!athlete.routine || !athlete.routine[dayIndex]) {
    return res.status(400).json({ message: "Día de rutina inválido" });
  }

  const dayExercises = athlete.routine[dayIndex];

  // recorrer cada ejercicio de la sesión
  sessionProgress.forEach((session: any, index: number) => {
    const exercise = dayExercises[index];
    if (!exercise) return; // si hay más resultados que ejercicios, lo ignora

    // inicializar historial si no existe
    if (!exercise.exerciseHistory) {
      exercise.exerciseHistory = [];
    }

    // pushear la nueva sesión al historial
    exercise.exerciseHistory.push({
      date: session.date,
      weight: session.weight,
      sets: session.sets,
    });

    // pushear las notas del atleta al ejercicio
    if (session.athleteNotes) {
      exercise.athleteNotes = session.athleteNotes;
    }

    // mantener solo las últimas 5 sesiones
    if (exercise.exerciseHistory.length > 5) {
      exercise.exerciseHistory.shift();
    }
  });

  // guardar archivo actualizado
  fs.writeFileSync(
    dataAthletePath,
    JSON.stringify(allAthletes, null, 2),
    "utf8"
  );

  return res.json({ message: "Sesión guardada con éxito", athlete });
};

const updateBodyWeight = (req: any, res: any) => {
  const { id, bodyWeight } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);
  const athlete = allAthletes.find((athlete: any) => athlete.id === id);
  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }
  athlete.bodyWeight = bodyWeight;
  fs.writeFileSync(dataAthletePath, JSON.stringify(allAthletes, null, 2));
  return res.status(200).json({ message: "Peso actualizado" });
};

const updateRepsTracked = (req: any, res: any) => {
  const { id, repsTracked } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);

  const athlete = allAthletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }
  
  athlete.repsTracked = repsTracked;
  fs.writeFileSync(dataAthletePath, JSON.stringify(allAthletes, null, 2));
  return res.status(200).json({ message: "Reps tracked actualizado" });
};

export default { getAthleteById, updateExercise, saveSession, updateBodyWeight, updateRepsTracked };
