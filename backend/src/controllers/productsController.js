import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";

export const createProductController = async (req, res) => {
  try {
    const categoria = await prisma.categorias.findUnique({
      where: { id_categoria: req.body.id_categoria }
    });
    if (!categoria) return res.status(400).json({ error: "Categoria não encontrada" });

    const product = await crudService.createEntity(prisma.produtos, req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listProductsController = crudController.listController(crudService, prisma.produtos, { categoria: true });
export const getProductController = crudController.getController(crudService, prisma.produtos, "id_produto", { categoria: true });
export const updateProductController = crudController.updateController(crudService, prisma.produtos, "id_produto");
export const deleteProductController = crudController.deleteController(crudService, prisma.produtos, "id_produto");
