import prisma from "../database/prisma.js";
import * as crudService from "./crudService.js";

// Criar produto com validação de categoria
export const createProduct = async (data) => {
  const categoria = await prisma.categorias.findUnique({
    where: { id_categoria: data.id_categoria }
  });

  if (!categoria) throw new Error("Categoria não encontrada");

  return crudService.createEntity(prisma.produtos, data);
};

export const listProducts = async () => {
  return crudService.listEntities(prisma.produtos, { categoria: true });
};

export const getProductById = async (id) => {
  return crudService.getEntityById(prisma.produtos, "id_produto", id, { categoria: true });
};

export const updateProduct = async (id, data) => {
  return crudService.updateEntity(prisma.produtos, "id_produto", id, data);
};

export const deleteProduct = async (id) => {
  return crudService.deleteEntity(prisma.produtos, "id_produto", id);
};
