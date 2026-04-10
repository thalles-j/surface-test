import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';
import { isValidTransition, getAllStatuses } from '../../helpers/orderStatus.js';
import { sendOrderStatusUpdate } from '../emailService.js';

const SHIRT_KEYWORDS = ['camisa', 'camiseta', 'blusa'];

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

function attachDerivedItemFields(order) {
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

function normalizeProductSuggestion(produto) {
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

export const getSalesData = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortDir, startDate, endDate } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (startDate || endDate) {
      where.data_pedido = {};
      if (startDate) where.data_pedido.gte = new Date(startDate);
      if (endDate) where.data_pedido.lte = new Date(endDate);
    }
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { nome_cliente: { contains: term, mode: 'insensitive' } },
        { usuario: { is: { nome: { contains: term, mode: 'insensitive' } } } },
        { usuario: { is: { email: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const orderBy = sortBy === 'total'
      ? { total: sortDir === 'asc' ? 'asc' : 'desc' }
      : { data_pedido: 'desc' };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
      const [orders, total, revenueAgg, finalizedCount] = await Promise.all([
        prisma.pedidos.findMany({
          where,
          include: {
            usuario: {
              include: {
                enderecos: {
                  select: {
                    logradouro: true,
                    numero: true,
                    cidade: true,
                  },
                  take: 1,
                },
              },
            },
            pedidoProdutos: {
              include: {
                produto: {
                  select: {
                    id_produto: true,
                    nome_produto: true,
                    preco: true,
                    variacoes_estoque: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.pedidos.count({ where }),
        prisma.pedidos.aggregate({ where, _sum: { total: true } }),
        prisma.pedidos.count({ where: { ...where, status: 'finalizado' } }),
      ]);
      const totalRevenue = parseFloat(revenueAgg._sum.total || 0);
      return res.json({
        data: orders.map(attachDerivedItemFields),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        aggregates: {
          totalRevenue,
          avgTicket: total > 0 ? totalRevenue / total : 0,
          finalizados: finalizedCount,
        },
      });
    }

    const orders = await prisma.pedidos.findMany({
      include: {
        usuario: { include: { enderecos: true } },
        pedidoProdutos: {
          include: {
            produto: {
              select: {
                id_produto: true,
                nome_produto: true,
                preco: true,
                variacoes_estoque: true,
              },
            },
          },
        },
      },
      orderBy,
    });
    return res.json(orders.map(attachDerivedItemFields));
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const searchProductsForOrderEdit = async (req, res) => {
  try {
    const query = String(req.query?.query || '').trim();
    const limit = Math.min(30, Math.max(5, Number(req.query?.limit || 12)));

    const where = {
      oculto: false,
      OR: [
        { status: 'ativo' },
        { status: 'inativo' },
      ],
    };

    if (query) {
      where.OR = [
        { nome_produto: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
        { tipo: { contains: query, mode: 'insensitive' } },
      ];
    }

    const rawProducts = await prisma.produtos.findMany({
      where,
      select: {
        id_produto: true,
        nome_produto: true,
        preco: true,
        variacoes_estoque: true,
        tipo: true,
        tags: true,
        status: true,
        atualizado_em: true,
      },
      orderBy: { atualizado_em: 'desc' },
      take: query ? limit : 30,
    });

    const sorted = rawProducts
      .slice()
      .sort((a, b) => {
        const textA = `${a.nome_produto} ${a.tipo || ''} ${a.tags || ''}`.toLowerCase();
        const textB = `${b.nome_produto} ${b.tipo || ''} ${b.tags || ''}`.toLowerCase();
        const scoreA = SHIRT_KEYWORDS.some((k) => textA.includes(k)) ? 1 : 0;
        const scoreB = SHIRT_KEYWORDS.some((k) => textB.includes(k)) ? 1 : 0;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(normalizeProductSuggestion);

    return res.json(sorted);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getSalesByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.data_pedido = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    const orders = await prisma.pedidos.findMany({ where });
    return res.json(orders);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!getAllStatuses().includes(status)) {
      return erro(res, `Status inválido. Valores permitidos: ${getAllStatuses().join(', ')}`);
    }

    const currentOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: parseInt(id) },
    });

    if (!currentOrder) {
      return erro(res, 'Pedido não encontrado.', 404);
    }

    if (!isValidTransition(currentOrder.status, status)) {
      return erro(res, `Transição de status inválida: "${currentOrder.status}" → "${status}".`);
    }

    const [order] = await prisma.$transaction([
      prisma.pedidos.update({
        where: { id_pedido: parseInt(id) },
        data: { status },
        include: {
          usuario: { include: { enderecos: true } },
          pedidoProdutos: { include: { produto: true } },
          historico: { orderBy: { criado_em: 'desc' } },
        },
      }),
      prisma.historico_pedidos.create({
        data: {
          id_pedido: parseInt(id),
          tipo: 'status_change',
          descricao: `Status alterado de "${currentOrder.status}" para "${status}"`,
          status_de: currentOrder.status,
          status_para: status,
          autor: 'admin',
        },
      }),
    ]);

    // Re-fetch to get freshly created historico entry
    const updatedOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: parseInt(id) },
      include: {
        usuario: { include: { enderecos: true } },
        pedidoProdutos: { include: { produto: true } },
        historico: { orderBy: { criado_em: 'desc' } },
      },
    });

    // Fire-and-forget — não bloqueia a resposta
    sendOrderStatusUpdate({
      order: updatedOrder,
      statusDe: currentOrder.status,
      statusPara: status,
    });

    return sucesso(res, { mensagem: 'Status atualizado', pedido: updatedOrder });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return erro(res, 'IDs são obrigatórios');
    if (!getAllStatuses().includes(status)) return erro(res, `Status inválido. Use: ${getAllStatuses().join(', ')}`);

    const orders = await prisma.pedidos.findMany({
      where: { id_pedido: { in: ids.map(Number) } },
    });

    let updated = 0;
    let skipped = 0;
    for (const order of orders) {
      if (isValidTransition(order.status, status)) {
        await prisma.pedidos.update({ where: { id_pedido: order.id_pedido }, data: { status } });
        updated++;
      } else {
        skipped++;
      }
    }

    return sucesso(res, { mensagem: `${updated} pedidos atualizados, ${skipped} ignorados (transição inválida)`, updated, skipped });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== UPDATE ORDER ITEMS (transaction) =====
export const updateOrderItems = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return erro(res, 'Itens são obrigatórios');
    }

    const order = await prisma.pedidos.findUnique({
      where: { id_pedido: orderId },
      include: { pedidoProdutos: true },
    });
    if (!order) return erro(res, 'Pedido não encontrado', 404);

    // Validate all products exist and normalize variation identifier
    const normalizedItems = [];
    for (const item of items) {
      if (!item.id_produto || !item.quantidade || item.preco_unitario === undefined || item.preco_unitario === null) {
        return erro(res, 'Cada item deve ter id_produto, quantidade e preco_unitario');
      }
      const product = await prisma.produtos.findUnique({ where: { id_produto: Number(item.id_produto) } });
      if (!product) return erro(res, `Produto ID ${item.id_produto} não encontrado`);

      const variations = Array.isArray(product.variacoes_estoque) ? product.variacoes_estoque : [];
      let sku = item.sku_variacao || null;

      if (!sku && item.tamanho) {
        const found = variations.find(v => v.tamanho === item.tamanho);
        sku = found?.sku || item.tamanho;
      }

      if (!sku && variations.length === 1) {
        sku = variations[0].sku || variations[0].tamanho || 'UNICO';
      }

      if (!sku) {
        return erro(res, `Não foi possível identificar a variação do produto ID ${item.id_produto}`);
      }

      normalizedItems.push({
        id_produto: Number(item.id_produto),
        sku_variacao: String(sku),
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete old items
      await tx.pedido_produtos.deleteMany({ where: { id_pedido: orderId } });

      // 2. Insert new items
      for (const item of normalizedItems) {
        await tx.pedido_produtos.create({
          data: {
            id_pedido: orderId,
            id_produto: item.id_produto,
            sku_variacao: item.sku_variacao,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          },
        });
      }

      // 3. Recalculate subtotal and total
      const subtotal = normalizedItems.reduce((sum, i) => sum + (Number(i.preco_unitario) * i.quantidade), 0);
      const desconto = Number(order.desconto || 0);
      const frete = Number(order.frete || 0);
      const total = subtotal - desconto + frete;

      // 4. Update order totals
      const updated = await tx.pedidos.update({
        where: { id_pedido: orderId },
        data: {
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100,
        },
        include: {
          pedidoProdutos: { include: { produto: true } },
          usuario: { select: { id_usuario: true, nome: true, email: true } },
        },
      });

      // 5. Log in historico
      await tx.historico_pedidos.create({
        data: {
          id_pedido: orderId,
          tipo: 'items_change',
          descricao: `Itens do pedido atualizados. Novo subtotal: R$ ${(subtotal).toFixed(2)}`,
          autor: 'admin',
        },
      });

      return updated;
    });

    return sucesso(res, { mensagem: 'Itens atualizados', pedido: result });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== UPDATE ORDER ADDRESS =====
export const updateOrderAddress = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { endereco_entrega, endereco } = req.body;
    const nextAddress = endereco_entrega ?? endereco;

    if (!nextAddress) return erro(res, 'endereco_entrega/endereco é obrigatório');

    const order = await prisma.pedidos.findUnique({ where: { id_pedido: orderId } });
    if (!order) return erro(res, 'Pedido não encontrado', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const orderUpdated = await tx.pedidos.update({
        where: { id_pedido: orderId },
        data: { endereco_entrega: nextAddress },
      });

      await tx.historico_pedidos.create({
        data: {
          id_pedido: orderId,
          tipo: 'address_change',
          descricao: 'Endereço de entrega atualizado',
          autor: 'admin',
        },
      });

      return orderUpdated;
    });

    return sucesso(res, { mensagem: 'Endereço atualizado', pedido: updated });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const history = await prisma.historico_pedidos.findMany({
      where: { id_pedido: orderId },
      orderBy: { criado_em: 'desc' },
    });
    return res.json(history);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== CREATE IN-PERSON SALE =====
export const createInPersonSale = async (req, res) => {
  try {
    const { nome_cliente, email_cliente, metodo_pagamento, data_pedido, items, observacoes_internas } = req.body;

    if (!nome_cliente || !items || items.length === 0) {
      return erro(res, 'nome_cliente e items são obrigatórios');
    }

    // Validate products and stock
    const productData = [];
    for (const item of items) {
      const product = await prisma.produtos.findUnique({ where: { id_produto: item.id_produto } });
      if (!product) return erro(res, `Produto ID ${item.id_produto} não encontrado`);

      const variations = Array.isArray(product.variacoes_estoque) ? product.variacoes_estoque : [];
      const variation = variations.find(v => v.tamanho === item.tamanho || v.sku === item.sku_variacao);
      if (!variation) return erro(res, `Variação "${item.tamanho || item.sku_variacao}" não encontrada para "${product.nome_produto}"`);
      if ((variation.estoque || 0) < item.quantidade) {
        return erro(res, `Estoque insuficiente para "${product.nome_produto}" (${variation.tamanho}). Disponível: ${variation.estoque || 0}`);
      }

      productData.push({ product, variation, quantity: item.quantidade });
    }

    const subtotal = productData.reduce(
      (sum, { product, quantity }) => sum + Number(product.preco) * quantity, 0
    );
    const total = items.reduce(
      (sum, item) => sum + (Number(item.preco_unitario || 0) * item.quantidade), 0
    ) || subtotal;

    const cleanEmail = email_cliente ? String(email_cliente).trim().toLowerCase() : null;
    const existingCustomer = cleanEmail
      ? await prisma.usuarios.findUnique({ where: { email: cleanEmail } })
      : null;

    const customerName = existingCustomer?.nome || nome_cliente;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.pedidos.create({
        data: {
          id_usuario: existingCustomer?.id_usuario || null,
          status: 'finalizado',
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100,
          desconto: Math.round((subtotal - total) * 100) / 100 > 0 ? Math.round((subtotal - total) * 100) / 100 : 0,
          metodo_pagamento: metodo_pagamento || null,
          nome_cliente: customerName,
          origem: 'presencial',
          observacoes_internas: observacoes_internas || null,
          data_pedido: data_pedido ? new Date(data_pedido) : new Date(),
          pedidoProdutos: {
            create: productData.map(({ product, variation, quantity }, idx) => ({
              id_produto: product.id_produto,
              sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
              quantidade: quantity,
              preco_unitario: items[idx].preco_unitario || product.preco,
            })),
          },
        },
        include: { pedidoProdutos: { include: { produto: true } } },
      });

      // 2. Reduce stock
      for (const { product, variation, quantity } of productData) {
        const updatedVariations = (product.variacoes_estoque || []).map(v => {
          if (v.tamanho === variation.tamanho && v.sku === variation.sku) {
            return { ...v, estoque: (v.estoque || 0) - quantity };
          }
          return v;
        });
        await tx.produtos.update({
          where: { id_produto: product.id_produto },
          data: { variacoes_estoque: updatedVariations },
        });
      }

      // 3. Log stock movements
      for (const { product, variation, quantity } of productData) {
        await tx.movimentacoes_estoque.create({
          data: {
            id_produto: product.id_produto,
            sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
            tipo: 'venda',
            quantidade: quantity,
            observacao: `Venda presencial - ${customerName}`,
          },
        });
      }

      // 4. Log in historico
      await tx.historico_pedidos.create({
        data: {
          id_pedido: order.id_pedido,
          tipo: 'note',
          descricao: `Venda presencial registrada. Cliente: ${customerName}${cleanEmail ? ` (${cleanEmail})` : ''}`,
          autor: 'admin',
        },
      });

      return order;
    });

    return sucesso(res, { mensagem: 'Venda presencial registrada', pedido: result }, 201);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
