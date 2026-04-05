import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';

export const getAnalyticsOverview = async (req, res) => {
  try {
    const [orderAgg, userCount, visitAgg] = await Promise.all([
      prisma.pedidos.aggregate({ _sum: { total: true }, _count: true }),
      prisma.usuarios.count(),
      prisma.acessos.aggregate({ _sum: { count: true } }),
    ]);
    const totalRevenue = parseFloat(orderAgg._sum.total || 0);
    const totalOrders = orderAgg._count || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalVisits = visitAgg._sum.count || 0;
    const conversionRate = totalVisits > 0 ? ((totalOrders / totalVisits) * 100).toFixed(2) : '0.00';
    return res.json({ totalRevenue, totalOrders, totalCustomers: userCount, avgOrderValue, conversionRate: `${conversionRate}%` });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getConversionFunnel = async (req, res) => {
  try {
    const [visitAgg, orderCount] = await Promise.all([
      prisma.acessos.aggregate({ _sum: { count: true } }),
      prisma.pedidos.count(),
    ]);
    const visits = visitAgg._sum.count || 0;
    const addedToCart = Math.round(visits * 0.10);
    const checkouts = Math.round(addedToCart * 0.40);
    const purchases = orderCount;
    const conversionRate = visits > 0 ? ((purchases / visits) * 100).toFixed(2) : '0.00';
    return res.json({ visits, addedToCart, checkouts, purchases, conversionRate });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getChannelData = async (req, res) => {
  try {
    const visitsByPath = await prisma.acessos.findMany({ orderBy: { count: 'desc' } });
    const totalVisits = visitsByPath.reduce((sum, v) => sum + (v.count || 0), 0);

    if (totalVisits === 0) {
      return res.json([{ name: 'Direto', value: '100%', sessions: 0 }]);
    }

    const channels = {};
    visitsByPath.forEach((v) => {
      let channel = 'Direto';
      const path = (v.path || '').toLowerCase();
      if (path.includes('shop') || path.includes('product')) channel = 'Loja';
      else if (path.includes('admin')) channel = 'Admin';
      else channel = 'Landing Page';
      channels[channel] = (channels[channel] || 0) + (v.count || 0);
    });

    const result = Object.entries(channels)
      .map(([name, sessions]) => ({ name, value: `${((sessions / totalVisits) * 100).toFixed(0)}%`, sessions }))
      .sort((a, b) => b.sessions - a.sessions);

    return res.json(result);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const hitVisit = async (req, res) => {
  try {
    const p = req.body.path || '/';
    const visit = await prisma.acessos.upsert({
      where: { path: p },
      create: { path: p, count: 1, ultimo_acesso: new Date() },
      update: { count: { increment: 1 }, ultimo_acesso: new Date() },
    });
    return res.json({ mensagem: 'Hit registrado', visit });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getVisits = async (req, res) => {
  try {
    const visits = await prisma.acessos.findMany({ orderBy: { criado_em: 'desc' } });
    return res.json(visits || []);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

/**
 * Vendas por categoria (dados reais)
 */
export const getCategorySales = async (req, res) => {
  try {
    const categories = await prisma.categorias.findMany({
      include: {
        produtos: {
          include: {
            pedidos: {
              select: { quantidade: true, preco_unitario: true },
            },
          },
        },
      },
    });

    const result = categories.map(cat => {
      let totalVendido = 0;
      let totalItens = 0;
      for (const p of cat.produtos) {
        for (const pp of (p.pedidos || [])) {
          totalVendido += Number(pp.preco_unitario) * pp.quantidade;
          totalItens += pp.quantidade;
        }
      }
      return { name: cat.nome_categoria, value: totalVendido, items: totalItens };
    }).filter(c => c.value > 0 || c.items > 0);

    return res.json(result);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

/**
 * Pedidos recentes (últimos 10)
 */
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await prisma.pedidos.findMany({
      take: 10,
      orderBy: { data_pedido: 'desc' },
      include: {
        usuario: { select: { nome: true, email: true } },
        pedidoProdutos: { select: { quantidade: true } },
      },
    });
    const result = orders.map(o => ({
      id: o.id_pedido,
      client: o.usuario?.nome || '—',
      email: o.usuario?.email || '',
      total: Number(o.total),
      status: o.status,
      date: o.data_pedido,
      itemCount: o.pedidoProdutos.reduce((s, p) => s + p.quantidade, 0),
    }));
    return res.json(result);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
