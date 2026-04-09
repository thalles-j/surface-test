/**
 * Prisma mock helper para testes de integração.
 * Permite criar mocks de qualquer model/method do Prisma.
 */
import { vi } from 'vitest';

export function createPrismaMock(overrides = {}) {
  const defaultModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  });

  return {
    produtos: defaultModel(),
    pedidos: defaultModel(),
    pedido_produtos: defaultModel(),
    cupons: defaultModel(),
    usuarios: defaultModel(),
    enderecos: defaultModel(),
    configuracoes_loja: defaultModel(),
    historico_pedidos: defaultModel(),
    estoque_movimentacoes: defaultModel(),
    $transaction: vi.fn(async (fn) => {
      // Se receber um array, executa como batch
      if (Array.isArray(fn)) {
        const results = [];
        for (const op of fn) results.push(await op);
        return results;
      }
      // Se receber uma função, passa o próprio mock como tx
      const tx = createPrismaMock(overrides);
      return fn(tx);
    }),
    ...overrides,
  };
}
