import { Router } from "express";
import coachController from "../controllers/coachController";
const router = Router();

router.get("/info", coachController.getCoachInfo);
router.post("/newAthlete", coachController.createNewAthlete);
router.get("/getAthleteInfo/:id", coachController.getAthleteInfo);
router.get("/getAllAthletes", coachController.getAllAthletes);
router.post("/saveSession", coachController.saveSession);
router.get("/test", coachController.testController);
export default router;
