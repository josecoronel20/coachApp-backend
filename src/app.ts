import express from "express";
import authRoutes from "./routes/auth";
import coachRoutes from "./routes/coach";
import athletesRoutes from "./routes/athletes";
import cors from "cors";
import cookieParser from "cookie-parser";
import protectedRoutes from "./routes/protected";

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://gymbrocoach.vercel.app",
    "https://coachapp-backend.onrender.com",
    "https://coachapp-backend-x14u.onrender.com"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.use(cors(corsOptions));
// Manejar preflight requests explícitamente
app.options("*", cors(corsOptions));
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));