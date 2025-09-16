import { Router } from "express";
import {
    cadastrarUsuario,
    listarUsuarios
} from "../controllers/userController.js";

const router = Router();

router.post("/", cadastrarUsuario);
router.get("/", listarUsuarios);

export default router;
