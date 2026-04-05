import prisma from '../database/prisma.js';

export async function calculateShipping(subtotalAfterDiscount) {
  const settings = await prisma.configuracoes_loja.findFirst();

  if (!settings || settings.frete == null) {
    return 0;
  }

  const frete = Number(settings.frete) || 0;
  const freteGratisAcima = settings.frete_gratis_acima
    ? Number(settings.frete_gratis_acima)
    : null;

  if (freteGratisAcima && subtotalAfterDiscount >= freteGratisAcima) {
    return 0;
  }

  return frete;
}
