import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';

export const getAllCustomers = async (req, res) => {
  try {
    const { search, page, limit, type, sortBy, sortDir } = req.query;
    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { nome: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { telefone: { contains: search.trim() } },
      ];
    }

    const includeOpts = {
      pedidos: { orderBy: { data_pedido: 'desc' } },
      enderecos: true,
    };

    let customers;
    let total;
    const pageNum = page ? Math.max(1, parseInt(page)) : null;
    const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit))) : null;

    if (pageNum && limitNum) {
      [customers, total] = await Promise.all([
        prisma.usuarios.findMany({
          where,
          include: includeOpts,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { data_cadastro: 'desc' },
        }),
        prisma.usuarios.count({ where }),
      ]);
    } else {
      customers = await prisma.usuarios.findMany({
        where,
        include: includeOpts,
      });
    }

    const formatted = customers.map(c => {
      const ordersCount = c.pedidos?.length || 0;
      const totalSpent = c.pedidos?.reduce((s, o) => s + parseFloat(o.total), 0) || 0;
      const ticketMedio = ordersCount > 0 ? totalSpent / ordersCount : 0;
      const ultimaCompra = c.pedidos?.[0]?.data_pedido || null;

      let customerType = 'Novo';
      if (ordersCount >= 5) customerType = 'VIP';
      else if (ordersCount >= 2) customerType = 'Recorrente';

      return {
        id: c.id_usuario,
        name: c.nome,
        email: c.email,
        phone: c.telefone || '',
        totalSpent,
        ordersCount,
        ticketMedio,
        ultimaCompra,
        type: customerType,
        registered: c.data_cadastro,
        addresses: (c.enderecos || []).map(e => ({
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          cidade: e.cidade,
          estado: e.estado,
          cep: e.cep,
        })),
      };
    });

    // Client-side type filter (classification depends on pedidos count, not a DB field)
    const filtered = type && type !== 'all'
      ? formatted.filter(c => c.type === type)
      : formatted;

    // Client-side sort
    if (sortBy === 'totalSpent') {
      filtered.sort((a, b) => sortDir === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent);
    } else if (sortBy === 'ordersCount') {
      filtered.sort((a, b) => sortDir === 'asc' ? a.ordersCount - b.ordersCount : b.ordersCount - a.ordersCount);
    }

    if (pageNum && limitNum) {
      return res.json({ data: filtered, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    }

    return res.json(formatted);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.usuarios.findUnique({
      where: { id_usuario: parseInt(id) },
      include: {
        pedidos: {
          include: { pedidoProdutos: { include: { produto: true } } },
          orderBy: { data_pedido: 'desc' },
        },
        enderecos: true,
      },
    });
    if (!customer) return erro(res, 'Cliente não encontrado', 404);

    const ordersCount = customer.pedidos?.length || 0;
    const totalSpent = customer.pedidos?.reduce((s, o) => s + parseFloat(o.total), 0) || 0;

    return res.json({
      id: customer.id_usuario,
      name: customer.nome,
      email: customer.email,
      phone: customer.telefone || '',
      registered: customer.data_cadastro,
      totalSpent,
      ordersCount,
      ticketMedio: ordersCount > 0 ? totalSpent / ordersCount : 0,
      addresses: customer.enderecos || [],
      orders: customer.pedidos.map(o => ({
        id: o.id_pedido,
        date: o.data_pedido,
        status: o.status,
        total: Number(o.total),
        items: (o.pedidoProdutos || []).map(pp => ({
          name: pp.produto?.nome_produto || 'Produto',
          qty: pp.quantidade,
          price: Number(pp.preco_unitario),
        })),
      })),
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getCustomerClassification = async (req, res) => {
  try {
    const customers = await prisma.usuarios.findMany({ include: { pedidos: true } });
    const classification = {
      vip: customers.filter(c => (c.pedidos?.length || 0) >= 5).length,
      recorrente: customers.filter(c => { const n = c.pedidos?.length || 0; return n >= 2 && n < 5; }).length,
      novo: customers.filter(c => (c.pedidos?.length || 0) <= 1).length,
      total: customers.length,
    };
    return res.json(classification);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
