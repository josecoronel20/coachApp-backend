import { Router } from "express";
import coachController from "../controllers/coachController";
const router = Router();

router.get("/info", coachController.getCoachInfo);
router.post("/newAthlete", coachController.createNewAthlete);
router.get("/getAthleteInfo/:id", coachController.getAthleteInfo);
router.get("/getAllAthletes", coachController.getAllAthletes);
export default router;
