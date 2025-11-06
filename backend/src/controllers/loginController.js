import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { loginService } from "../services/loginService.js";

export const loginController = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    
    // loginService retorna { token, usuario }
    const { token, usuario } = await loginService(email, senha);

    // 🚨 MODIFICAÇÃO AQUI: Incluir o objeto usuario na resposta
    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: usuario.id_usuario, // Ajuste para o nome da propriedade no seu objeto
        email: usuario.email,
        role: usuario.role, // <-- A ROLE AGORA SERÁ INCLUÍDA NA RESPOSTA JSON
      },
    });
  } catch (error) {
    next(error);
  }
};