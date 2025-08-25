import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import protectedController from "../controllers/protected";

const router = Router();

router.post("/updatePaymentDate", authMiddleware, protectedController.updatePaymentDate);
router.delete("/deleteAthlete", authMiddleware, protectedController.deleteAthlete);
router.post("/updateAthleteBasicInfo", authMiddleware, protectedController.updateAthleteBasicInfo);
router.post("/updateRoutine", authMiddleware, protectedController.updateRoutine);

export default router;

