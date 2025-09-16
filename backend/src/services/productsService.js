import prisma from "../models/prismaClient.js";

export const createProduct = async ({ name, description, price, id_categoria, stock }) => {
  const categoria = await prisma.categorias.findUnique({
    where: { id_categoria } // agora pega do body
  });

  if (!categoria) throw new Error("Categoria não encontrada");

  return prisma.produtos.create({
    data: {
      nome_produto: name,
      descricao: description,
      preco: price,
      id_categoria,
      estoque: stock
    }
  });
};

// List all products (with category)
export const listProducts = async () => {
  return prisma.produtos.findMany({
    include: { categoria: true }
  });
};

// Get product by ID
export const getProductById = async (id) => {
  return prisma.produtos.findUnique({
    where: { id_produto: id },
    include: { categoria: true }
  });
};

// Update product
export const updateProduct = async (id, data) => {
  return prisma.produtos.update({
    where: { id_produto: id },
    data: {
      nome_produto: data.name,
      descricao: data.description,
      preco: data.price,
      id_categoria: data.categoryId,
      estoque: data.stock
    }
  });
};

// Delete product
export const deleteProduct = async (id) => {
  return prisma.produtos.delete({
    where: { id_produto: id }
  });
};
