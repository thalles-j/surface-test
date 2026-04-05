import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';
import { isValidTransition, getAllStatuses } from '../../helpers/orderStatus.js';

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
      where.usuario = { nome: { contains: search.trim(), mode: 'insensitive' } };
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
            usuario: { include: { enderecos: true } },
            pedidoProdutos: { include: { produto: true } },
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

    const orders = await prisma.pedidos.findMany({
      include: {
        usuario: { include: { enderecos: true } },
        pedidoProdutos: { include: { produto: true } },
      },
      orderBy,
    });
    return res.json(orders);
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
    const orderId = parseInt(id);

    if (!getAllStatuses().includes(status)) {
      return erro(res, `Status inválido. Valores permitidos: ${getAllStatuses().join(', ')}`);
    }

    const currentOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: orderId },
    });

    if (!currentOrder) {
      return erro(res, 'Pedido não encontrado.', 404);
    }

    if (!isValidTransition(currentOrder.status, status)) {
      return erro(res, `Transição de status inválida: "${currentOrder.status}" → "${status}".`);
    }

    const [order] = await prisma.$transaction([
      prisma.pedidos.update({
        where: { id_pedido: orderId },
        data: { status },
      }),
      prisma.historico_pedidos.create({
        data: {
          id_pedido: orderId,
          tipo: 'status_change',
          descricao: `Status alterado de "${currentOrder.status}" para "${status}"`,
          status_de: currentOrder.status,
          status_para: status,
          autor: req.user?.email || 'admin',
        },
      }),
    ]);

    const historico = await prisma.historico_pedidos.findMany({
      where: { id_pedido: orderId },
      orderBy: { criado_em: 'desc' },
    });

    return sucesso(res, { mensagem: 'Status atualizado', pedido: order, historico });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const historico = await prisma.historico_pedidos.findMany({
      where: { id_pedido: parseInt(id) },
      orderBy: { criado_em: 'desc' },
    });
    return res.json(historico);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return erro(res, 'IDs são obrigatórios');
    if (!getAllStatuses().includes(status)) return erro(res, `Status inválido. Use: ${getAllStatuses().join(', ')}`);

    const numericIds = ids.map(Number);
    const orders = await prisma.pedidos.findMany({
      where: { id_pedido: { in: numericIds } },
    });

    const operations = [];
    let skipped = 0;

    for (const order of orders) {
      if (isValidTransition(order.status, status)) {
        operations.push(
          prisma.pedidos.update({ where: { id_pedido: order.id_pedido }, data: { status } })
        );
        operations.push(
          prisma.historico_pedidos.create({
            data: {
              id_pedido: order.id_pedido,
              tipo: 'status_change',
              descricao: `Status alterado de "${order.status}" para "${status}" (bulk)`,
              status_de: order.status,
              status_para: status,
              autor: req.user?.email || 'admin',
            },
          })
        );
      } else {
        skipped++;
      }
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    const updated = orders.length - skipped;
    return sucesso(res, { mensagem: `${updated} pedidos atualizados, ${skipped} ignorados (transição inválida)`, updated, skipped });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
