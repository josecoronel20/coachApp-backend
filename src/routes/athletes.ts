import { Router } from "express";
import athleteController from "../controllers/athleteController";
const router = Router();

router.get("/:id", athleteController.getAthleteById); 
// router.put("/exerciseUpdate", athleteController.updateExercise
router.post("/saveSession", athleteController.saveSession);

export default router;
