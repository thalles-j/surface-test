import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";

// Endpoint de LISTAGEM (GET /api/products) - JÁ CORRIGIDO COM INCLUDE
export const getProductController = async (req, res) => {
  try {
    const produtos = await prisma.produtos.findMany({
      include: {
        fotos: { // Garante que as fotos sejam incluídas
          select: { 
            url: true,
            descricao: true,
          },
          orderBy: {
            id_foto: 'asc', 
          },
        },
      },
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos e fotos:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Endpoint de CRIAÇÃO (POST /api/products) - FOCO NA CORREÇÃO
export const createProductController = async (req, res) => {
  const data = req.body;
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

      // 1. Verifica se a categoria existe
      const categoria = await prisma.categorias.findUnique({
        where: { id_categoria: Number(p.id_categoria) },
      });
      if (!categoria) {
        return res.status(400).json({ error: `Categoria ${p.id_categoria} não encontrada` });
      }
      
      // 2. Prepara os dados das fotos para a criação aninhada
      // Se p.fotos for undefined ou [], cria um array vazio para o 'create'
      const fotosParaCriar = (p.fotos && Array.isArray(p.fotos) && p.fotos.length > 0) 
        ? p.fotos 
        : [];

      // 3. Cria o produto e as fotos
      const produtoCriado = await prisma.produtos.create({
        data: {
          nome_produto: p.nome_produto,
          descricao: p.descricao,
          preco: Number(p.preco),
          tipo: p.tipo || null,
          id_categoria: Number(p.id_categoria),
          variacoes_estoque: p.variacoes_estoque || [], 
          
          // Chave de criação de relacionamento:
          fotos: { 
            create: fotosParaCriar 
          }, 
        },
      });

      createdProducts.push(produtoCriado);
    }

    // Retorna array se vários, ou objeto único se só enviou um
    res.status(201).json(Array.isArray(data) ? createdProducts : createdProducts[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const listProductsController = crudController.getAllController(crudService, prisma.produtos, { categoria: true });
export const updateProductController = crudController.updateController(crudService, prisma.produtos, "id_produto");
export const deleteProductController = crudController.deleteController(crudService, prisma.produtos, "id_produto");