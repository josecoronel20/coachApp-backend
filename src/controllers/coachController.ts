import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataCoachPath = path.join(__dirname, "../data/coachData.json");
const dataAthletePath = path.join(__dirname, "../data/athletesData.json");

const JWT_SECRET = process.env.JWT_SECRET!;

const getCoachInfo = (req: any, res: any) => {
  const data = fs.readFileSync(dataCoachPath, "utf8");
  const coachs = JSON.parse(data);

  //get coach info from token
  const token = req.cookies.token;
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

  const coach = coachs.find((coach: any) => coach.id === decoded.id.toString());


  if (!coach) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.status(200).json(coach);
};

const createNewAthlete = (req: any, res: any) => {
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);
  const { name, email, phone, routine } = req.body;

  const existingAthlete = allAthletes.find(
    (athlete: any) => athlete.phone === phone
  );

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
    notes: "",
    bodyWeight: 0,
    routine,
  };

  allAthletes.push(newAthlete);

  console.log("allAthletes", allAthletes);
  fs.writeFileSync(dataAthletePath, JSON.stringify(allAthletes, null, 2));

  return res.status(201).json({
    message: "Atleta creado exitosamente",
    athlete: newAthlete
  });
};

const getAthleteInfo = (req: any, res: any) => {
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);
  const { id } = req.params;

  const athlete = allAthletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  return res.status(200).json(athlete);
};

const getAllAthletes = (req: any, res: any) => {
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const allAthletes = JSON.parse(data);

  const token = req.cookies.token;
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

  const athletesFromCurrentCoach = allAthletes.filter((athlete: any) => athlete.coachId === decoded.id);

  return res.status(200).json(athletesFromCurrentCoach);
};

export default { getCoachInfo, createNewAthlete, getAthleteInfo, getAllAthletes };
