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

    const order = await prisma.pedidos.update({
      where: { id_pedido: parseInt(id) },
      data: { status },
    });

    return sucesso(res, { mensagem: 'Status atualizado', pedido: order });
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
