import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../helpers/prismaMock.js';

// ─── Mock prisma ──────────────────────────────────────

let prismaMock;

vi.mock('../../src/database/prisma.js', () => {
  return {
    default: new Proxy({}, {
      get(_, prop) {
        // Delegação dinâmica ao mock atual
        if (!prismaMock) return undefined;
        return prismaMock[prop];
      },
    }),
  };
});

vi.mock('../../src/services/admin/inventoryService.js', () => ({
  logSaleMovements: vi.fn().mockResolvedValue(undefined),
}));

// ─── Import services (após mock) ─────────────────────

import { validateStock, createOrder, getOrderById, calculateOrderPricing } from '../../src/services/orderService.js';
import { validateCoupon, applyCoupon, incrementCouponUsage } from '../../src/services/couponService.js';
import { calculateShipping } from '../../src/services/shippingService.js';

// ─── Fixtures ─────────────────────────────────────────

const produtoCamiseta = {
  id_produto: 1,
  nome_produto: 'Camiseta Surface',
  preco: 89.9,
  status: 'ativo',
  variacoes_estoque: [
    { tamanho: 'M', sku: '1-M', estoque: 10 },
    { tamanho: 'G', sku: '1-G', estoque: 3 },
  ],
  fotos: [{ url: '/img/cam1.jpg', principal: true }],
};

const produtoCalca = {
  id_produto: 2,
  nome_produto: 'Calça Cargo',
  preco: 149.9,
  status: 'ativo',
  variacoes_estoque: [
    { tamanho: '42', sku: '2-42', estoque: 5 },
  ],
  fotos: [],
};

const cupomPorcentagem = {
  id_cupom: 1,
  codigo: 'DESCONTO10',
  tipo: 'porcentagem',
  desconto: 10,
  ativo: true,
  validade: new Date(Date.now() + 86400000), // amanhã
  limite_usos: 100,
  usos: 5,
};

const cupomFixo = {
  id_cupom: 2,
  codigo: 'SURFACE50',
  tipo: 'fixo',
  desconto: 50,
  ativo: true,
  validade: null,
  limite_usos: null,
  usos: 0,
};

// ─── Testes ───────────────────────────────────────────

describe('orderService — validateStock', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('valida estoque com sucesso para itens disponíveis', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(produtoCamiseta);

    const result = await validateStock([
      { id_produto: 1, selectedSize: 'M', quantity: 2 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].product.id_produto).toBe(1);
    expect(result[0].variation.tamanho).toBe('M');
    expect(result[0].quantity).toBe(2);
  });

  it('rejeita se produto não encontrado', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(null);

    await expect(
      validateStock([{ id_produto: 999, selectedSize: 'M', quantity: 1 }])
    ).rejects.toThrow('não encontrado');
  });

  it('rejeita variação não encontrada', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(produtoCamiseta);

    await expect(
      validateStock([{ id_produto: 1, selectedSize: 'XL', quantity: 1 }])
    ).rejects.toThrow('não encontrada');
  });

  it('rejeita estoque insuficiente', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(produtoCamiseta);

    await expect(
      validateStock([{ id_produto: 1, selectedSize: 'G', quantity: 5 }])
    ).rejects.toThrow('Estoque insuficiente');
  });

  it('rejeita quantidade invalida', async () => {
    await expect(
      validateStock([{ id_produto: 1, selectedSize: 'M', quantity: 0 }])
    ).rejects.toThrow('quantidade invalida');
  });

  it('rejeita produto sem variações de estoque', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue({
      ...produtoCamiseta,
      variacoes_estoque: [],
    });

    await expect(
      validateStock([{ id_produto: 1, selectedSize: 'M', quantity: 1 }])
    ).rejects.toThrow('variações');
  });

  it('acumula múltiplos erros de diferentes itens', async () => {
    prismaMock.produtos.findUnique
      .mockResolvedValueOnce(null) // produto 1: não encontrado
      .mockResolvedValueOnce(produtoCamiseta); // produto 2: existente mas tamanho errado

    await expect(
      validateStock([
        { id_produto: 999, selectedSize: 'M', quantity: 1 },
        { id_produto: 1, selectedSize: 'XXL', quantity: 1 },
      ])
    ).rejects.toThrow(/não encontrado.*não encontrada/s);
  });

  it('soma itens duplicados da mesma variacao antes de validar estoque', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(produtoCamiseta);

    await expect(
      validateStock([
        { id_produto: 1, selectedSize: 'G', quantity: 2 },
        { id_produto: 1, selectedSize: 'G', quantity: 2 },
      ])
    ).rejects.toThrow('Estoque insuficiente');
  });
});

// ─── couponService – validateCoupon ───────────────────

describe('couponService — validateCoupon', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('retorna cupom válido', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue(cupomPorcentagem);

    const result = await validateCoupon('DESCONTO10');
    expect(result.codigo).toBe('DESCONTO10');
  });

  it('rejeita código vazio', async () => {
    await expect(validateCoupon('')).rejects.toThrow('obrigatorio');
  });

  it('rejeita código null', async () => {
    await expect(validateCoupon(null)).rejects.toThrow('obrigatorio');
  });

  it('rejeita cupom não encontrado', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue(null);
    await expect(validateCoupon('NAO_EXISTE')).rejects.toThrow('nao encontrado');
  });

  it('rejeita cupom inativo', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue({ ...cupomPorcentagem, ativo: false });
    await expect(validateCoupon('DESCONTO10')).rejects.toThrow('inativo');
  });

  it('rejeita cupom expirado', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue({
      ...cupomPorcentagem,
      validade: new Date('2020-01-01'),
    });
    await expect(validateCoupon('DESCONTO10')).rejects.toThrow('expirou');
  });

  it('rejeita cupom com limite de usos atingido', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue({
      ...cupomPorcentagem,
      limite_usos: 10,
      usos: 10,
    });
    await expect(validateCoupon('DESCONTO10')).rejects.toThrow('limite');
  });

  it('aceita cupom sem validade (validade null)', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue(cupomFixo);
    const result = await validateCoupon('SURFACE50');
    expect(result.codigo).toBe('SURFACE50');
  });

  it('aceita cupom sem limite de usos (limite null)', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue(cupomFixo);
    const result = await validateCoupon('SURFACE50');
    expect(result.codigo).toBe('SURFACE50');
  });

  it('normaliza código para uppercase e trim', async () => {
    prismaMock.cupons.findUnique.mockResolvedValue(cupomPorcentagem);
    await validateCoupon('  desconto10  ');
    expect(prismaMock.cupons.findUnique).toHaveBeenCalledWith({
      where: { codigo: 'DESCONTO10' },
    });
  });
});

// ─── shippingService – calculateShipping ──────────────

describe('shippingService — calculateShipping', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('retorna frete padrão quando subtotal abaixo do threshold', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: 15,
      frete_gratis_acima: 200,
    });

    const frete = await calculateShipping(100);
    expect(frete).toBe(15);
  });

  it('retorna 0 quando subtotal atinge threshold de frete grátis', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: 15,
      frete_gratis_acima: 200,
    });

    const frete = await calculateShipping(200);
    expect(frete).toBe(0);
  });

  it('retorna 0 quando subtotal excede threshold', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: 15,
      frete_gratis_acima: 200,
    });

    const frete = await calculateShipping(250);
    expect(frete).toBe(0);
  });

  it('retorna 0 quando settings não encontrado', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue(null);

    const frete = await calculateShipping(100);
    expect(frete).toBe(0);
  });

  it('retorna 0 quando frete é null', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: null,
      frete_gratis_acima: null,
    });

    const frete = await calculateShipping(100);
    expect(frete).toBe(0);
  });

  it('retorna frete quando frete_gratis_acima é null (sem threshold)', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: 20,
      frete_gratis_acima: null,
    });

    const frete = await calculateShipping(500);
    expect(frete).toBe(20);
  });
});

// ─── orderService – getOrderById ──────────────────────

describe('orderService — getOrderById', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  const orderFixture = {
    id_pedido: 1,
    id_usuario: 10,
    status: 'pendente',
    pedidoProdutos: [],
    usuario: { id_usuario: 10, nome: 'Test', email: 'test@t.com', telefone: '11999' },
  };

  it('retorna pedido para o dono', async () => {
    prismaMock.pedidos.findUnique.mockResolvedValue(orderFixture);

    const result = await getOrderById(1, 10, false);
    expect(result.id_pedido).toBe(1);
  });

  it('retorna pedido para admin mesmo sem ser dono', async () => {
    prismaMock.pedidos.findUnique.mockResolvedValue(orderFixture);

    const result = await getOrderById(1, 99, true);
    expect(result.id_pedido).toBe(1);
  });

  it('rejeita acesso de outro user não-admin', async () => {
    prismaMock.pedidos.findUnique.mockResolvedValue(orderFixture);

    await expect(getOrderById(1, 99, false)).rejects.toThrow('Acesso negado');
  });

  it('rejeita pedido não encontrado', async () => {
    prismaMock.pedidos.findUnique.mockResolvedValue(null);

    await expect(getOrderById(999, 10, false)).rejects.toThrow('não encontrado');
  });
});

describe('orderService — calculateOrderPricing', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('recalcula subtotal, desconto, frete e total somente no backend', async () => {
    prismaMock.produtos.findUnique.mockResolvedValue(produtoCamiseta);
    prismaMock.cupons.findUnique.mockResolvedValue(cupomPorcentagem);
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      frete: 20,
      frete_gratis_acima: 200,
    });

    const result = await calculateOrderPricing(
      [{ id_produto: 1, selectedSize: 'M', quantity: 2 }],
      'desconto10'
    );

    expect(result.subtotal).toBe(179.8);
    expect(result.desconto).toBe(17.98);
    expect(result.frete).toBe(20);
    expect(result.total).toBe(181.82);
    expect(result.cupomValidado.codigo).toBe('DESCONTO10');
  });
});
