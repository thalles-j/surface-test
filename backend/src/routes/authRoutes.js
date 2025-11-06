import { Router } from "express";
import { loginController, registerController } from "../controllers/authController.js";

const router = Router();

router.post("/login", loginController);       // público
router.post("/register", registerController); // público

export default router;
