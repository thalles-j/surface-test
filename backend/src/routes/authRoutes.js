import { Router } from "express";
import {
  loginController,
  registerController,
  requestPasswordResetController,
  resetPasswordController,
  firstAccessStatusController,
} from "../controllers/authController.js";
import { validateBody, loginSchema, registerSchema, passwordResetSchema, passwordResetConfirmSchema } from "../middlewares/validateBody.js";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/register", validateBody(registerSchema), registerController);
router.post("/forgot-password", validateBody(passwordResetSchema), requestPasswordResetController);
router.post("/reset-password", validateBody(passwordResetConfirmSchema), resetPasswordController);
router.post("/first-access-status", firstAccessStatusController);

export default router;
