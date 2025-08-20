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

export default { updatePaymentDate };
