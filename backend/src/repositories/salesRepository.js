import { pgQuery } from '../database/pg.js';

export const SHIRT_KEYWORDS = ['camisa', 'camiseta', 'blusa'];

function normalizePgJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeProductSuggestion(produto) {
  const variations = Array.isArray(produto.variacoes_estoque) ? produto.variacoes_estoque : [];
  const inStockVariations = variations.filter((v) => Number(v?.estoque || 0) > 0);

  return {
    id_produto: produto.id_produto,
    nome_produto: produto.nome_produto,
    preco: Number(produto.preco || 0),
    variacoes_estoque: variations.map((v) => ({
      tamanho: v?.tamanho || '',
      sku: v?.sku || '',
      estoque: Number(v?.estoque || 0),
    })),
    tamanhos: inStockVariations.map((v) => v?.tamanho).filter(Boolean),
    estoque_total: variations.reduce((sum, v) => sum + Number(v?.estoque || 0), 0),
    tem_estoque: inStockVariations.length > 0,
  };
}

export function attachDerivedItemFields(order) {
  function extractItemSize(item) {
    if (!item) return '';
    if (item.tamanho) return String(item.tamanho);
    const sku = String(item.sku_variacao || '').trim();
    if (!sku) return '';
    const variations = Array.isArray(item.produto?.variacoes_estoque)
      ? item.produto.variacoes_estoque
      : [];
    const matchedVariation = variations.find((v) => String(v?.sku || '') === sku);
    if (matchedVariation?.tamanho) return String(matchedVariation.tamanho);
    return sku;
  }

  return {
    ...order,
    pedidoProdutos: (order.pedidoProdutos || []).map((pp) => ({
      ...pp,
      tamanho: extractItemSize(pp),
      estoque_disponivel: (() => {
        const variations = Array.isArray(pp.produto?.variacoes_estoque)
          ? pp.produto.variacoes_estoque
          : [];
        const matched = variations.find((v) => String(v?.sku || '') === String(pp.sku_variacao || ''));
        return Number(matched?.estoque || 0);
      })(),
    })),
  };
}

export async function getSalesDataViaPg(req) {
  const { page, limit, search, status, sortBy, sortDir, startDate, endDate } = req.query;

  const pageNum = Math.max(1, parseInt(page || 1));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit || 15)));

  const filters = [];
  const values = [];
  let idx = 1;

  if (status && status !== 'all') {
    filters.push(`p.status = $${idx++}`);
    values.push(status);
  }
  if (startDate) {
    filters.push(`p.data_pedido >= $${idx++}`);
    values.push(new Date(startDate));
  }
  if (endDate) {
    filters.push(`p.data_pedido <= $${idx++}`);
    values.push(new Date(endDate));
  }
  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    filters.push(`(p.nome_cliente ILIKE $${idx} OR u.nome ILIKE $${idx} OR u.email ILIKE $${idx})`);
    values.push(term);
    idx += 1;
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const orderSql = sortBy === 'total'
    ? `ORDER BY p.total ${sortDir === 'asc' ? 'ASC' : 'DESC'}`
    : 'ORDER BY p.data_pedido DESC';

  const [aggRow] = await pgQuery(
    `SELECT 
      COUNT(*)::int AS total,
      COALESCE(SUM(p.total), 0)::numeric AS total_revenue,
      COUNT(*) FILTER (WHERE p.status = 'finalizado')::int AS finalizados
     FROM pedidos p
     LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
     ${whereSql}`,
    values
  );

  const total = Number(aggRow?.total || 0);

  const dataValues = [...values, limitNum, (pageNum - 1) * limitNum];
  const ordersRows = await pgQuery(
    `SELECT 
      p.id_pedido, p.id_usuario, p.data_pedido, p.status, p.total, p.metodo_pagamento, p.endereco_entrega, p.nome_cliente,
      u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone,
      addr.logradouro AS endereco_logradouro, addr.numero AS endereco_numero, addr.cidade AS endereco_cidade
     FROM pedidos p
     LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
     LEFT JOIN LATERAL (
       SELECT e.logradouro, e.numero, e.cidade
       FROM enderecos e
       WHERE e.id_usuario = u.id_usuario
       ORDER BY e.id_endereco ASC
       LIMIT 1
     ) addr ON true
     ${whereSql}
     ${orderSql}
     LIMIT $${idx++} OFFSET $${idx++}`,
    dataValues
  );

  const orderIds = ordersRows.map((r) => Number(r.id_pedido));
  const itemsRows = orderIds.length
    ? await pgQuery(
        `SELECT 
          pp.id_pedido, pp.id_produto, pp.sku_variacao, pp.quantidade, pp.preco_unitario,
          pr.nome_produto, pr.preco AS produto_preco, pr.variacoes_estoque
         FROM pedido_produtos pp
         JOIN produtos pr ON pr.id_produto = pp.id_produto
         WHERE pp.id_pedido = ANY($1::int[])`,
        [orderIds]
      )
    : [];

  const itemsByOrder = new Map();
  for (const row of itemsRows) {
    const key = Number(row.id_pedido);
    if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
    itemsByOrder.get(key).push({
      id_pedido: key,
      id_produto: Number(row.id_produto),
      sku_variacao: row.sku_variacao,
      quantidade: Number(row.quantidade),
      preco_unitario: Number(row.preco_unitario),
      produto: {
        id_produto: Number(row.id_produto),
        nome_produto: row.nome_produto,
        preco: Number(row.produto_preco || 0),
        variacoes_estoque: normalizePgJson(row.variacoes_estoque),
      },
    });
  }

  const orders = ordersRows.map((r) => ({
    id_pedido: Number(r.id_pedido),
    id_usuario: r.id_usuario ? Number(r.id_usuario) : null,
    data_pedido: r.data_pedido,
    status: r.status,
    total: Number(r.total || 0),
    metodo_pagamento: r.metodo_pagamento,
    endereco_entrega: r.endereco_entrega,
    nome_cliente: r.nome_cliente,
    usuario: r.id_usuario
      ? {
          id_usuario: Number(r.id_usuario),
          nome: r.usuario_nome,
          email: r.usuario_email,
          telefone: r.usuario_telefone,
          enderecos: r.endereco_logradouro
            ? [
                {
                  logradouro: r.endereco_logradouro,
                  numero: r.endereco_numero,
                  cidade: r.endereco_cidade,
                },
              ]
            : [],
        }
      : null,
    pedidoProdutos: itemsByOrder.get(Number(r.id_pedido)) || [],
  }));

  return {
    data: orders.map(attachDerivedItemFields),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    aggregates: {
      totalRevenue: Number(aggRow?.total_revenue || 0),
      avgTicket: total > 0 ? Number(aggRow?.total_revenue || 0) / total : 0,
      finalizados: Number(aggRow?.finalizados || 0),
    },
  };
}

export async function searchProductsForOrderEditViaPg(req) {
  const query = String(req.query?.query || '').trim();
  const limit = Math.min(30, Math.max(5, Number(req.query?.limit || 12)));

  const filters = ['oculto = false'];
  const values = [];
  let idx = 1;

  if (query) {
    filters.push(`(nome_produto ILIKE $${idx} OR COALESCE(tags, '') ILIKE $${idx} OR COALESCE(tipo, '') ILIKE $${idx})`);
    values.push(`%${query}%`);
    idx += 1;
  }

  values.push(limit);

  const rows = await pgQuery(
    `SELECT id_produto, nome_produto, preco, variacoes_estoque, tipo, tags
     FROM produtos
     WHERE ${filters.join(' AND ')}
     ORDER BY atualizado_em DESC
     LIMIT $${idx}`,
    values
  );

  const sorted = rows
    .map((r) => ({
      ...r,
      variacoes_estoque: normalizePgJson(r.variacoes_estoque),
    }))
    .sort((a, b) => {
      const textA = `${a.nome_produto} ${a.tipo || ''} ${a.tags || ''}`.toLowerCase();
      const textB = `${b.nome_produto} ${b.tipo || ''} ${b.tags || ''}`.toLowerCase();
      const scoreA = SHIRT_KEYWORDS.some((k) => textA.includes(k)) ? 1 : 0;
      const scoreB = SHIRT_KEYWORDS.some((k) => textB.includes(k)) ? 1 : 0;
      return scoreB - scoreA;
    })
    .map(normalizeProductSuggestion);

  return sorted;
}
