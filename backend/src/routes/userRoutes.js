import { Router } from "express";
import {
    createUserController,
    listUserController,
    getUserController,
    updateUserController,
    deleteUserController
} from "../controllers/userController.js";

const router = Router();

// Criar usuário
router.post("/", createUserController);

// Listar todos os usuários
router.get("/", listUserController);

// Buscar usuário por ID
router.get("/:id", getUserController);

// Atualizar usuário
router.put("/:id", updateUserController);

// Deletar usuário
router.delete("/:id", deleteUserController);

export default router;
