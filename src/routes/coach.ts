import { Router } from "express";
import getCoachInfo from "../controllers/coachController";
const router = Router();

router.get("/info", getCoachInfo);

export default router;