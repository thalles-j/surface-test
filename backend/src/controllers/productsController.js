import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";

export const createProductController = async (req, res) => {
  const data = req.body;

  // Detecta se é array ou objeto único
  const produtos = Array.isArray(data) ? data : [data];

  if (produtos.length === 0) {
    return res.status(400).json({ error: "Nenhum produto enviado" });
  }

  try {
    const createdProducts = [];

    for (const p of produtos) {
      if (!p.id_categoria) {
        return res.status(400).json({ error: "id_categoria é obrigatório para todos os produtos" });
      }

      // Verifica se a categoria existe
      const categoria = await prisma.categorias.findUnique({
        where: { id_categoria: Number(p.id_categoria) },
      });
      if (!categoria) {
        return res.status(400).json({ error: `Categoria ${p.id_categoria} não encontrada` });
      }

      // Cria o produto
      const produtoCriado = await prisma.produtos.create({
        data: {
          nome_produto: p.nome_produto,
          descricao: p.descricao,
          preco: Number(p.preco),
          estoque: Number(p.estoque),
          categoria: { connect: { id_categoria: Number(p.id_categoria) } },
          fotos: { create: p.fotos || [] },
        },
      });

      createdProducts.push(produtoCriado);
    }

    // Retorna array se vários, ou objeto único se só enviou um
    res.status(201).json(Array.isArray(data) ? createdProducts : createdProducts[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listProductsController = crudController.listController(crudService, prisma.produtos, { categoria: true });
export const getProductController = crudController.getController(crudService, prisma.produtos, "id_produto", { categoria: true });
export const updateProductController = crudController.updateController(crudService, prisma.produtos, "id_produto");
export const deleteProductController = crudController.deleteController(crudService, prisma.produtos, "id_produto");
