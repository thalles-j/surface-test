import { Router } from "express";
import {
  loginController,
  registerController,
  requestPasswordResetController,
  resetPasswordController,
  firstAccessStatusController,
} from "../controllers/authController.js";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/forgot-password", requestPasswordResetController);
router.post("/reset-password", resetPasswordController);
router.post("/first-access-status", firstAccessStatusController);

export default router;
