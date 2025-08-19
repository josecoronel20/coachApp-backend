import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/coachData.json");

const JWT_SECRET = process.env.JWT_SECRET!;

const getCoachInfo = (req: any, res: any) => {

    const data = fs.readFileSync(dataPath, "utf8");
    const coachs = JSON.parse(data);

    //get coach info from token
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    console.log("decoded", decoded);

    const coach = coachs.find((coach: any) => coach.id === decoded.id.toString());
    console.log("coachs", coachs);
    console.log("coach", coach);

    if (!coach) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json(coach);
};

export default getCoachInfo;