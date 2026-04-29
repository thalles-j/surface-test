import { createPreCheckoutWhatsApp, getCheckoutPreview, createOrderFromCheckout } from '../services/checkoutService.js';
import { validateCoupon } from '../services/couponService.js';
import { calculateShipping } from '../services/shippingService.js';
import { getProvider } from '../services/payment/index.js';
import prisma from '../database/prisma.js';

export async function previewCheckoutController(req, res, next) {
  try {
    const { items, cep } = req.body;
    const codigoCupom = req.body?.codigo ?? req.body?.codigo_cupom ?? null;
    const preview = await getCheckoutPreview(items, codigoCupom, cep);
    return res.json(preview);
  } catch (error) {
    next(error);
  }
}

export async function validateCouponController(req, res, next) {
  try {
    const codigo = req.body?.codigo ?? req.body?.codigo_cupom;
    const coupon = await validateCoupon(codigo);
    return res.json({
      sucesso: true,
      cupom: {
        codigo: coupon.codigo,
        tipo: coupon.tipo,
        desconto: Number(coupon.desconto),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function preCheckoutController(req, res, next) {
  try {
    const result = await createPreCheckoutWhatsApp(req.body || {});
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function calculateShippingController(req, res, next) {
  try {
    const { cep, subtotal } = req.body || {};
    const result = await calculateShipping(cep, Number(subtotal || 0));
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrderController(req, res, next) {
  try {
    const order = await createOrderFromCheckout(req.body || {}, req.user || null);
    return res.status(201).json({
      sucesso: true,
      pedido: {
        id_pedido: order.id_pedido,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPaymentController(req, res, next) {
  try {
    const { id_pedido } = req.body || {};
    if (!id_pedido) throw new Error('ID do pedido é obrigatório.');

    const pedido = await prisma.pedidos.findUnique({
      where: { id_pedido: Number(id_pedido) },
      include: {
        pedidoProdutos: {
          include: { produto: true },
        },
      },
    });

    if (!pedido) throw new Error('Pedido não encontrado.');

    const provider = getProvider('mercado_pago');
    const payment = await provider.createPayment({
      id_pedido: pedido.id_pedido,
      nome_cliente: pedido.nome_cliente,
      email: pedido.endereco_entrega?.email || '',
      itens: pedido.pedidoProdutos.map((pp) => ({
        id_produto: pp.id_produto,
        nome_produto: pp.produto.nome_produto,
        quantidade: pp.quantidade,
        preco_unitario: Number(pp.preco_unitario),
      })),
    });

    return res.json({
      sucesso: true,
      checkoutUrl: payment.checkoutUrl,
      sandboxUrl: payment.sandboxUrl,
      paymentId: payment.paymentId,
    });
  } catch (error) {
    next(error);
  }
}

export async function mercadoPagoWebhookController(req, res, next) {
  try {
    const provider = getProvider('mercado_pago');
    const result = await provider.processWebhook(req.body, req.headers);

    if (result.processed && result.externalReference) {
      const idPedido = Number(result.externalReference);
      if (!Number.isNaN(idPedido)) {
        const statusMap = {
          approved: { status: 'confirmado', statusPagamento: 'aprovado' },
          pending: { status: 'pendente', statusPagamento: 'pendente' },
          in_process: { status: 'pendente', statusPagamento: 'em_processamento' },
          rejected: { status: 'pendente', statusPagamento: 'rejeitado' },
        };
        const mapped = statusMap[result.status] || { status: 'pendente', statusPagamento: 'pendente' };

        await prisma.pedidos.update({
          where: { id_pedido: idPedido },
          data: {
            status: mapped.status,
            status_pagamento: mapped.statusPagamento,
          },
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    // Sempre retornar 200 para o MP não reenviar
    console.error('[Webhook MP] Erro:', error?.message || error);
    return res.status(200).json({ received: false, error: error.message });
  }
}
