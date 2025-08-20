
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;
  console.log("req.cookies:", req.cookies);
  if (!token) return res.status(401).json({ message: "No token" });

  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid" });
  }
};
