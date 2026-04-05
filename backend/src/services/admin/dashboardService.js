import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';

const monthName = (date) => new Date(date).toLocaleDateString('pt-BR', { month: 'short' });

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    // Allow filtering by month/year via query params
    const queryMonth = req.query.month == null ? now.getMonth() : Number.parseInt(req.query.month);
    const queryYear = req.query.year == null ? now.getFullYear() : Number.parseInt(req.query.year);

    const startOfMonth = new Date(queryYear, queryMonth, 1);
    const endOfMonth = new Date(queryYear, queryMonth + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(queryYear, queryMonth - 1, 1);
    const endOfLastMonth = new Date(queryYear, queryMonth, 0, 23, 59, 59);

    const [currentMonthOrders, lastMonthOrders, products, totalVisits] = await Promise.all([
      prisma.pedidos.findMany({ where: { data_pedido: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.pedidos.findMany({ where: { data_pedido: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.produtos.count(),
      prisma.acessos.aggregate({ _sum: { count: true } }),
    ]);

    const monthlyRevenue = currentMonthOrders.reduce((sum, o) => sum + Number.parseFloat(o.total), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number.parseFloat(o.total), 0);
    const revenueGrowth = lastMonthRevenue > 0 ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : '0.0';

    const ordersCount = currentMonthOrders.length;
    const lastMonthOrdersCount = lastMonthOrders.length;
    const ordersGrowth = lastMonthOrdersCount > 0 ? (((ordersCount - lastMonthOrdersCount) / lastMonthOrdersCount) * 100).toFixed(1) : '0.0';

    const avgTicket = ordersCount > 0 ? monthlyRevenue / ordersCount : 0;
    const lastAvgTicket = lastMonthOrdersCount > 0 ? lastMonthRevenue / lastMonthOrdersCount : 0;
    const avgTicketGrowth = lastAvgTicket > 0 ? (((avgTicket - lastAvgTicket) / lastAvgTicket) * 100).toFixed(1) : '0.0';

    const visits = totalVisits._sum.count || 0;
    const conversionRate = visits > 0 ? ((ordersCount / visits) * 100).toFixed(1) : '0.0';

    return sucesso(res, {
      monthlyRevenue,
      ordersCount,
      avgTicket,
      conversionRate: Number.parseFloat(conversionRate),
      productsCount: products,
      revenueGrowth: `${revenueGrowth}%`,
      ordersGrowth: `${ordersGrowth}%`,
      avgTicketGrowth: `${avgTicketGrowth}%`,
      periodo: { month: queryMonth, year: queryYear },
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getRevenueData = async (req, res) => {
  try {
    const months = Number.parseInt(req.query.months) || 12;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const orders = await prisma.pedidos.findMany({
      where: { data_pedido: { gte: startDate } },
    });

    // Build all months in range to ensure no gaps
    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      const m = d.getMonth();
      const y = d.getFullYear();
      const value = orders
        .filter(o => {
          const od = new Date(o.data_pedido);
          return od.getMonth() === m && od.getFullYear() === y;
        })
        .reduce((sum, o) => sum + Number.parseFloat(o.total), 0);
      result.push({ month: label, value: Math.round(value * 100) / 100 });
    }

    return res.json(result);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const items = await prisma.pedido_produtos.findMany({ include: { produto: { include: { fotos: true } } } });
    const map = new Map();
    items.forEach(it => {
      const id = it.id_produto;
      const prev = map.get(id) || { produto: it.produto, sold: 0 };
      prev.sold += it.quantidade;
      map.set(id, prev);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
    return res.json(arr);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
