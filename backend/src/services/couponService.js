import prisma from '../database/prisma.js';
import { ErroValidation } from '../errors/index.js';

export async function validateCoupon(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    throw new ErroValidation('Código do cupom é obrigatório.');
  }

  const coupon = await prisma.cupons.findUnique({
    where: { codigo: codigo.trim().toUpperCase() },
  });

  if (!coupon) {
    throw new ErroValidation('Cupom não encontrado.');
  }

  if (!coupon.ativo) {
    throw new ErroValidation('Este cupom está inativo.');
  }

  if (coupon.validade && new Date(coupon.validade) < new Date()) {
    throw new ErroValidation('Este cupom expirou.');
  }

  if (coupon.limite_usos != null && coupon.usos >= coupon.limite_usos) {
    throw new ErroValidation('Este cupom atingiu o limite de usos.');
  }

  return coupon;
}

export function applyCoupon(coupon, subtotal) {
  let desconto = 0;

  if (coupon.tipo === 'porcentagem') {
    desconto = Number(subtotal) * (Number(coupon.desconto) / 100);
  } else if (coupon.tipo === 'fixo') {
    desconto = Number(coupon.desconto);
  }

  // Discount cannot exceed subtotal
  desconto = Math.min(desconto, Number(subtotal));

  return Math.round(desconto * 100) / 100;
}

export async function incrementCouponUsage(tx, codigo) {
  await tx.cupons.update({
    where: { codigo },
    data: { usos: { increment: 1 } },
  });
}
