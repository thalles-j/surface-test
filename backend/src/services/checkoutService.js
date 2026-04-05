import { validateStock } from './orderService.js';
import { validateCoupon, applyCoupon } from './couponService.js';
import { calculateShipping } from './shippingService.js';

export async function getCheckoutPreview(items, codigoCupom) {
  const productData = await validateStock(items);

  const subtotal = productData.reduce(
    (sum, { product, quantity }) => sum + Number(product.preco) * quantity,
    0
  );

  let desconto = 0;
  let cupomAplicado = null;

  if (codigoCupom) {
    const coupon = await validateCoupon(codigoCupom);
    desconto = applyCoupon(coupon, subtotal);
    cupomAplicado = {
      codigo: coupon.codigo,
      tipo: coupon.tipo,
      valor: Number(coupon.desconto),
      descontoCalculado: desconto,
    };
  }

  const subtotalComDesconto = subtotal - desconto;
  const frete = await calculateShipping(subtotalComDesconto);
  const total = subtotalComDesconto + frete;

  return {
    itens: productData.map(({ product, variation, quantity }) => ({
      id_produto: product.id_produto,
      nome_produto: product.nome_produto,
      tamanho: variation.tamanho,
      sku: variation.sku,
      quantidade: quantity,
      preco_unitario: Number(product.preco),
      subtotal_item: Number(product.preco) * quantity,
    })),
    subtotal: Math.round(subtotal * 100) / 100,
    cupom: cupomAplicado,
    desconto: Math.round(desconto * 100) / 100,
    frete: Math.round(frete * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
