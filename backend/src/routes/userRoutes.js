import { Router } from "express";
import {
    createUserController,
    listUserController,
    getUserController,
    updateUserController,
    deleteUserController
} from "../controllers/userController.js";

import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();
// Criar usuário (público)
router.post("/", createUserController);

// Listar todos usuários (apenas admin)
router.get("/", authMiddleware, adminMiddleware, listUserController);

// Buscar usuário por ID
router.get("/:id", authMiddleware, (req, res, next) => {
    // só permite acessar se for o próprio usuário ou admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    next();
}, getUserController);

// Atualizar usuário
router.put("/:id", authMiddleware, (req, res, next) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    next();
}, updateUserController);

// Deletar usuário (apenas admin)
router.delete("/:id", authMiddleware, adminMiddleware, deleteUserController);



export default router;