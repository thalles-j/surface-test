import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getMeController, updateMeController, changePasswordController } from "../controllers/profileController.js";

const router = Router();

// Buscar dados do usuário logado
router.get("/", authMiddleware, getMeController);

// Atualizar perfil do usuário logado
router.put("/", authMiddleware, updateMeController);

// Alterar senha
router.put("/senha", authMiddleware, changePasswordController);

export default router;