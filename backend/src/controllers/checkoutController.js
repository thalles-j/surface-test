import { getCheckoutPreview } from '../services/checkoutService.js';
import { validateCoupon } from '../services/couponService.js';

export async function previewCheckoutController(req, res, next) {
  try {
    const { items, codigo_cupom } = req.body;
    const preview = await getCheckoutPreview(items, codigo_cupom || null);
    return res.json(preview);
  } catch (error) {
    next(error);
  }
}

export async function validateCouponController(req, res, next) {
  try {
    const { codigo } = req.body;
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
