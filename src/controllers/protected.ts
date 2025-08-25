import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataAthletePath = path.join(__dirname, "../data/athletesData.json");

const updatePaymentDate = (req: any, res: any) => {
  const { paymentDate, id } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const athletes = JSON.parse(data);
  const athlete = athletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  athlete.paymentDate = paymentDate;
  fs.writeFileSync(dataAthletePath, JSON.stringify(athletes, null, 2));
  return res.status(200).json({ message: "Fecha de pago actualizada" });
};

const deleteAthlete = (req: any, res: any) => {
  const { id } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const athletes = JSON.parse(data);
  const athlete = athletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }
  const newAthletes = athletes.filter((athlete: any) => athlete.id !== id);
  fs.writeFileSync(dataAthletePath, JSON.stringify(newAthletes, null, 2));
  return res.status(200).json({ message: "Atleta eliminado" });
};

const updateAthleteBasicInfo = (req: any, res: any) => {
  const { id,name, email, phone, notes } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const athletes = JSON.parse(data);
  const athlete = athletes.find((athlete: any) => athlete.id === id);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  const existingPhone = athletes.find((athlete: any) => athlete.phone === phone);
  if (existingPhone && existingPhone.id !== id) {
    return res.status(400).json({ message: "El teléfono ya está en uso" });
  }

  const existingEmail = athletes.find((athlete: any) => athlete.email === email);
  if (existingEmail && existingEmail.id !== id) {
    return res.status(400).json({ message: "El email ya está en uso" });
  }

  athlete.name = name;
  athlete.email = email;
  athlete.phone = phone;
  athlete.notes = notes;
  fs.writeFileSync(dataAthletePath, JSON.stringify(athletes, null, 2));
  return res.status(200).json({ message: "Información del atleta actualizada" });
};

const updateRoutine = (req: any, res: any) => {
  const { idAthlete, routine } = req.body;
  const data = fs.readFileSync(dataAthletePath, "utf8");
  const athletes = JSON.parse(data);
  const athlete = athletes.find((athlete: any) => athlete.id === idAthlete);

  if (!athlete) {
    return res.status(404).json({ message: "Atleta no encontrado" });
  }

  athlete.routine = routine;

  fs.writeFileSync(dataAthletePath, JSON.stringify(athletes, null, 2));
  return res.status(200).json({ message: "Rutina actualizada" });
};

export default {
  updatePaymentDate,
  deleteAthlete,
  updateAthleteBasicInfo,
  updateRoutine,
};
