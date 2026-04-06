import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../helpers/prismaMock.js';

let prismaMock;

vi.mock('../../src/database/prisma.js', () => ({
  default: new Proxy({}, {
    get(_, prop) {
      if (!prismaMock) return undefined;
      return prismaMock[prop];
    },
  }),
}));

// Precisa invalidar o cache entre testes
import { checkStoreActive, invalidateStoreStatusCache } from '../../src/middlewares/storeStatusMiddleware.js';

function mockReqResNext(headers = {}) {
  const req = { headers };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('storeStatusMiddleware — checkStoreActive', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
    invalidateStoreStatusCache();
  });

  it('permite acesso se loja está ativa', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      loja_ativa: true,
      data_abertura: null,
      early_access_ativo: false,
    });

    const { req, res, next } = mockReqResNext();
    await checkStoreActive(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 503 se loja desativada', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      loja_ativa: false,
      data_abertura: null,
      early_access_ativo: false,
    });

    const { req, res, next } = mockReqResNext();
    await checkStoreActive(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);

    const body = res.json.mock.calls[0][0];
    expect(body.manutencao).toBe(true);
  });

  it('permite early access se email está liberado', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      loja_ativa: false,
      data_abertura: null,
      early_access_ativo: true,
    });
    prismaMock.early_access_emails = {
      findUnique: vi.fn().mockResolvedValue({ email: 'vip@test.com', liberado: true }),
    };

    invalidateStoreStatusCache();

    const { req, res, next } = mockReqResNext({
      'x-early-access-email': 'vip@test.com',
    });
    await checkStoreActive(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('bloqueia early access se email não liberado', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      loja_ativa: false,
      data_abertura: null,
      early_access_ativo: true,
    });
    prismaMock.early_access_emails = {
      findUnique: vi.fn().mockResolvedValue({ email: 'notvip@test.com', liberado: false }),
    };

    invalidateStoreStatusCache();

    const { req, res, next } = mockReqResNext({
      'x-early-access-email': 'notvip@test.com',
    });
    await checkStoreActive(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('permite acesso se config é null (fallback seguro)', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue(null);

    const { req, res, next } = mockReqResNext();
    await checkStoreActive(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('permite acesso se prisma falha (catch)', async () => {
    prismaMock.configuracoes_loja.findFirst.mockRejectedValue(new Error('DB down'));

    const { req, res, next } = mockReqResNext();
    await checkStoreActive(req, res, next);

    // Deve chamar next() no catch
    expect(next).toHaveBeenCalled();
  });

  it('invalidateStoreStatusCache limpa o cache', async () => {
    prismaMock.configuracoes_loja.findFirst.mockResolvedValue({
      loja_ativa: true,
      data_abertura: null,
      early_access_ativo: false,
    });

    // Primeira chamada: popula cache
    const { req: r1, res: res1, next: n1 } = mockReqResNext();
    await checkStoreActive(r1, res1, n1);
    expect(n1).toHaveBeenCalled();

    // Sem invalidar, segunda chamada usa cache (findFirst chamado 1x)
    const { req: r2, res: res2, next: n2 } = mockReqResNext();
    await checkStoreActive(r2, res2, n2);
    expect(prismaMock.configuracoes_loja.findFirst).toHaveBeenCalledTimes(1);

    // Invalidar e chamar de novo
    invalidateStoreStatusCache();
    const { req: r3, res: res3, next: n3 } = mockReqResNext();
    await checkStoreActive(r3, res3, n3);
    expect(prismaMock.configuracoes_loja.findFirst).toHaveBeenCalledTimes(2);
  });
});
