import prisma from "../../database/prisma.js";
import { sucesso, erro } from "../../helpers/apiResponse.js";
import { isValidTransition, getAllStatuses } from "../../helpers/orderStatus.js";

function orderInclude() {
  return {
    usuario: { include: { enderecos: true } },
    pedidoProdutos: { include: { produto: true } },
  };
}

function normalizeOrder(order) {
  return {
    ...order,
    usuario: order.usuario
      ? {
          ...order.usuario,
          nome: order.usuario.nome || order.cliente_nome || "Cliente",
          email: order.usuario.email || order.cliente_email || "",
        }
      : {
          id_usuario: null,
          nome: order.cliente_nome || "Venda presencial",
          email: order.cliente_email || "",
          telefone: "",
          enderecos: order.endereco_entrega ? [order.endereco_entrega] : [],
        },
  };
}

export const getSalesData = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortDir, startDate, endDate } = req.query;

    const where = {};
    if (status && status !== "all") where.status = status;
    if (startDate || endDate) {
      where.data_pedido = {};
      if (startDate) where.data_pedido.gte = new Date(startDate);
      if (endDate) where.data_pedido.lte = new Date(endDate);
    }
    if (search && search.trim()) {
      where.OR = [
        { usuario: { nome: { contains: search.trim(), mode: "insensitive" } } },
        { cliente_nome: { contains: search.trim(), mode: "insensitive" } },
        { cliente_email: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const orderBy =
      sortBy === "total"
        ? { total: sortDir === "asc" ? "asc" : "desc" }
        : { data_pedido: "desc" };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
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
        prisma.pedidos.count({ where: { ...where, status: "finalizado" } }),
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
      return erro(
        res,
        `Status invalido. Valores permitidos: ${getAllStatuses().join(", ")}`
      );
    }

    const currentOrder = await prisma.pedidos.findUnique({
      where: { id_pedido: parseInt(id) },
    });

    if (!currentOrder) {
      return erro(res, "Pedido nao encontrado.", 404);
    }

    if (!isValidTransition(currentOrder.status, status)) {
      return erro(
        res,
        `Transicao de status invalida: "${currentOrder.status}" -> "${status}".`
      );
    }

    const order = await prisma.pedidos.update({
      where: { id_pedido: parseInt(id) },
      data: { status },
    });

    return sucesso(res, { mensagem: "Status atualizado", pedido: order });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return erro(res, "IDs sao obrigatorios");
    if (!getAllStatuses().includes(status))
      return erro(res, `Status invalido. Use: ${getAllStatuses().join(", ")}`);

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
        updated++;
      } else {
        skipped++;
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
      return erro(res, "Itens sao obrigatorios.");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.pedidos.findUnique({
        where: { id_pedido: orderId },
      });
      if (!order) throw new Error("Pedido nao encontrado.");

      const productIds = items.map((i) => Number(i.id_produto));
      const products = await tx.produtos.findMany({
        where: { id_produto: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id_produto, p]));
      const normalizedItems = items.map((item) => {
        const product = productMap.get(Number(item.id_produto));
        if (!product) {
          throw new Error(`Produto ${item.id_produto} nao encontrado.`);
        }
        const quantity = Math.max(1, Number(item.quantidade || item.quantity || 1));
        const unitPrice = Number(item.preco_unitario || product.preco || 0);
        return {
          id_produto: Number(item.id_produto),
          sku_variacao: item.sku_variacao || item.variacao || "UNICO",
          quantidade: quantity,
          preco_unitario: unitPrice,
        };
      });

      await tx.pedido_produtos.deleteMany({ where: { id_pedido: orderId } });
      await tx.pedido_produtos.createMany({
        data: normalizedItems.map((i) => ({ ...i, id_pedido: orderId })),
      });

      const subtotal = normalizedItems.reduce(
        (sum, i) => sum + i.preco_unitario * i.quantidade,
        0
      );
      const desconto = Number(order.desconto || 0);
      const frete = Number(order.frete || 0);
      const total = Math.max(0, subtotal - desconto + frete);

      return tx.pedidos.update({
        where: { id_pedido: orderId },
        data: {
          subtotal: Number(subtotal.toFixed(2)),
          total: Number(total.toFixed(2)),
        },
        include: orderInclude(),
      });
    });

    return sucesso(res, {
      mensagem: "Itens do pedido atualizados com sucesso.",
      pedido: normalizeOrder(updatedOrder),
    });
  } catch (error) {
    return erro(res, error.message, error.message.includes("nao encontrado") ? 404 : 400);
  }
};

export const updateOrderAddress = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { endereco } = req.body;

    if (!endereco || !endereco.logradouro || !endereco.numero || !endereco.cidade || !endereco.estado || !endereco.cep) {
      return erro(res, "Endereco incompleto. Informe logradouro, numero, cidade, estado e cep.");
    }

    const order = await prisma.pedidos.findUnique({ where: { id_pedido: orderId } });
    if (!order) return erro(res, "Pedido nao encontrado.", 404);

    const updatedOrder = await prisma.pedidos.update({
      where: { id_pedido: orderId },
      data: {
        endereco_entrega: {
          logradouro: endereco.logradouro,
          numero: endereco.numero,
          complemento: endereco.complemento || null,
          cidade: endereco.cidade,
          estado: endereco.estado,
          cep: endereco.cep,
        },
      },
      include: orderInclude(),
    });

    return sucesso(res, {
      mensagem: "Endereco do pedido atualizado com sucesso.",
      pedido: normalizeOrder(updatedOrder),
    });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const linkOrderCustomerByEmail = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return erro(res, "Email e obrigatorio.");

    const customer = await prisma.usuarios.findUnique({
      where: { email },
      include: { enderecos: true },
    });
    if (!customer) return erro(res, "Cliente nao encontrado.", 404);

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
        cliente_nome: customer.nome,
        cliente_email: customer.email,
        venda_presencial: true,
        ...(endereco ? { endereco_entrega: endereco } : {}),
      },
      include: orderInclude(),
    });

    return sucesso(res, {
      mensagem: "Cliente vinculado ao pedido com sucesso.",
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
