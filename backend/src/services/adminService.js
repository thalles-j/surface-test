import prisma from '../database/prisma.js';
import { ErroValidation, ErroBase } from '../errors/index.js';
import bcrypt from 'bcryptjs';

// Helper para agrupar por mês em formato legível
const monthName = (date) => new Date(date).toLocaleDateString('pt-BR', { month: 'short' });

// ===== DASHBOARD =====

export const getDashboardStats = async (req, res) => {
  try {
    const orders = await prisma.pedidos.findMany();
    const products = await prisma.produtos.findMany();

    const now = new Date();
    const monthlyRevenue = orders
      .filter(o => new Date(o.data_pedido).getMonth() === now.getMonth())
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    const avgTicket = orders.length > 0 ? monthlyRevenue / orders.length : 0;

    return res.json({
      monthlyRevenue,
      ordersCount: orders.length,
      avgTicket,
      conversionRate: 3.2,
      productsCount: products.length,
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getRevenueData = async (req, res) => {
  try {
    const orders = await prisma.pedidos.findMany();
    const grouped = {};
    orders.forEach(o => {
      const m = monthName(o.data_pedido);
      grouped[m] = (grouped[m] || 0) + parseFloat(o.total);
    });

    // Converte para array ordenado por mês (apenas meses encontrados)
    const result = Object.entries(grouped).map(([month, value]) => ({ month, value }));
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    // Agrega vendas por produto
    const items = await prisma.pedido_produtos.findMany({ include: { produto: true } });
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
    return res.status(500).json({ erro: error.message });
  }
};

// ===== SALES / ORDERS =====

export const getSalesData = async (req, res) => {
  try {
    const orders = await prisma.pedidos.findMany({
      include: { usuario: true, pedidoProdutos: { include: { produto: true } } },
      orderBy: { data_pedido: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
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
    return res.status(500).json({ erro: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.pedidos.update({ where: { id_pedido: parseInt(id) }, data: { status } });
    return res.json({ mensagem: 'Pedido atualizado', pedido: order });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== ANALYTICS =====

export const getAnalyticsOverview = async (req, res) => {
  try {
    const orders = await prisma.pedidos.findMany();
    const users = await prisma.usuarios.findMany();
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    return res.json({ totalRevenue, totalOrders: orders.length, totalCustomers: users.length, avgOrderValue, conversionRate: '3.2%' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getConversionFunnel = async (req, res) => {
  try {
    const visits = 12400, addedToCart = 1200, checkouts = 450, purchases = 128;
    return res.json({ visits, addedToCart, checkouts, purchases, conversionRate: ((purchases / visits) * 100).toFixed(2) });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getChannelData = async (req, res) => {
  try {
    const channels = [
      { name: 'Instagram', value: '55%', sessions: 6820 },
      { name: 'Tráfego Pago', value: '30%', sessions: 3720 },
      { name: 'Orgânico/Google', value: '15%', sessions: 1860 },
    ];
    return res.json(channels);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== INVENTORY =====

export const getInventoryStatus = async (req, res) => {
  try {
    const products = await prisma.produtos.findMany({ include: { categoria: true, fotos: true } });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await prisma.produtos.findMany();
    const low = products.filter(p => {
      const vars = p.variacoes_estoque || [];
      if (!Array.isArray(vars) || vars.length === 0) return false;
      return vars.some(v => (v.estoque || 0) <= (v.minStock || 5));
    });
    return res.json(low);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variacoes_estoque, stock } = req.body;
    const product = await prisma.produtos.findUnique({ where: { id_produto: parseInt(productId) } });
    if (!product) return res.status(404).json({ erro: 'Produto não encontrado' });

    let updated;
    if (Array.isArray(variacoes_estoque)) {
      updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque } });
    } else if (typeof stock === 'number') {
      // atualiza a primeira variação (fallback)
      const vars = product.variacoes_estoque || [];
      if (Array.isArray(vars) && vars.length > 0) {
        vars[0].estoque = stock;
        updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque: vars } });
      } else {
        updated = await prisma.produtos.update({ where: { id_produto: parseInt(productId) }, data: { variacoes_estoque: [{ tamanho: 'Único', sku: `${productId}-UN`, estoque: stock }] } });
      }
    } else {
      return res.status(400).json({ erro: 'Dados de estoque inválidos' });
    }

    return res.json({ mensagem: 'Estoque atualizado', produto: updated });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== CUSTOMERS =====

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.usuarios.findMany({ include: { pedidos: true } });
    const formatted = customers.map(c => ({
      id: c.id_usuario,
      name: c.nome,
      email: c.email,
      totalSpent: c.pedidos?.reduce((s, o) => s + parseFloat(o.total), 0) || 0,
      ordersCount: c.pedidos?.length || 0,
      type: c.pedidos?.length > 3 ? 'VIP' : c.pedidos?.length > 0 ? 'Recorrente' : 'Novo',
      registered: c.data_cadastro,
    }));
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.usuarios.findUnique({ where: { id_usuario: parseInt(id) }, include: { pedidos: true } });
    return res.json(customer);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getCustomerClassification = async (req, res) => {
  try {
    const customers = await prisma.usuarios.findMany({ include: { pedidos: true } });
    const classification = {
      vip: customers.filter(c => c.pedidos?.length > 3).length,
      recorrente: customers.filter(c => c.pedidos?.length >= 2 && c.pedidos?.length <= 3).length,
      novo: customers.filter(c => c.pedidos?.length <= 1).length,
    };
    return res.json(classification);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== COLLECTIONS (DROPS) ===== (kept as mock for now)
export const getCollections = async (req, res) => {
  try {
    const collections = [
      { id: 1, name: 'Drop 01 - Void Series', launchDate: '2024-11-15', status: 'Planejado', locked: false, products: 8 },
      { id: 2, name: 'Essentials Winter', launchDate: '2024-12-01', status: 'Ativo', locked: false, products: 12 },
    ];
    return res.json(collections);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, launchDate, status } = req.body;
    const collection = { id: Date.now(), name, launchDate, status };
    return res.status(201).json(collection);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    return res.json({ mensagem: 'Coleção atualizada' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    return res.json({ mensagem: 'Coleção deletada' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const toggleCollectionLock = async (req, res) => {
  try {
    const { locked } = req.body;
    return res.json({ mensagem: `Coleção ${locked ? 'travada' : 'desbloqueada'}` });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== CATEGORIES =====
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.categorias.findMany({ include: { _count: { select: { produtos: true } } } });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.categorias.create({ data: { nome_categoria: name, descricao: description || '' } });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await prisma.categorias.update({ where: { id_categoria: parseInt(id) }, data: { nome_categoria: name, descricao: description } });
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.categorias.delete({ where: { id_categoria: parseInt(id) } });
    return res.json({ mensagem: 'Categoria deletada' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== MARKETING =====
export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.cupons.findMany();
    return res.json(coupons);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { codigo, desconto, tipo, validade } = req.body;
    const coupon = await prisma.cupons.create({ data: { codigo, desconto: parseFloat(desconto), tipo, validade: validade ? new Date(validade) : null } });
    return res.status(201).json(coupon);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cupons.delete({ where: { id_cupom: parseInt(id) } });
    return res.json({ mensagem: 'Cupom deletado' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campanhas.findMany();
    return res.json(campaigns);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { nome, data_inicio, data_fim, orcamento } = req.body;
    const campaign = await prisma.campanhas.create({ data: { nome, data_inicio: data_inicio ? new Date(data_inicio) : null, data_fim: data_fim ? new Date(data_fim) : null, orcamento: orcamento ? parseFloat(orcamento) : null } });
    return res.status(201).json(campaign);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== STORE SETTINGS =====
export const getStoreSettings = async (req, res) => {
  try {
    const settings = await prisma.configuracoes_loja.findFirst();
    return res.json(settings || {});
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateStoreSettings = async (req, res) => {
  try {
    const data = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { ...data }, update: { ...data } });
    return res.json({ mensagem: 'Configurações atualizadas', settings: upserted });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== CUSTOMIZATION =====
export const getCustomizationSettings = async (req, res) => {
  try {
    const settings = await prisma.configuracoes_loja.findFirst();
    return res.json(settings || {});
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateCustomization = async (req, res) => {
  try {
    const data = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { ...data }, update: { ...data } });
    return res.json({ mensagem: 'Customizações atualizadas', customization: upserted });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const uploadBanner = async (req, res) => {
  try {
    // Espera que o upload já tenha sido tratado pela rota /api/upload que devolve a URL
    const { bannerUrl } = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { banner_url: bannerUrl }, update: { banner_url: bannerUrl } });
    return res.json({ bannerUrl: upserted.banner_url });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

// ===== ADMIN MANAGEMENT =====
export const getAdminUsers = async (req, res) => {
  try {
    const admins = await prisma.usuarios.findMany({ where: { id_role: 1 } });
    return res.json(admins);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { nome, email, senha, id_role } = req.body;
    const hash = await bcrypt.hash(senha || 'changeme', 10);
    const user = await prisma.usuarios.create({ data: { nome, email, senha: hash, id_role: id_role || 1 } });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.senha) updates.senha = await bcrypt.hash(updates.senha, 10);
    const user = await prisma.usuarios.update({ where: { id_usuario: parseInt(id) }, data: updates });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.usuarios.delete({ where: { id_usuario: parseInt(id) } });
    return res.json({ mensagem: 'Admin deletado' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = [
      { id: 1, action: 'Produto criado', user: 'João Manager', timestamp: '2024-10-26 14:30', details: 'Camiseta Boxy Logo' },
      { id: 2, action: 'Pedido aprovado', user: 'Maria Editor', timestamp: '2024-10-26 13:20', details: '#1024' },
      { id: 3, action: 'Cupom criado', user: 'Admin Master', timestamp: '2024-10-26 11:00', details: 'BLACK20 - 20%' },
    ];
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
