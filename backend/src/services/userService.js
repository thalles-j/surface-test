import prisma from "../database/prisma.js";
import * as crudService from "./crudService.js";

// Campos que precisam de hash
const hashFields = ["senha"];

export const createUser = async (data) => {
  return crudService.createEntity(prisma.usuarios, data, hashFields);
};

export const listUser = async () => {
  return crudService.listEntities(prisma.usuarios, {
    role: true,
    enderecos: true,
    pedidos: true
  });
};

export const getUserById = async (id) => {
  return crudService.getEntityById(prisma.usuarios, "id_usuario", id, {
    role: true,
    enderecos: true,
    pedidos: true
  });
};

export const updateUser = async (id, data) => {
  return crudService.updateEntity(prisma.usuarios, "id_usuario", id, data);
};

export const deleteUser = async (id) => {
  return crudService.deleteEntity(prisma.usuarios, "id_usuario", id);
};
