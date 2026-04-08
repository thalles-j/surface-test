import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";
import { createRestockRequest } from "../services/restockService.js";

const productInclude = {
  fotos: {
    select: { id_foto: true, url: true, descricao: true, principal: true },
    orderBy: [{ principal: 'desc' }, { id_foto: 'asc' }],
  },
  categoria: true,
};

export const getProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, page, limit, category, status, destaque, oculto } = req.query;

    // GET /products/:id - busca por ID
    if (id) {
      const produto = await prisma.produtos.findUnique({
        where: { id_produto: Number(id) },
        include: productInclude,
      });
      if (!produto) return res.status(404).json({ error: "Produto nao encontrado" });
      return res.status(200).json(produto);
    }

    // Build where clause
    const where = {};
    if (search && search.trim()) {
      where.nome_produto = { contains: search.trim(), mode: 'insensitive' };
    }
    if (category && category !== 'all') {
      where.id_categoria = Number(category);
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (destaque === 'true') where.destaque = true;
    if (oculto === 'true') where.oculto = true;
    else if (oculto === 'false') where.oculto = false;

    // Paginated response
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
      const [produtos, total] = await Promise.all([
        prisma.produtos.findMany({
          where,
          include: productInclude,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { id_produto: 'desc' },
        }),
        prisma.produtos.count({ where }),
      ]);
      return res.status(200).json({ data: produtos, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    }

    const produtos = await prisma.produtos.findMany({
      where,
      include: productInclude,
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getProductBySlugController = async (req, res) => {
  try {
    const { slug } = req.params;

    const produtos = await prisma.produtos.findMany({
      include: productInclude,
    });

    const normalize = (name) =>
      name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const produto = produtos.find(p => normalize(p.nome_produto) === slug);

    if (!produto) return res.status(404).json({ error: "Produto nao encontrado" });

    // Buscar relacionados (mesma categoria, exceto o proprio)
    const related = produtos
      .filter(p => p.id_produto !== produto.id_produto && p.id_categoria === produto.id_categoria)
      .slice(0, 4);

    return res.status(200).json({ produto, related });
  } catch (error) {
    console.error("Erro ao buscar produto por slug:", error);
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
        ? p.fotos.map((f, idx) => ({
            url: f.url,
            descricao: f.descricao,
            principal: f.principal === true || (idx === 0 && !p.fotos.some(ff => ff.principal)),
          }))
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
          status: p.status || 'ativo',
          destaque: p.destaque === true,
          oculto: p.oculto === true,
          tags: p.tags || null,
          peso: p.peso || null,
          dimensoes: p.dimensoes || null,
          ficha_tecnica: p.ficha_tecnica || null,
          seo_titulo: p.seo_titulo || null,
          seo_descricao: p.seo_descricao || null,
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
    } = req.body;

    // fotos is optional — only process photo changes if explicitly sent
    const fotosProvided = req.body.hasOwnProperty('fotos');
    const fotos = fotosProvided ? (req.body.fotos || []) : null;

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
    const { status, destaque, oculto, tags, peso, dimensoes, ficha_tecnica, seo_titulo, seo_descricao } = req.body;
    const produtoAtualizado = await prisma.produtos.update({
      where: { id_produto: id },
      data: {
        nome_produto,
        descricao,
        preco: Number(preco),
        tipo,
        id_categoria: Number(id_categoria),
        variacoes_estoque,
        ...(status !== undefined && { status }),
        ...(destaque !== undefined && { destaque: destaque === true }),
        ...(oculto !== undefined && { oculto: oculto === true }),
        ...(tags !== undefined && { tags }),
        ...(peso !== undefined && { peso }),
        ...(dimensoes !== undefined && { dimensoes }),
        ...(ficha_tecnica !== undefined && { ficha_tecnica }),
        ...(seo_titulo !== undefined && { seo_titulo }),
        ...(seo_descricao !== undefined && { seo_descricao }),
      }
    });

    // 4. Atualização das fotos (somente se fotos foi enviado no payload) ---

    if (fotosProvided && fotos !== null) {
      const fotosEnviadasComId = fotos.filter(f => f.id_foto);  // já existentes
      const fotosNovas = fotos.filter(f => !f.id_foto);         // criadas agora

      // 4.1. Atualizar fotos existentes
      for (const foto of fotosEnviadasComId) {
        await prisma.fotos_produtos.update({
          where: { id_foto: foto.id_foto },
          data: {
            url: foto.url,
            descricao: foto.descricao,
            principal: foto.principal === true,
          }
        });
      }

      // 4.2. Criar novas fotos
      for (const foto of fotosNovas) {
        await prisma.fotos_produtos.create({
          data: {
            url: foto.url,
            descricao: foto.descricao,
            principal: foto.principal === true,
            id_produto: id
          }
        });
      }

      // 4.3. Remover fotos que sumiram do frontend
      const idsEnviados = fotosEnviadasComId.map(f => f.id_foto);

      if (idsEnviados.length > 0) {
        await prisma.fotos_produtos.deleteMany({
          where: {
            id_produto: id,
            id_foto: {
              notIn: idsEnviados
            }
          }
        });
      } else if (fotosNovas.length === 0) {
        // Fotos array was sent as empty — delete all photos
        await prisma.fotos_produtos.deleteMany({
          where: { id_produto: id }
        });
      }
    }

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

export const setPrincipalPhotoController = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { id_foto } = req.body;

    if (!id_foto) {
      return res.status(400).json({ error: "id_foto é obrigatório" });
    }

    // Verifica se a foto pertence ao produto
    const foto = await prisma.fotos_produtos.findFirst({
      where: { id_foto: Number(id_foto), id_produto: productId },
    });

    if (!foto) {
      return res.status(404).json({ error: "Foto não encontrada neste produto" });
    }

    // Remove principal de todas as fotos do produto e seta a nova
    await prisma.$transaction([
      prisma.fotos_produtos.updateMany({
        where: { id_produto: productId },
        data: { principal: false },
      }),
      prisma.fotos_produtos.update({
        where: { id_foto: Number(id_foto) },
        data: { principal: true },
      }),
    ]);

    return res.status(200).json({ message: "Foto principal atualizada" });
  } catch (error) {
    console.error("Erro ao definir foto principal:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const bulkUpdateProductsController = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs são obrigatórios" });
    }

    const validActions = { ativar: { status: 'ativo' }, desativar: { status: 'inativo' }, ocultar: { oculto: true }, mostrar: { oculto: false }, destacar: { destaque: true }, remover_destaque: { destaque: false } };
    const data = validActions[action];
    if (!data) {
      return res.status(400).json({ error: `Ação inválida. Use: ${Object.keys(validActions).join(', ')}` });
    }

    const result = await prisma.produtos.updateMany({
      where: { id_produto: { in: ids.map(Number) } },
      data,
    });

    return res.status(200).json({ message: `${result.count} produtos atualizados`, count: result.count });
  } catch (error) {
    console.error("Erro bulk update:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const createRestockRequestController = async (req, res) => {
  try {
    const produtoId = Number(req.body?.produto_id);
    const variacao = String(req.body?.variacao || "").trim();
    const emailFromBody = String(req.body?.email || "").trim();
    const email = req.user?.email || emailFromBody || null;
    const userId = req.user?.id || null;

    if (!produtoId || Number.isNaN(produtoId)) {
      return res.status(400).json({ error: "produto_id e obrigatorio" });
    }

    if (!variacao) {
      return res.status(400).json({ error: "variacao e obrigatoria" });
    }

    if (!userId && !email) {
      return res.status(400).json({ error: "usuario ou email e obrigatorio" });
    }

    if (email && !isValidEmail(String(email).trim())) {
      return res.status(400).json({ error: "email invalido" });
    }

    const result = await createRestockRequest({
      produtoId,
      variacao,
      email,
      userId,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.status(result.created ? 201 : 200).json({
      message: result.created
        ? "Interesse registrado com sucesso"
        : "Interesse ja registrado para este produto e variacao",
      data: result.request,
    });
  } catch (error) {
    console.error("Erro ao criar solicitacao de reposicao:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
