import express from "express";
import authRoutes from "./routes/auth";
import cors from "cors";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoutes);

app.listen(3001, () => console.log("Server running on 3001"));
