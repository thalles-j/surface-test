import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';

export const getInventoryStatus = async (req, res) => {
  try {
    const { page, limit, search, stockHealth } = req.query;

    const where = {};
    if (search && search.trim()) {
      where.nome_produto = { contains: search.trim(), mode: 'insensitive' };
    }

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
      const [products, total] = await Promise.all([
        prisma.produtos.findMany({
          where,
          include: { categoria: true, fotos: true },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.produtos.count({ where }),
      ]);
      return res.json({ data: products, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    }

    const products = await prisma.produtos.findMany({
      where,
      include: { categoria: true, fotos: true },
    });
    return res.json(products);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 15;
    const products = await prisma.produtos.findMany({
      include: { categoria: true },
    });
    const low = products.filter(p => {
      const vars = Array.isArray(p.variacoes_estoque) ? p.variacoes_estoque : [];
      if (vars.length === 0) return true;
      return vars.some(v => (v.estoque || 0) <= threshold);
    });
    return res.json(low);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variacoes_estoque, stock } = req.body;
    const product = await prisma.produtos.findUnique({ where: { id_produto: parseInt(productId) } });
    if (!product) return erro(res, 'Produto não encontrado', 404);

    let updated;
    if (Array.isArray(variacoes_estoque)) {
      updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque } });
    } else if (typeof stock === 'number') {
      const vars = Array.isArray(product.variacoes_estoque) ? [...product.variacoes_estoque] : [];
      if (vars.length > 0) {
        vars[0].estoque = stock;
        updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque: vars } });
      } else {
        updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque: [{ tamanho: 'Único', sku: `${productId}-UN`, estoque: stock }] } });
      }
    } else {
      return erro(res, 'Dados de estoque inválidos');
    }

    return sucesso(res, { mensagem: 'Estoque atualizado', produto: updated });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// --- MOVIMENTAÇÃO DE ESTOQUE ---

/**
 * Registra uma movimentação de estoque (reposição, ajuste, devolução)
 * Atualiza o estoque do produto automaticamente
 */
export const createStockMovement = async (req, res) => {
  try {
    const { id_produto, sku_variacao, tipo, quantidade, observacao } = req.body;

    if (!id_produto || !sku_variacao || !tipo || quantidade === undefined) {
      return erro(res, 'Campos obrigatórios: id_produto, sku_variacao, tipo, quantidade');
    }

    const tiposValidos = ['venda', 'reposicao', 'ajuste', 'devolucao'];
    if (!tiposValidos.includes(tipo)) {
      return erro(res, `Tipo inválido. Use: ${tiposValidos.join(', ')}`);
    }

    const product = await prisma.produtos.findUnique({ where: { id_produto: parseInt(id_produto) } });
    if (!product) return erro(res, 'Produto não encontrado', 404);

    const vars = Array.isArray(product.variacoes_estoque) ? [...product.variacoes_estoque] : [];
    const varIdx = vars.findIndex(v => v.sku === sku_variacao || v.tamanho === sku_variacao);
    if (varIdx === -1) return erro(res, 'Variação não encontrada', 404);

    // Calcula novo estoque: venda subtrai, reposição/devolução soma, ajuste é valor absoluto
    const delta = (tipo === 'venda') ? -Math.abs(quantidade) : Math.abs(quantidade);
    vars[varIdx].estoque = Math.max(0, (vars[varIdx].estoque || 0) + delta);

    // Transação: atualiza estoque + registra movimentação
    const [, movimentacao] = await prisma.$transaction([
      prisma.produtos.update({
        where: { id_produto: parseInt(id_produto) },
        data: { variacoes_estoque: vars },
      }),
      prisma.movimentacoes_estoque.create({
        data: {
          id_produto: parseInt(id_produto),
          sku_variacao,
          tipo,
          quantidade: Math.abs(quantidade),
          observacao: observacao || null,
        },
      }),
    ]);

    return sucesso(res, { movimentacao, estoque_atual: vars[varIdx].estoque }, 201);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

/**
 * Lista movimentações de estoque com filtros opcionais
 */
export const getStockMovements = async (req, res) => {
  try {
    const { id_produto, tipo, limit = 50 } = req.query;
    const where = {};
    if (id_produto) where.id_produto = parseInt(id_produto);
    if (tipo) where.tipo = tipo;

    const movimentacoes = await prisma.movimentacoes_estoque.findMany({
      where,
      include: { produto: { select: { id_produto: true, nome_produto: true } } },
      orderBy: { criado_em: 'desc' },
      take: parseInt(limit),
    });

    return res.json(movimentacoes);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

/**
 * Registra movimentações de venda em lote (chamado internamente ao criar pedido)
 */
export async function logSaleMovements(tx, items) {
  for (const item of items) {
    await tx.movimentacoes_estoque.create({
      data: {
        id_produto: item.id_produto,
        sku_variacao: item.sku_variacao,
        tipo: 'venda',
        quantidade: item.quantidade,
        observacao: 'Pedido automático',
      },
    });
  }
}
