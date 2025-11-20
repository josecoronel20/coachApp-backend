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
    "https://coachapp-backend-x14u.onrender.com"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Type", "Authorization"],
};

const app = express();

// Manejar preflight requests antes de otros middlewares
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (origin && corsOptions.origin.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
      res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
      return res.sendStatus(200);
    }
  }
  next();
});

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

// Middleware de manejo de errores con CORS
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin;
  if (origin && corsOptions.origin.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
  });
});

// Manejar rutas no encontradas con CORS
app.use((req: express.Request, res: express.Response) => {
  const origin = req.headers.origin;
  if (origin && corsOptions.origin.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.status(404).json({ message: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));