import { PrismaClient } from "@prisma/client";
import ErroBase  from "../errors/ErroBase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const loginService = async (email, senha) => {
  const usuario = await prisma.usuarios.findUnique({
    where: { email },
  });

  if (!usuario) {
    throw new ErroBase("Usuário não encontrado", 404);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    throw new ErroBase("Senha incorreta", 401);
  }

  const token = jwt.sign(
    { id: usuario.id_usuario, email: usuario.email, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, usuario };
};
