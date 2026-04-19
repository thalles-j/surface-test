import { createPreCheckoutWhatsApp, getCheckoutPreview } from '../services/checkoutService.js';
import { validateCoupon } from '../services/couponService.js';

export async function previewCheckoutController(req, res, next) {
  try {
    const { items } = req.body;
    const codigoCupom = req.body?.codigo ?? req.body?.codigo_cupom ?? null;
    const preview = await getCheckoutPreview(items, codigoCupom);
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
