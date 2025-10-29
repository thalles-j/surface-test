// services/loginService.js
import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginService = async (email, senha) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senha);
  if (!senhaCorreta) {
    throw new Error("Senha incorreta.");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    message: "Login realizado com sucesso!",
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    },
  };
};
