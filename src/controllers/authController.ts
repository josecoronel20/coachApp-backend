import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  console.log("email", email);
  const coach = await prisma.coach.findUnique({
    where: {
      email,
    },
  });
  console.log("coach", coach);

  //if coach not found return 401
  if (!coach) {
    console.log("Credenciales incorrectas");
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  //if password is not valid return 401
  const isPasswordValid = bcrypt.compareSync(password, coach.password);
  if (!isPasswordValid) {
    console.log("Contraseña incorrecta");
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  //if password is valid return 200 and token
  const token = jwt.sign({ id: coach.id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  //save token in cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600000,
    sameSite: "lax",
  });
  console.log("Inicio de sesión exitoso");
  return res.status(200).json({ message: "Inicio de sesión exitoso" });
};

const register = async (req: any, res: any) => {
  const { email, password, name, confirmPassword } = req.body;

  const existingCoach = await prisma.coach.findUnique({
    where: {
      email,
    },
  });

  //if email already exists return 400
  if (existingCoach) {
    console.log("Email ya existe");
    return res.status(400).json({ message: "Email ya existe" });
  }

  //if password and confirmPassword are not the same return 400
  if (password !== confirmPassword) {
    console.log("La contraseña y la confirmación de la contraseña no coinciden");
    return res
      .status(400)
      .json({ message: "La contraseña y la confirmación de la contraseña no coinciden" });
  }

  //hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  const coach = { id: uuidv4(), email, password: hashedPassword, name };
  await prisma.coach.create({
    data: coach,
  });

  console.log("Registro exitoso");
  return res.status(200).json({ message: "Registro exitoso" });
};

const logout = (req: any, res: any) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Cierre de sesión exitoso" });
};

const isAuthenticated = async (req: any, res: any) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Validar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    // Verificar que el coach existe
    const coach = await prisma.coach.findUnique({
      where: { id: decoded.id },
    });

    if (!coach) {
      return res.status(401).json({ message: "No autorizado" });
    }

    return res.status(200).json({ message: "Autorizado", coach: { id: coach.id, email: coach.email } });
  } catch (error) {
    console.error("Error in isAuthenticated:", error);
    return res.status(401).json({ message: "No autorizado" });
  }
};

export default { login, register, logout, isAuthenticated };
