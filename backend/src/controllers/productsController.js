import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";

export const getProductController = async (req, res) => {
  try {
    const produtos = await prisma.produtos.findMany({
      include: {
        fotos: {
          select: { 
            id_foto: true,
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

export const updateProductController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      nome_produto,
      descricao,
      preco,
      tipo,
      id_categoria,
      variacoes_estoque,
      fotos = []
    } = req.body;

    // 1. Verifica se o produto existe
    const produtoExistente = await prisma.produtos.findUnique({
      where: { id_produto: id },
      include: { fotos: true }
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // 2. Verifica duplicação do nome_produto (exceto no próprio ID)
    if (nome_produto) {
      const nomeDuplicado = await prisma.produtos.findFirst({
        where: {
          nome_produto,
          NOT: { id_produto: id }
        }
      });

      if (nomeDuplicado) {
        return res.status(400).json({
          error: "Já existe outro produto com esse nome"
        });
      }
    }

    // 3. Atualiza o produto
    const produtoAtualizado = await prisma.produtos.update({
      where: { id_produto: id },
      data: {
        nome_produto,
        descricao,
        preco: Number(preco),
        tipo,
        id_categoria: Number(id_categoria),
        variacoes_estoque
      }
    });

    // 4. Atualização das fotos ----------------------------

    const fotosEnviadasComId = fotos.filter(f => f.id_foto);  // já existentes
    const fotosNovas = fotos.filter(f => !f.id_foto);         // criadas agora

    // 4.1. Atualizar fotos existentes
    for (const foto of fotosEnviadasComId) {
      await prisma.fotos.update({
        where: { id_foto: foto.id_foto },
        data: {
          url: foto.url,
          descricao: foto.descricao
        }
      });
    }

    // 4.2. Criar novas fotos
    for (const foto of fotosNovas) {
      await prisma.fotos.create({
        data: {
          url: foto.url,
          descricao: foto.descricao,
          id_produto: id
        }
      });
    }

    // 4.3. Remover fotos que sumiram do frontend
    const idsEnviados = fotosEnviadasComId.map(f => f.id_foto);

    await prisma.fotos.deleteMany({
      where: {
        id_produto: id,
        id_foto: {
          notIn: idsEnviados
        }
      }
    });

    //------------------------------------------------------

    return res.status(200).json({
      message: "Produto atualizado com sucesso",
      produto: produtoAtualizado
    });

  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar produto." });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // 1. Verifica se o produto existe
    const produto = await prisma.produtos.findUnique({
      where: { id_produto: id }
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    try {
      // 2. Remove FOTOS do produto (tabela correta: fotos_produtos)
      await prisma.fotos_produtos.deleteMany({
        where: { id_produto: id }
      });

      // 3. Limpa as variações (JSON)
      await prisma.produtos.update({
        where: { id_produto: id },
        data: { variacoes_estoque: [] }
      });

      // 4. Remove o produto
      await prisma.produtos.delete({
        where: { id_produto: id }
      });

      return res.status(200).json({
        message: "Produto deletado com sucesso"
      });

    } catch (err) {
      // FK: produto usado em pedido_produtos
      if (err.code === "P2003") {
        return res.status(400).json({
          error: "Não é possível deletar este produto porque há pedidos vinculados."
        });
      }

      throw err;
    }

  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return res.status(500).json({
      error: "Erro interno ao deletar produto.",
      details: error.message
    });
  }
};


export const listProductsController = crudController.getAllController(crudService, prisma.produtos, { categoria: true });