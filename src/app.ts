import express from "express";
import authRoutes from "./routes/auth";
import coachRoutes from "./routes/coach";
import cors from "cors";
import cookieParser from "cookie-parser";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/coach", coachRoutes);

app.listen(3001, () => console.log("Server running on 3001"));
