import { Router } from "express";
import coachController from "../controllers/coachController";
const router = Router();

router.get("/info", coachController.getCoachInfo);
router.post("/newAthlete", coachController.createNewAthlete);

export default router;
