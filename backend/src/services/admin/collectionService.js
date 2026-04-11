import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';

export const getCollections = async (req, res) => {
  try {
    const { page, limit, search, status: statusFilter, locked } = req.query;

    const where = {};
    if (search && search.trim()) {
      where.nome = { contains: search.trim(), mode: 'insensitive' };
    }
    if (statusFilter && statusFilter !== 'all' && statusFilter !== 'todos') where.status = statusFilter;
    if (locked === 'true') where.locked = true;
    else if (locked === 'false') where.locked = false;

    const includeOpts = {
      produtos: {
        include: {
          produto: {
            include: {
              pedidos: {
                select: { quantidade: true, preco_unitario: true },
              },
            },
          },
        },
      },
    };

    const formatCollection = (c) => {
      const prods = c.produtos.map((cp) => cp.produto);
      let totalVendido = 0;
      let totalItens = 0;
      for (const p of prods) {
        for (const pp of (p.pedidos || [])) {
          totalVendido += Number(pp.preco_unitario) * pp.quantidade;
          totalItens += pp.quantidade;
        }
      }
      return {
        id: c.id_colecao,
        nome: c.nome,
        descricao: c.descricao,
        status: c.status,
        locked: c.locked,
        criado_em: c.criado_em,
        produtos: prods.map(p => ({ id_produto: p.id_produto, nome_produto: p.nome_produto, preco: p.preco })),
        metrics: { totalVendido, totalItens, totalProdutos: prods.length },
      };
    };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
      const [cols, total] = await Promise.all([
        prisma.colecoes.findMany({
          where,
          include: includeOpts,
          orderBy: { criado_em: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.colecoes.count({ where }),
      ]);
      return res.json({ data: cols.map(formatCollection), total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    }

    const cols = await prisma.colecoes.findMany({
      include: includeOpts,
      where,
      orderBy: { criado_em: 'desc' },
    });
    return res.json(cols.map(formatCollection));
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createCollection = async (req, res) => {
  try {
    const { nome, descricao, status, locked, productIds } = req.body;
    const data = {
      nome,
      descricao: descricao || null,
      status: status || 'Planejado',
      locked: locked === true,
    };
    if (Array.isArray(productIds) && productIds.length > 0) {
      data.produtos = {
        create: productIds.map((pid) => ({ id_produto: Number(pid) })),
      };
    }
    const created = await prisma.colecoes.create({ data, include: { produtos: true } });
    return res.status(201).json({ id: created.id_colecao, nome: created.nome, descricao: created.descricao, status: created.status, locked: created.locked });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, status, locked, productIds } = req.body;
    const idInt = parseInt(id);

    await prisma.colecoes.update({
      where: { id_colecao: idInt },
      data: { nome, descricao, status, locked },
    });

    if (Array.isArray(productIds)) {
      await prisma.colecao_produtos.deleteMany({ where: { id_colecao: idInt } });
      if (productIds.length > 0) {
        await prisma.colecao_produtos.createMany({
          data: productIds.map((pid) => ({ id_colecao: idInt, id_produto: Number(pid) })),
          skipDuplicates: true,
        });
      }
    }
    return res.json({ mensagem: 'Coleção atualizada' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const idInt = parseInt(req.params.id);
    await prisma.colecao_produtos.deleteMany({ where: { id_colecao: idInt } });
    await prisma.colecoes.delete({ where: { id_colecao: idInt } });
    return res.json({ mensagem: 'Coleção deletada' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const toggleCollectionLock = async (req, res) => {
  try {
    const { locked } = req.body;
    await prisma.colecoes.update({
      where: { id_colecao: parseInt(req.params.id) },
      data: { locked },
    });
    return res.json({ mensagem: `Coleção ${locked ? 'travada' : 'desbloqueada'}` });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const bulkUpdateCollectionStatus = async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return erro(res, 'IDs são obrigatórios');

    const validActions = { ativar: { status: 'Ativo' }, desativar: { status: 'Finalizado' }, travar: { locked: true }, destravar: { locked: false } };
    const data = validActions[action];
    if (!data) return erro(res, `Ação inválida. Use: ${Object.keys(validActions).join(', ')}`);

    const result = await prisma.colecoes.updateMany({
      where: { id_colecao: { in: ids.map(Number) } },
      data,
    });
    return res.json({ mensagem: `${result.count} coleções atualizadas`, count: result.count });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const addProductsToCollection = async (req, res) => {
  try {
    const idInt = parseInt(req.params.id);
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) return erro(res, 'Nenhum produto enviado');
    const result = await prisma.colecao_produtos.createMany({
      data: productIds.map((pid) => ({ id_colecao: idInt, id_produto: Number(pid) })),
      skipDuplicates: true,
    });
    return res.json({ mensagem: 'Produtos adicionados', added: result.count });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const removeProductFromCollection = async (req, res) => {
  try {
    const { id, productId } = req.params;
    await prisma.colecao_produtos.delete({
      where: { id_colecao_id_produto: { id_colecao: parseInt(id), id_produto: parseInt(productId) } },
    });
    return res.json({ mensagem: 'Produto removido da coleção' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
