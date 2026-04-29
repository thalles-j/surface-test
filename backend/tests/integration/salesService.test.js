import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../helpers/prismaMock.js';

// ─── Mock prisma ──────────────────────────────────────

let prismaMock;

vi.mock('../../src/database/prisma.js', () => ({
  default: new Proxy({}, {
    get(_, prop) {
      if (!prismaMock) return undefined;
      return prismaMock[prop];
    },
  }),
}));

vi.mock('../../src/services/emailService.js', () => ({
  sendOrderStatusUpdate: vi.fn().mockResolvedValue({ status: 'preview' }),
}));

import {
  updateOrderStatus,
  createInPersonSale,
  bulkUpdateOrderStatus,
  updateOrderItems,
  updateOrderAddress,
  getSalesByPeriod,
  getOrderHistory,
} from '../../src/services/admin/salesService.js';

// ─── Helpers para req/res mock ────────────────────────

function mockReqRes(params = {}, body = {}, query = {}) {
  const req = { params, body, query };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

function getJsonBody(res) {
  return res.json.mock.calls[0]?.[0];
}

// ─── Fixtures ─────────────────────────────────────────

const pedidoPendente = {
  id_pedido: 1,
  status: 'pendente',
  subtotal: 200,
  desconto: 0,
  frete: 15,
  total: 215,
};

const pedidoCompleto = {
  ...pedidoPendente,
  status: 'confirmado',
  usuario: { id_usuario: 1, nome: 'Test', email: 'test@t.com', enderecos: [] },
  pedidoProdutos: [],
  historico: [],
};

const produtoFixture = {
  id_produto: 1,
  nome_produto: 'Camiseta',
  preco: 89.9,
  variacoes_estoque: [
    { tamanho: 'M', sku: '1-M', estoque: 10 },
  ],
};

// ─── updateOrderStatus ───────────────────────────────

describe('salesService — updateOrderStatus', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('atualiza status com transição válida', async () => {
    const { req, res } = mockReqRes({ id: '1' }, { status: 'confirmado' });

    prismaMock.pedidos.findUnique.mockResolvedValue(pedidoPendente);

    // $transaction retorna array [updatedOrder, historyEntry]
    prismaMock.$transaction = vi.fn().mockResolvedValue([pedidoCompleto, {}]);

    // Re-fetch após transaction
    prismaMock.pedidos.findUnique
      .mockResolvedValueOnce(pedidoPendente) // primeira chamada
      .mockResolvedValueOnce(pedidoCompleto); // re-fetch

    await updateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(true);
    expect(body.pedido).toBeDefined();
  });

  it('rejeita status inválido (não existe)', async () => {
    const { req, res } = mockReqRes({ id: '1' }, { status: 'invalido' });

    await updateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toContain('inválido');
  });

  it('rejeita transição inválida (pendente → enviado)', async () => {
    const { req, res } = mockReqRes({ id: '1' }, { status: 'enviado' });

    prismaMock.pedidos.findUnique.mockResolvedValue(pedidoPendente);

    await updateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toContain('Transição');
  });

  it('rejeita pedido não encontrado', async () => {
    const { req, res } = mockReqRes({ id: '999' }, { status: 'confirmado' });

    prismaMock.pedidos.findUnique.mockResolvedValue(null);

    await updateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toContain('não encontrado');
  });
});

// ─── createInPersonSale ───────────────────────────────

describe('salesService — createInPersonSale', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita sem nome_cliente', async () => {
    const { req, res } = mockReqRes({}, { items: [{ id_produto: 1 }] });

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toContain('obrigatórios');
  });

  it('rejeita sem items', async () => {
    const { req, res } = mockReqRes({}, { nome_cliente: 'João' });

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita items vazio', async () => {
    const { req, res } = mockReqRes({}, { nome_cliente: 'João', items: [] });

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita produto não encontrado', async () => {
    const { req, res } = mockReqRes({}, {
      nome_cliente: 'João',
      items: [{ id_produto: 999, tamanho: 'M', quantidade: 1 }],
    });

    prismaMock.produtos.findUnique.mockResolvedValue(null);

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.mensagem).toContain('não encontrado');
  });

  it('rejeita estoque insuficiente', async () => {
    const { req, res } = mockReqRes({}, {
      nome_cliente: 'João',
      items: [{ id_produto: 1, tamanho: 'M', quantidade: 50 }],
    });

    prismaMock.produtos.findUnique.mockResolvedValue(produtoFixture);

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.mensagem).toContain('Estoque insuficiente');
  });

  it('rejeita variação não encontrada', async () => {
    const { req, res } = mockReqRes({}, {
      nome_cliente: 'João',
      items: [{ id_produto: 1, tamanho: 'XXL', quantidade: 1 }],
    });

    prismaMock.produtos.findUnique.mockResolvedValue(produtoFixture);

    await createInPersonSale(req, res);

    const body = getJsonBody(res);
    expect(body.mensagem).toContain('não encontrada');
  });

  it('cria venda presencial com sucesso', async () => {
    const { req, res } = mockReqRes({}, {
      nome_cliente: 'João',
      metodo_pagamento: 'pix',
      items: [{ id_produto: 1, tamanho: 'M', quantidade: 2, preco_unitario: 89.9 }],
    });

    prismaMock.produtos.findUnique.mockResolvedValue(produtoFixture);

    const createdOrder = {
      id_pedido: 10,
      status: 'finalizado',
      origem: 'presencial',
      nome_cliente: 'João',
      subtotal: 179.8,
      total: 179.8,
      pedidoProdutos: [],
    };

    prismaMock.$transaction = vi.fn(async (fn) => {
      // Cria um mock de tx com todos os models necessários
      const txMock = {
        pedidos: { create: vi.fn().mockResolvedValue(createdOrder) },
        produtos: { update: vi.fn().mockResolvedValue({}) },
        movimentacoes_estoque: { create: vi.fn().mockResolvedValue({}) },
        historico_pedidos: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(txMock);
    });

    await createInPersonSale(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = getJsonBody(res);
    expect(body.sucesso).toBe(true);
    expect(body.pedido.status).toBe('finalizado');
    expect(body.pedido.origem).toBe('presencial');
  });
});

// ─── bulkUpdateOrderStatus ────────────────────────────

describe('salesService — bulkUpdateOrderStatus', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita sem IDs', async () => {
    const { req, res } = mockReqRes({}, { status: 'confirmado' });

    await bulkUpdateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita status inválido', async () => {
    const { req, res } = mockReqRes({}, { ids: [1, 2], status: 'xyz' });

    await bulkUpdateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toContain('inválido');
  });

  it('atualiza e contabiliza transições válidas/ignoradas', async () => {
    const { req, res } = mockReqRes({}, { ids: [1, 2], status: 'confirmado' });

    prismaMock.pedidos.findMany.mockResolvedValue([
      { id_pedido: 1, status: 'pendente' }, // transição válida
      { id_pedido: 2, status: 'finalizado' }, // transição inválida
    ]);
    prismaMock.pedidos.update.mockResolvedValue({});

    await bulkUpdateOrderStatus(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(true);
    expect(body.updated).toBe(1);
    expect(body.skipped).toBe(1);
  });
});

// ─── updateOrderItems ─────────────────────────────────

describe('salesService — updateOrderItems', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita sem items', async () => {
    const { req, res } = mockReqRes({ id: '1' }, { items: [] });

    await updateOrderItems(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita item incompleto', async () => {
    const { req, res } = mockReqRes({ id: '1' }, {
      items: [{ id_produto: 1 }], // falta campos
    });

    prismaMock.pedidos.findUnique.mockResolvedValue(pedidoPendente);

    await updateOrderItems(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita pedido não encontrado', async () => {
    const { req, res } = mockReqRes({ id: '999' }, {
      items: [{ id_produto: 1, sku_variacao: '1-M', quantidade: 1, preco_unitario: 89.9 }],
    });

    prismaMock.pedidos.findUnique.mockResolvedValue(null);

    await updateOrderItems(req, res);

    const body = getJsonBody(res);
    expect(body.mensagem).toContain('não encontrado');
  });
});

// ─── updateOrderAddress ───────────────────────────────

describe('salesService — updateOrderAddress', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita sem endereco_entrega', async () => {
    const { req, res } = mockReqRes({ id: '1' }, {});

    await updateOrderAddress(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(false);
  });

  it('rejeita pedido não encontrado', async () => {
    const { req, res } = mockReqRes({ id: '999' }, { endereco_entrega: 'Rua X' });

    prismaMock.pedidos.findUnique.mockResolvedValue(null);

    await updateOrderAddress(req, res);

    const body = getJsonBody(res);
    expect(body.mensagem).toContain('não encontrado');
  });

  it('atualiza endereço com sucesso', async () => {
    const { req, res } = mockReqRes({ id: '1' }, { endereco_entrega: 'Rua Nova, 123' });

    prismaMock.pedidos.findUnique.mockResolvedValue(pedidoPendente);
    prismaMock.$transaction = vi.fn(async (fn) => {
      const txMock = createPrismaMock();
      txMock.pedidos.update.mockResolvedValue({ ...pedidoPendente, endereco_entrega: 'Rua Nova, 123' });
      return fn(txMock);
    });

    await updateOrderAddress(req, res);

    const body = getJsonBody(res);
    expect(body.sucesso).toBe(true);
    expect(body.pedido.endereco_entrega).toBe('Rua Nova, 123');
  });
});

// ─── getSalesByPeriod ─────────────────────────────────

describe('salesService — getSalesByPeriod', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('retorna pedidos no período', async () => {
    const { req, res } = mockReqRes({}, {}, { startDate: '2024-01-01', endDate: '2024-12-31' });
    prismaMock.pedidos.findMany.mockResolvedValue([{ id_pedido: 1 }, { id_pedido: 2 }]);

    await getSalesByPeriod(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id_pedido: 1 }, { id_pedido: 2 }]);
  });

  it('retorna todos os pedidos sem filtros', async () => {
    const { req, res } = mockReqRes({}, {}, {});
    prismaMock.pedidos.findMany.mockResolvedValue([]);

    await getSalesByPeriod(req, res);
    expect(prismaMock.pedidos.findMany).toHaveBeenCalledWith({ where: {} });
  });
});

// ─── getOrderHistory ──────────────────────────────────

describe('salesService — getOrderHistory', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('retorna histórico do pedido', async () => {
    const { req, res } = mockReqRes({ id: '1' });
    prismaMock.historico_pedidos.findMany.mockResolvedValue([
      { id_historico: 1, tipo: 'status_change' },
    ]);

    await getOrderHistory(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id_historico: 1, tipo: 'status_change' }]);
  });
});
