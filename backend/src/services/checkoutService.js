import { calculateOrderPricing } from './orderService.js';
import { ErroValidation } from '../errors/index.js';
import prisma from '../database/prisma.js';

export async function getCheckoutPreview(items, codigoCupom, cepDestino = null) {
  const { productData, subtotal, desconto, frete, total, cupomValidado } =
    await calculateOrderPricing(items, codigoCupom, cepDestino);

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

const ALLOWED_PAYMENT_TYPES = ['DINHEIRO', 'CARTAO', 'PIX'];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function validateCheckoutPayload(payload = {}) {
  const nome = sanitizeText(payload.nome);
  const email = sanitizeText(payload.email);
  const telefone = String(payload.telefone || '').replace(/\D/g, '');
  const tipo_pagamento = sanitizeText(payload.tipo_pagamento).toUpperCase();

  // Campos de endereço separados (preferência)
  const logradouro = sanitizeText(payload.logradouro || payload.rua);
  const numero = sanitizeText(payload.numero);
  const complemento = sanitizeText(payload.complemento);
  const bairro = sanitizeText(payload.bairro);
  const cidade = sanitizeText(payload.cidade);
  const estado = sanitizeText(payload.estado).toUpperCase();
  const cep = String(payload.cep || '').replace(/\D/g, '');

  // Fallback para endereco como string única
  const endereco = sanitizeText(payload.endereco);

  const hasAddressFields = logradouro && numero && bairro && cidade && estado && cep.length === 8;
  const hasLegacyAddress = !!endereco;

  if (!nome) throw new ErroValidation('Nome e obrigatorio.');
  if (!email || !validateEmail(email)) throw new ErroValidation('Email invalido.');
  if (!telefone) throw new ErroValidation('Telefone e obrigatorio.');
  if (telefone.length < 10) throw new ErroValidation('Telefone invalido.');
  if (!hasAddressFields && !hasLegacyAddress) {
    throw new ErroValidation('Endereco e obrigatorio.');
  }
  if (!tipo_pagamento) throw new ErroValidation('Tipo de pagamento e obrigatorio.');
  if (!ALLOWED_PAYMENT_TYPES.includes(tipo_pagamento)) {
    throw new ErroValidation('Tipo de pagamento invalido.');
  }

  return {
    nome,
    email,
    telefone,
    tipo_pagamento,
    // Endereço separado
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    // Fallback
    endereco,
  };
}

/**
 * Cria um pedido real no banco de dados a partir do checkout.
 */
export async function createOrderFromCheckout(payload = {}, user = null) {
  const customer = validateCheckoutPayload(payload);
  const items = Array.isArray(payload.items) ? payload.items : [];
  const codigoCupom = payload?.codigo ?? payload?.codigo_cupom ?? null;
  const cepDestino = payload?.cep ?? null;

  if (items.length === 0) {
    throw new ErroValidation('Carrinho vazio.');
  }

  const { productData, subtotal, desconto, frete, total, cupomValidado } =
    await calculateOrderPricing(items, codigoCupom, cepDestino);

  const pedido = await prisma.pedidos.create({
    data: {
      id_usuario: user?.id_usuario || user?.id || null,
      subtotal,
      desconto,
      frete,
      total,
      codigo_cupom: cupomValidado?.codigo || null,
      metodo_pagamento: customer.tipo_pagamento,
      status_pagamento: 'pendente',
      status: 'pendente',
      nome_cliente: customer.nome,
      endereco_entrega: {
        nome: customer.nome,
        email: customer.email,
        telefone: customer.telefone,
        logradouro: customer.logradouro || null,
        numero: customer.numero || null,
        complemento: customer.complemento || null,
        bairro: customer.bairro || 'Não informado',
        cidade: customer.cidade || null,
        estado: customer.estado || null,
        cep: customer.cep || null,
        endereco: customer.endereco || null,
      },
      pedidoProdutos: {
        create: productData.map(({ product, variation, quantity }) => ({
          id_produto: product.id_produto,
          sku_variacao: variation.sku,
          quantidade: quantity,
          preco_unitario: Number(product.preco),
        })),
      },
    },
    include: {
      pedidoProdutos: {
        include: { produto: true },
      },
    },
  });

  return pedido;
}
