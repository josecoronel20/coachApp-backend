import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import updatePaymentDate from "../controllers/protected";

const router = Router();

router.post("/updatePaymentDate", authMiddleware, updatePaymentDate.updatePaymentDate);



export default router;

