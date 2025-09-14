import express from "express";
import { cadastrarUsuario, listarUsuarios } from "../controllers/userController.js";

const router = express.Router();

router.post("/", cadastrarUsuario);
router.get("/", listarUsuarios);

export default router;
