import prisma from "../models/prismaClient.js";
import bcrypt from "bcryptjs";

export const createUser = async ({ nome, email, senha, telefone, id_role }) => {
  const hash = await bcrypt.hash(senha, 10);
  return prisma.usuarios.create({
    data: { nome, email, senha: hash, telefone, id_role }
  });
};

export const listUser = async () => {
  return prisma.usuarios.findMany({
    include: { role: true, enderecos: true, pedidos: true }
  });
};
