import prisma from '../database/prisma.js';
import { ErroValidation, ErroBase } from '../errors/index.js';
import { validateCoupon, applyCoupon, incrementCouponUsage } from './couponService.js';
import { calculateShipping } from './shippingService.js';
import { logSaleMovements } from './admin/inventoryService.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeCustomerInfo(customerInfo = {}) {
  const nome = String(customerInfo.nome || '').trim();
  const email = normalizeEmail(customerInfo.email);
  const telefone = normalizePhone(customerInfo.telefone);

  return {
    nome: nome || null,
    email: email || null,
    telefone: telefone || null,
  };
}

/**
 * Validates stock availability for all items in the cart.
 * Returns the product records with their current variations for use in order creation.
 */
export async function validateStock(items) {
  const errors = [];
  const productData = [];

  for (const item of items) {
    const product = await prisma.produtos.findUnique({
      where: { id_produto: item.id_produto },
      include: { fotos: true },
    });

    if (!product) {
      errors.push(`Produto ID ${item.id_produto} não encontrado.`);
      continue;
    }

    if (String(product.status || '').toLowerCase() !== 'ativo') {
      errors.push(`Produto "${product.nome_produto}" está inativo e não pode ser comprado.`);
      continue;
    }

    const variations = Array.isArray(product.variacoes_estoque) ? product.variacoes_estoque : [];

    if (variations.length === 0) {
      errors.push(`Produto "${product.nome_produto}" não possui variações de estoque cadastradas.`);
      continue;
    }

    const variation = variations.find(
      (v) => v.tamanho === item.selectedSize || v.sku === item.sku_variacao
    );

    if (!variation) {
      errors.push(`Variação "${item.selectedSize || item.sku_variacao}" não encontrada para "${product.nome_produto}".`);
      continue;
    }

    if ((variation.estoque || 0) < item.quantity) {
      errors.push(
        `Estoque insuficiente para "${product.nome_produto}" (${variation.tamanho}). ` +
        `Disponível: ${variation.estoque || 0}, Solicitado: ${item.quantity}.`
      );
      continue;
    }

    productData.push({
      product,
      variation,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
    });
  }

  if (errors.length > 0) {
    throw new ErroValidation(errors.join(' '));
  }

  return productData;
}

/**
 * Reduces stock for each purchased variation within a transaction.
 * Must be called inside a prisma.$transaction.
 */
async function reduceStock(tx, productData) {
  for (const { product, variation, quantity } of productData) {
    const updatedVariations = (product.variacoes_estoque || []).map((v) => {
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
}

/**
 * Creates an order from the cart items.
 * - Validates stock
 * - Applies coupon discount (if provided)
 * - Calculates shipping
 * - Creates order + order items in a transaction
 * - Reduces stock atomically
 * - Increments coupon usage
 */
export async function createOrder(userId, items, codigoCupom = null, customerInfo = {}) {
  if (!items || items.length === 0) {
    throw new ErroValidation('Carrinho vazio.');
  }

  let customer = normalizeCustomerInfo(customerInfo);

  if (
    userId &&
    (!customer.nome || !customer.email || !customer.telefone || customer.telefone.length < 10)
  ) {
    const account = await prisma.usuarios.findUnique({
      where: { id_usuario: Number(userId) },
      select: { nome: true, email: true, telefone: true },
    });

    if (account) {
      customer = normalizeCustomerInfo({
        nome: customer.nome || account.nome,
        email: customer.email || account.email,
        telefone: customer.telefone || account.telefone,
      });
    }
  }

  if (!customer.nome) {
    throw new ErroValidation('Nome é obrigatório para continuar.');
  }
  if (!customer.email) {
    throw new ErroValidation('Email é obrigatório para continuar.');
  }
  if (!customer.telefone || customer.telefone.length < 10) {
    throw new ErroValidation('Telefone inválido.');
  }

  let linkedUserId = userId || null;

  if (!linkedUserId && customer.email) {
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: customer.email },
      select: { id_usuario: true },
    });
    if (existingUser) {
      linkedUserId = existingUser.id_usuario;
    }
  }

  // 1. Validate stock availability
  const productData = await validateStock(items);

  // 2. Calculate subtotal using current DB prices (not client-sent prices)
  const subtotal = productData.reduce(
    (sum, { product, quantity }) => sum + Number(product.preco) * quantity,
    0
  );

  // 3. Apply coupon if provided
  let desconto = 0;
  let cupomValidado = null;
  if (codigoCupom) {
    cupomValidado = await validateCoupon(codigoCupom);
    desconto = applyCoupon(cupomValidado, subtotal);
  }

  // 4. Calculate shipping
  const subtotalComDesconto = subtotal - desconto;
  const frete = await calculateShipping(subtotalComDesconto);

  // 5. Final total
  const total = subtotalComDesconto + frete;

  // 6. Create order + items + reduce stock + increment coupon in a single transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.pedidos.create({
      data: {
        id_usuario: linkedUserId,
        status: 'pendente',
        subtotal: Math.round(subtotal * 100) / 100,
        desconto: Math.round(desconto * 100) / 100,
        frete: Math.round(frete * 100) / 100,
        total: Math.round(total * 100) / 100,
        codigo_cupom: codigoCupom || null,
        nome_cliente: customer.nome,
        endereco_entrega: {
          contato: {
            nome: customer.nome,
            email: customer.email,
            telefone: customer.telefone,
          },
          email: customer.email,
          telefone: customer.telefone,
        },
        pedidoProdutos: {
          create: productData.map(({ product, variation, quantity }) => ({
            id_produto: product.id_produto,
            sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
            quantidade: quantity,
            preco_unitario: product.preco,
          })),
        },
      },
      include: {
        pedidoProdutos: { include: { produto: true } },
        usuario: { select: { id_usuario: true, nome: true, email: true, telefone: true } },
      },
    });

    // Reduce stock inside the same transaction
    await reduceStock(tx, productData);

    // Log stock movements for each sold variation
    await logSaleMovements(tx, productData.map(({ product, variation, quantity }) => ({
      id_produto: product.id_produto,
      sku_variacao: variation.sku || `${product.id_produto}-${variation.tamanho}`,
      quantidade: quantity,
    })));

    // Increment coupon usage inside the same transaction
    if (cupomValidado) {
      await incrementCouponUsage(tx, cupomValidado.codigo);
    }

    return newOrder;
  });

  return order;
}

/**
 * Lists orders for a specific user.
 */
export async function getOrdersByUser(userId) {
  return prisma.pedidos.findMany({
    where: { id_usuario: userId },
    include: {
      pedidoProdutos: { include: { produto: { include: { fotos: true } } } },
    },
    orderBy: { data_pedido: 'desc' },
  });
}

/**
 * Gets a single order by ID, only if it belongs to the user (or user is admin).
 */
export async function getOrderById(orderId, userId, isAdmin) {
  const order = await prisma.pedidos.findUnique({
    where: { id_pedido: orderId },
    include: {
      pedidoProdutos: { include: { produto: { include: { fotos: true } } } },
      usuario: { select: { id_usuario: true, nome: true, email: true, telefone: true } },
    },
  });

  if (!order) {
    throw new ErroBase('Pedido não encontrado.', 404);
  }

  if (!isAdmin && order.id_usuario !== userId) {
    throw new ErroBase('Acesso negado.', 403);
  }

  return order;
}
