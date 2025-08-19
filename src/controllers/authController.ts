import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/coachData.json");


const login = (req: any, res: any) => {
    const data = fs.readFileSync(dataPath, "utf8");
    const coachs = JSON.parse(data);

    const { email, password } = req.body;
    const coach = coachs.find((coach: any) => coach.email === email);

    //if coach not found return 401
    if (!coach) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    //if password is not valid return 401
    const isPasswordValid = bcrypt.compareSync(password, coach.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
    }

    //if password is valid return 200 and token
    const token = jwt.sign({ id: coach.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    //save token in cookie
    res.cookie("token", token, { httpOnly: true, secure: true, maxAge: 3600000 });
    return res.status(200).json({ message: "Login successful" });
}

const register = (req: any, res: any) => {
    const { email, password, name, confirmPassword } = req.body;

    const data = fs.readFileSync(dataPath, "utf8");
    const coachs = JSON.parse(data);


    const existingCoach = coachs.find((coach: any) => coach.email === email);

    //if email already exists return 400
    if (existingCoach) {
        console.log("Email already exists");
        return res.status(400).json({ message: "Email already exists" });
    }

    //if password and confirmPassword are not the same return 400
    if (password !== confirmPassword) {
        console.log("Password and confirmPassword are not the same");
        return res.status(400).json({ message: "Password and confirmPassword are not the same" });
    }

    //hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const coach = { id: uuidv4(), email, password: hashedPassword, name };
    coachs.push(coach);
    fs.writeFileSync(dataPath, JSON.stringify(coachs, null, 2));

    console.log("Register successful");
    return res.status(200).json({ message: "Register successful" });
}

const logout = (req: any, res: any) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
}

export { login, register, logout };