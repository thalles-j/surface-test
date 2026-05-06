import prisma from '../database/prisma.js';
import { ErroValidation } from '../errors/index.js';

export function normalizeCouponCode(codigo) {
  return String(codigo || '').trim().toUpperCase();
}

export function normalizeCouponType(tipo) {
  const normalized = String(tipo || '').trim().toLowerCase();

  if (
    normalized === 'porcentagem' ||
    normalized === 'percentual' ||
    normalized === 'percentage' ||
    normalized === 'percent'
  ) {
    return 'porcentagem';
  }

  if (
    normalized === 'fixo' ||
    normalized === 'fixed' ||
    normalized === 'valor fixo' ||
    normalized === 'valor_fixo'
  ) {
    return 'fixo';
  }

  throw new ErroValidation('Tipo de cupom invalido. Use porcentagem ou fixo.');
}

function getCouponExpiryDate(validade) {
  if (!validade) return null;

  const expiry = new Date(validade);

  if (Number.isNaN(expiry.getTime())) {
    throw new ErroValidation('Data de validade do cupom invalida.');
  }

  const isDateOnly =
    expiry.getUTCHours() === 0 &&
    expiry.getUTCMinutes() === 0 &&
    expiry.getUTCSeconds() === 0 &&
    expiry.getUTCMilliseconds() === 0;

  if (isDateOnly) {
    const year = expiry.getUTCFullYear();
    const month = expiry.getUTCMonth();
    const day = expiry.getUTCDate();
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  return expiry;
}

export function normalizeCouponData(data = {}) {
  const codigo = normalizeCouponCode(data.codigo);
  const tipo = normalizeCouponType(data.tipo);
  const desconto = Number(data.desconto);
  const validade = data.validade ? getCouponExpiryDate(data.validade) : null;
  const limiteUsos =
    data.limite_usos == null || data.limite_usos === ''
      ? null
      : Number(data.limite_usos);

  if (!codigo) {
    throw new ErroValidation('Codigo do cupom e obrigatorio.');
  }

  if (!Number.isFinite(desconto) || desconto <= 0) {
    throw new ErroValidation('Desconto do cupom deve ser maior que zero.');
  }

  if (tipo === 'porcentagem' && desconto > 100) {
    throw new ErroValidation('Cupom percentual nao pode ser maior que 100%.');
  }

  if (limiteUsos != null && (!Number.isInteger(limiteUsos) || limiteUsos < 1)) {
    throw new ErroValidation('Limite de usos invalido.');
  }

  return {
    codigo,
    desconto,
    tipo,
    validade,
    limite_usos: limiteUsos,
    ativo: data.ativo !== false,
  };
}

export async function validateCoupon(codigo) {
  const normalizedCode = normalizeCouponCode(codigo);

  if (!normalizedCode) {
    throw new ErroValidation('Codigo do cupom e obrigatorio.');
  }

  const coupon = await prisma.cupons.findUnique({
    where: { codigo: normalizedCode },
  });

  if (!coupon) {
    throw new ErroValidation('Cupom nao encontrado.');
  }

  if (!coupon.ativo) {
    throw new ErroValidation('Este cupom esta inativo.');
  }

  const validade = getCouponExpiryDate(coupon.validade);

  if (validade && validade < new Date()) {
    throw new ErroValidation('Este cupom expirou.');
  }

  if (coupon.limite_usos != null && coupon.usos >= coupon.limite_usos) {
    throw new ErroValidation('Este cupom atingiu o limite de usos.');
  }

  return {
    ...coupon,
    codigo: normalizeCouponCode(coupon.codigo),
    tipo: normalizeCouponType(coupon.tipo),
    desconto: Number(coupon.desconto),
    validade,
  };
}

export function applyCoupon(coupon, subtotal) {
  let normalizedType;
  try {
    normalizedType = normalizeCouponType(coupon?.tipo);
  } catch {
    return 0;
  }

  const subtotalValue = Number(subtotal) || 0;
  const discountValue = Number(coupon?.desconto) || 0;
  let desconto = 0;

  if (normalizedType === 'porcentagem') {
    desconto = subtotalValue * (discountValue / 100);
  } else if (normalizedType === 'fixo') {
    desconto = discountValue;
  }

  desconto = Math.min(desconto, subtotalValue);

  return Math.round(desconto * 100) / 100;
}

export async function incrementCouponUsage(tx, codigo) {
  await tx.cupons.update({
    where: { codigo: normalizeCouponCode(codigo) },
    data: { usos: { increment: 1 } },
  });
}
