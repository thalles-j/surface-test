import prisma from "../database/prisma.js";

export const getCategoriesController = async (req, res) => {
  try {
    const cats = await prisma.categorias.findMany({ orderBy: { id_categoria: 'asc' } });
    return res.status(200).json(cats);
  } catch (err) {
    console.error("Erro ao buscar categorias:", err);
    return res.status(500).json({ error: "Erro interno ao listar categorias" });
  }
};

export default {
  getCategoriesController,
};
