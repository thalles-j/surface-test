import { PrismaClient } from "@prisma/client";
import ErroBase from "../errors/ErroBase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

/* ======================================================
  LOGIN SERVICE
====================================================== */
export const loginService = async (email, senha) => {
  const usuario = await prisma.usuarios.findUnique({
    where: { email },
    include: { role: true } 
  });

  if (!usuario) {
    throw new ErroBase("Usuário não encontrado", 404);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    throw new ErroBase("Senha incorreta", 401);
  }

  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      email: usuario.email,
      id_role: usuario.id_role, 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, usuario };
};

/* ======================================================
   REGISTER SERVICE
====================================================== */
export const registerService = async (dados) => {
  const { nome, email, senha, telefone } = dados;

  if (!telefone) {
    throw new ErroBase("Telefone é obrigatório", 400);
  }

  // Verifica se o email já existe
  const existente = await prisma.usuarios.findUnique({
    where: { email },
  });

  if (existente) {
    throw new ErroBase("Email já cadastrado", 400);
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 10);

  // Criar usuário
  const usuario = await prisma.usuarios.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      telefone,
      id_role: 2,
    },
  });

  // Gera token igual no login
  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      email: usuario.email,
      id_role: usuario.id_role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { usuario, token };
};

/* ======================================================
  LOGOUT SERVICE
====================================================== */
export const logoutService = async () => {
  // Como estamos usando JWT, o logout pode ser tratado no frontend
  return;
};
