import { Router } from "express";
import { login, register, logout, isAuthenticated } from "../controllers/authController";
const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/isAuthenticated", isAuthenticated);

export default router;