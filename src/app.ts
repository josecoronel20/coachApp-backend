import express from "express";
import authRoutes from "./routes/auth";
import coachRoutes from "./routes/coach";
import athletesRoutes from "./routes/athletes";
import cors from "cors";
import cookieParser from "cookie-parser";
import protectedRoutes from "./routes/protected";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Agregar middleware para loggear todas las peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/protected", protectedRoutes);

//athletes routes
app.use("/api/athletes", athletesRoutes);


app.listen(3001, () => console.log("Server running on 3001"));