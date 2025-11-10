import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getMeController, updateMeController } from "../controllers/profileController.js";

const router = Router();

// Buscar dados do usuário logado
router.get("/", authMiddleware, getMeController);

// Atualizar perfil do usuário logado
router.put("/", authMiddleware, updateMeController);

export default router;