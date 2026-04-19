import { calculateOrderPricing } from './orderService.js';
import { ErroValidation } from '../errors/index.js';
import { buildWhatsAppMessage } from '../helpers/whatsapp.js';

export async function getCheckoutPreview(items, codigoCupom) {
  const { productData, subtotal, desconto, frete, total, cupomValidado } =
    await calculateOrderPricing(items, codigoCupom);

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
    subtotal,
    cupom: cupomValidado
      ? {
          codigo: cupomValidado.codigo,
          tipo: cupomValidado.tipo,
          valor: Number(cupomValidado.desconto),
          descontoCalculado: desconto,
        }
      : null,
    desconto,
    frete,
    total,
  };
}

const ALLOWED_PAYMENT_TYPES = ['PIX', 'CARTAO', 'DINHEIRO'];
const PRE_CHECKOUT_WHATSAPP_NUMBER = '5524988582885';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function validatePreCheckoutPayload(payload = {}) {
  const nome = sanitizeText(payload.nome);
  const email = sanitizeText(payload.email);
  const telefone = String(payload.telefone || '').replace(/\D/g, '');
  const endereco = sanitizeText(payload.endereco);
  const tipo_pagamento = sanitizeText(payload.tipo_pagamento).toUpperCase();

  if (!nome) throw new ErroValidation('Nome e obrigatorio.');
  if (!email || !validateEmail(email)) throw new ErroValidation('Email invalido.');
  if (!telefone) throw new ErroValidation('Telefone e obrigatorio.');
  if (telefone.length < 10) throw new ErroValidation('Telefone invalido.');
  if (!endereco) throw new ErroValidation('Endereco e obrigatorio.');
  if (!tipo_pagamento) throw new ErroValidation('Tipo de pagamento e obrigatorio.');
  if (!ALLOWED_PAYMENT_TYPES.includes(tipo_pagamento)) {
    throw new ErroValidation('Tipo de pagamento invalido.');
  }

  return {
    nome,
    email,
    telefone,
    endereco,
    tipo_pagamento,
  };
}

export function buildPreCheckoutWhatsAppMessage(payload = {}) {
  const data = validatePreCheckoutPayload(payload);

  return `NOVO PRE-CHECKOUT

Nome: ${data.nome}
Email: ${data.email}
Telefone: ${data.telefone}
Endereco: ${data.endereco}
Pagamento: ${data.tipo_pagamento}`;
}

export function generatePreCheckoutWhatsAppUrl(message) {
  return `https://wa.me/${PRE_CHECKOUT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export async function createPreCheckoutWhatsApp(payload = {}) {
  const customer = validatePreCheckoutPayload(payload);
  const items = Array.isArray(payload.items) ? payload.items : [];
  const codigoCupom = payload?.codigo ?? payload?.codigo_cupom ?? null;

  if (items.length === 0) {
    const message = buildPreCheckoutWhatsAppMessage(customer);
    const whatsappUrl = generatePreCheckoutWhatsAppUrl(message);
    return { message, whatsappUrl, preview: null };
  }

  const preview = await getCheckoutPreview(items, codigoCupom);

  const message = buildWhatsAppMessage({
    nome_cliente: customer.nome,
    subtotal: preview.subtotal,
    desconto: preview.desconto,
    frete: preview.frete,
    total: preview.total,
    codigo_cupom: preview.cupom?.codigo || null,
    pedidoProdutos: preview.itens.map((item) => ({
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      sku_variacao: item.sku,
      produto: {
        nome_produto: item.nome_produto,
      },
    })),
  });

  const whatsappUrl = generatePreCheckoutWhatsAppUrl(message);

  return { message, whatsappUrl, preview };
}
