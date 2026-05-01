import { createPreCheckoutWhatsApp, getCheckoutPreview, createOrderFromCheckout } from '../services/checkoutService.js';
import { validateCoupon } from '../services/couponService.js';
import { calculateShipping } from '../services/shippingService.js';

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
