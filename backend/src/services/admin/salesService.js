import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';
import { isValidTransition, getAllStatuses } from '../../helpers/orderStatus.js';
import { sendOrderStatusUpdate } from '../emailService.js';

function orderInclude() {
  return {
    usuario: { include: { enderecos: true } },
    pedidoProdutos: { include: { produto: true } },
    historico: { orderBy: { criado_em: 'desc' } },
  };
}

function normalizeOrder(order) {
  const fallbackName = order.nome_cliente || order.cliente_nome || 'Cliente';
  const fallbackEmail = order.cliente_email || '';
  const origem = order.origem || (order.venda_presencial ? 'presencial' : 'online');

  return {
    ...order,
    origem,
    nome_cliente: order.nome_cliente || order.cliente_nome || null,
    cliente_nome: order.cliente_nome || order.nome_cliente || null,
    usuario: order.usuario
      ? {
          ...order.usuario,
          nome: order.usuario.nome || fallbackName,
          email: order.usuario.email || fallbackEmail,
        }
      : {
          id_usuario: null,
          nome: fallbackName,
          email: fallbackEmail,
          telefone: '',
          enderecos: order.endereco_entrega ? [order.endereco_entrega] : [],
        },
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
        { usuario: { nome: { contains: term, mode: 'insensitive' } } },
        { nome_cliente: { contains: term, mode: 'insensitive' } },
        { cliente_nome: { contains: term, mode: 'insensitive' } },
        { cliente_email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy === 'total'
      ? { total: sortDir === 'asc' ? 'asc' : 'desc' }
      : { data_pedido: 'desc' };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

      const [ordersRaw, total, revenueAgg, finalizedCount] = await Promise.all([
        prisma.pedidos.findMany({
          where,
          include: orderInclude(),
          orderBy,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.pedidos.count({ where }),
        prisma.pedidos.aggregate({ where, _sum: { total: true } }),
        prisma.pedidos.count({ where: { ...where, status: 'finalizado' } }),
      ]);

      const orders = ordersRaw.map(normalizeOrder);
      const totalRevenue = parseFloat(revenueAgg._sum.total || 0);

      return res.json({
        data: orders,
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

    const ordersRaw = await prisma.pedidos.findMany({
      include: orderInclude(),
      orderBy,
    });

    return res.json(ordersRaw.map(normalizeOrder));
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

    const ordersRaw = await prisma.pedidos.findMany({ where, include: orderInclude() });
    return res.json(ordersRaw.map(normalizeOrder));
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!getAllStatuses().includes(status)) {
      return erro(res, `Status invalido. Valores permitidos: ${getAllStatuses().join(', ')}`);
    }

    const currentOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: parseInt(id, 10) },
    });

    if (!currentOrder) {
      return erro(res, 'Pedido nao encontrado.', 404);
    }

    if (!isValidTransition(currentOrder.status, status)) {
      return erro(res, `Transicao de status invalida: "${currentOrder.status}" -> "${status}".`);
    }

    await prisma.$transaction([
      prisma.pedidos.update({
        where: { id_pedido: parseInt(id, 10) },
        data: { status },
      }),
      prisma.historico_pedidos.create({
        data: {
          id_pedido: parseInt(id, 10),
          tipo: 'status_change',
          descricao: `Status alterado de "${currentOrder.status}" para "${status}"`,
          status_de: currentOrder.status,
          status_para: status,
          autor: 'admin',
        },
      }),
    ]);

    const updatedOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: parseInt(id, 10) },
      include: orderInclude(),
    });

    sendOrderStatusUpdate({
      order: updatedOrder,
      statusDe: currentOrder.status,
      statusPara: status,
    });

    return sucesso(res, { mensagem: 'Status atualizado', pedido: normalizeOrder(updatedOrder) });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return erro(res, 'IDs sao obrigatorios');
    }

    if (!getAllStatuses().includes(status)) {
      return erro(res, `Status invalido. Use: ${getAllStatuses().join(', ')}`);
    }

    const orders = await prisma.pedidos.findMany({
      where: { id_pedido: { in: ids.map(Number) } },
    });

    let updated = 0;
    let skipped = 0;

    for (const order of orders) {
      if (isValidTransition(order.status, status)) {
        await prisma.pedidos.update({
          where: { id_pedido: order.id_pedido },
          data: { status },
        });
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    return sucesso(res, {
      mensagem: `${updated} pedidos atualizados, ${skipped} ignorados (transicao invalida)`,
      updated,
      skipped,
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateOrderItems = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return erro(res, 'Itens sao obrigatorios.');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.pedidos.findUnique({ where: { id_pedido: orderId } });
      if (!order) throw new Error('Pedido nao encontrado.');

      const productIds = items.map((i) => Number(i.id_produto || i.produto_id));
      const products = await tx.produtos.findMany({ where: { id_produto: { in: productIds } } });

      const productMap = new Map(products.map((p) => [p.id_produto, p]));
      const normalizedItems = items.map((item) => {
        const nextProductId = Number(item.id_produto || item.produto_id);
        const product = productMap.get(nextProductId);
        if (!product) throw new Error(`Produto ${nextProductId} nao encontrado.`);

        const quantity = Math.max(1, Number(item.quantidade || item.quantity || 1));
        const unitPrice = Number(item.preco_unitario || product.preco || 0);
        const requestedVariation = String(
          item.variacao || item.sku_variacao || item.tamanho || item.selectedSize || ''
        ).trim();

        const productVariations = Array.isArray(product.variacoes_estoque) ? product.variacoes_estoque : [];
        const matchedVariation = productVariations.find(
          (v) => String(v.tamanho || '').trim() === requestedVariation || String(v.sku || '').trim() === requestedVariation
        );

        if (productVariations.length > 0 && !matchedVariation) {
          throw new Error(`Variacao ${requestedVariation || '(vazia)'} nao encontrada para ${product.nome_produto}.`);
        }

        if (matchedVariation && Number(matchedVariation.estoque || 0) < quantity) {
          throw new Error(
            `Estoque insuficiente para ${product.nome_produto} (${matchedVariation.tamanho || matchedVariation.sku}).`
          );
        }

        const resolvedSku = matchedVariation?.sku || requestedVariation || 'UNICO';

        return {
          id_item: item.id_item ? Number(item.id_item) : null,
          id_produto: nextProductId,
          sku_variacao: resolvedSku,
          variacao: matchedVariation?.tamanho || requestedVariation || 'UNICO',
          quantidade: quantity,
          preco_unitario: unitPrice,
          nome_produto: product.nome_produto,
        };
      });

      await tx.pedido_produtos.deleteMany({ where: { id_pedido: orderId } });
      await tx.pedido_produtos.createMany({
        data: normalizedItems.map((i) => ({
          id_pedido: orderId,
          id_produto: i.id_produto,
          sku_variacao: i.sku_variacao,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
      });

      const subtotal = normalizedItems.reduce((sum, i) => sum + i.preco_unitario * i.quantidade, 0);
      const desconto = Number(order.desconto || 0);
      const frete = Number(order.frete || 0);
      const total = Math.max(0, subtotal - desconto + frete);

      await tx.historico_pedidos.create({
        data: {
          id_pedido: orderId,
          tipo: 'note',
          descricao: `Itens do pedido atualizados. Novo subtotal: R$ ${subtotal.toFixed(2)}`,
          autor: 'admin',
        },
      });

      const updated = await tx.pedidos.update({
        where: { id_pedido: orderId },
        data: {
          subtotal: Number(subtotal.toFixed(2)),
          total: Number(total.toFixed(2)),
        },
        include: orderInclude(),
      });

      return {
        pedido: updated,
        itens: normalizedItems.map((i, idx) => ({
          id_item: i.id_item || idx + 1,
          produto_id: i.id_produto,
          nome: i.nome_produto,
          variacao: i.variacao,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
      };
    });

    return sucesso(res, {
      pedido: {
        id_pedido: updatedOrder.pedido.id_pedido,
        subtotal: Number(updatedOrder.pedido.subtotal || 0),
        total: Number(updatedOrder.pedido.total || 0),
        itens: updatedOrder.itens,
      },
    });
  } catch (error) {
    return erro(res, error.message, error.message.includes('nao encontrado') ? 404 : 400);
  }
};

export const updateOrderAddress = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const source = req.body?.endereco || req.body?.endereco_entrega || null;

    const order = await prisma.pedidos.findUnique({ where: { id_pedido: orderId } });
    if (!order) return erro(res, 'Pedido nao encontrado.', 404);

    const currentEndereco = order.endereco_entrega && typeof order.endereco_entrega === 'object'
      ? order.endereco_entrega
      : {};

    let endereco;
    if (typeof source === 'string') {
      const normalized = source.trim();
      if (!normalized) {
        return erro(res, 'Endereco incompleto. Informe logradouro, numero, cidade, estado e cep.');
      }

      endereco = {
        logradouro: normalized,
        numero: currentEndereco.numero || 'S/N',
        complemento: currentEndereco.complemento || null,
        cidade: currentEndereco.cidade || 'Nao informado',
        estado: currentEndereco.estado || 'NA',
        cep: currentEndereco.cep || '00000-000',
      };
    } else {
      endereco = {
        logradouro: source?.logradouro || currentEndereco.logradouro || null,
        numero: source?.numero || currentEndereco.numero || null,
        complemento: source?.complemento ?? currentEndereco.complemento ?? null,
        cidade: source?.cidade || currentEndereco.cidade || null,
        estado: source?.estado || currentEndereco.estado || null,
        cep: source?.cep || currentEndereco.cep || null,
      };
    }

    if (!endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.estado || !endereco.cep) {
      return erro(res, 'Endereco incompleto. Informe logradouro, numero, cidade, estado e cep.');
    }

    const updatedOrder = await prisma.pedidos.update({
      where: { id_pedido: orderId },
      data: { endereco_entrega: endereco },
      include: orderInclude(),
    });

    return sucesso(res, {
      mensagem: 'Endereco do pedido atualizado com sucesso.',
      pedido: normalizeOrder(updatedOrder),
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const linkOrderCustomerByEmail = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) return erro(res, 'Email e obrigatorio.');

    const customer = await prisma.usuarios.findUnique({
      where: { email },
      include: { enderecos: true },
    });

    if (!customer) return erro(res, 'Cliente nao encontrado.', 404);

    const endereco = customer.enderecos?.[0]
      ? {
          logradouro: customer.enderecos[0].logradouro,
          numero: customer.enderecos[0].numero,
          complemento: customer.enderecos[0].complemento || null,
          cidade: customer.enderecos[0].cidade,
          estado: customer.enderecos[0].estado,
          cep: customer.enderecos[0].cep,
        }
      : null;

    const updatedOrder = await prisma.pedidos.update({
      where: { id_pedido: orderId },
      data: {
        id_usuario: customer.id_usuario,
        nome_cliente: customer.nome,
        cliente_nome: customer.nome,
        cliente_email: customer.email,
        venda_presencial: true,
        origem: 'presencial',
        ...(endereco ? { endereco_entrega: endereco } : {}),
      },
      include: orderInclude(),
    });

    return sucesso(res, {
      mensagem: 'Cliente vinculado ao pedido com sucesso.',
      pedido: normalizeOrder(updatedOrder),
      cliente: {
        id: customer.id_usuario,
        nome: customer.nome,
        email: customer.email,
      },
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createInPersonSale = async (req, res) => {
  try {
    const { nome_cliente, cliente_email, metodo_pagamento, data_pedido, items, observacoes_internas } = req.body;

    if (!nome_cliente || !Array.isArray(items) || items.length === 0) {
      return erro(res, 'nome_cliente e items sao obrigatorios');
    }

    const normalizedEmail = String(cliente_email || '').trim().toLowerCase() || null;
    const existingCustomer = normalizedEmail
      ? await prisma.usuarios.findUnique({
          where: { email: normalizedEmail },
          select: { id_usuario: true, nome: true, email: true },
        })
      : null;

    const productData = [];

    for (const item of items) {
      const product = await prisma.produtos.findUnique({ where: { id_produto: item.id_produto } });
      if (!product) return erro(res, `Produto ID ${item.id_produto} nao encontrado`);

      const variations = Array.isArray(product.variacoes_estoque) ? product.variacoes_estoque : [];
      const variation = variations.find(
        (v) => v.tamanho === item.tamanho || v.sku === item.sku_variacao || v.tamanho === item.sku_variacao
      );

      if (!variation) {
        return erro(res, `Variacao "${item.tamanho || item.sku_variacao}" nao encontrada para "${product.nome_produto}"`);
      }

      if ((variation.estoque || 0) < item.quantidade) {
        return erro(
          res,
          `Estoque insuficiente para "${product.nome_produto}" (${variation.tamanho}). Disponivel: ${variation.estoque || 0}`
        );
      }

      productData.push({ product, variation, quantity: Number(item.quantidade), item });
    }

    const subtotal = productData.reduce((sum, { product, quantity }) => sum + Number(product.preco) * quantity, 0);
    const totalFromItems = productData.reduce(
      (sum, { item, quantity }) => sum + Number(item.preco_unitario || 0) * quantity,
      0
    );
    const total = totalFromItems > 0 ? totalFromItems : subtotal;
    const desconto = Math.max(0, Number((subtotal - total).toFixed(2)));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.pedidos.create({
        data: {
          status: 'finalizado',
          id_usuario: existingCustomer?.id_usuario || null,
          subtotal: Number(subtotal.toFixed(2)),
          total: Number(total.toFixed(2)),
          desconto,
          metodo_pagamento: metodo_pagamento || null,
          nome_cliente: existingCustomer?.nome || nome_cliente,
          cliente_nome: existingCustomer?.nome || nome_cliente,
          cliente_email: existingCustomer?.email || normalizedEmail,
          origem: 'presencial',
          venda_presencial: true,
          observacoes_internas: observacoes_internas || null,
          data_pedido: data_pedido ? new Date(data_pedido) : new Date(),
          pedidoProdutos: {
            create: productData.map(({ product, variation, quantity, item }) => ({
              id_produto: product.id_produto,
              sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
              quantidade: quantity,
              preco_unitario: Number(item.preco_unitario || product.preco),
            })),
          },
        },
        include: orderInclude(),
      });

      for (const { product, variation, quantity } of productData) {
        const updatedVariations = (product.variacoes_estoque || []).map((v) => {
          const sameVariation =
            (variation.sku && v.sku === variation.sku) ||
            (!variation.sku && v.tamanho === variation.tamanho) ||
            (v.tamanho === variation.tamanho && v.sku === variation.sku);

          if (sameVariation) {
            return { ...v, estoque: Math.max(0, Number(v.estoque || 0) - quantity) };
          }

          return v;
        });

        await tx.produtos.update({
          where: { id_produto: product.id_produto },
          data: { variacoes_estoque: updatedVariations },
        });

        await tx.movimentacoes_estoque.create({
          data: {
            id_produto: product.id_produto,
            sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
            tipo: 'venda',
            quantidade: quantity,
            observacao: `Venda presencial - ${nome_cliente}`,
          },
        });
      }

      await tx.historico_pedidos.create({
        data: {
          id_pedido: order.id_pedido,
          tipo: 'note',
          descricao: `Venda presencial registrada. Cliente: ${nome_cliente}`,
          autor: 'admin',
        },
      });

      return order;
    });

    return sucesso(res, { mensagem: 'Venda presencial registrada', pedido: normalizeOrder(result) }, 201);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
