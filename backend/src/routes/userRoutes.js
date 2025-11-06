import { Router } from "express";
import {
    createUserController,
    listUserController,
    getUserController,
    updateUserController,
    deleteUserController
} from "../controllers/userController.js";

import { authMiddleware, adminMiddleware, isOwnerOrAdmin } from "../middlewares/authMiddleware.js";

const router = Router();
// Criar usuário (público)
router.post("/", createUserController);

router.get("/", authMiddleware, adminMiddleware, listUserController);

// Listar todos usuários (apenas admin)
router.get("/", authMiddleware, adminMiddleware, listUserController);

// Buscar usuário por ID
router.get("/:id", authMiddleware, isOwnerOrAdmin, getUserController);

// Atualizar usuário
router.put("/:id", authMiddleware, isOwnerOrAdmin, updateUserController);

// Deletar usuário (apenas admin)
router.delete("/:id", authMiddleware, adminMiddleware, deleteUserController);



export default router;