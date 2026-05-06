import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-key-for-vitest';

import { optionalAuthMiddleware } from '../../src/middlewares/authMiddleware.js';
import { validateBody } from '../../src/middlewares/vaildateBody.js';

function mockReqResNext() {
  const req = { headers: {}, body: {}, params: {} };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

// ─── optionalAuthMiddleware ───────────────────────────

describe('optionalAuthMiddleware', () => {
  it('chama next sem token', () => {
    const { req, res, next } = mockReqResNext();
    optionalAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('preenche req.user com token válido', () => {
    const token = jwt.sign(
      { id: 5, email: 'opt@test.com', id_role: 2 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    optionalAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(5);
  });

  it('chama next mesmo com token inválido', () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = 'Bearer invalid.token.here';

    optionalAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});

// ─── validateBody ─────────────────────────────────────

describe('validateBody', () => {
  it('rejeita body vazio', () => {
    const { req, res, next } = mockReqResNext();
    req.body = null;

    validateBody(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'O body precisa conter pelo menos um produto' });
  });

  it('rejeita array vazio', () => {
    const { req, res, next } = mockReqResNext();
    req.body = [];

    validateBody(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejeita produto sem id_categoria', () => {
    const { req, res, next } = mockReqResNext();
    req.body = [{ nome: 'Produto' }];

    validateBody(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'O campo id_categoria é obrigatório em todos os produtos' });
  });

  it('aceita body como objeto único', () => {
    const { req, res, next } = mockReqResNext();
    req.body = { id_categoria: 1, nome: 'Produto' };

    validateBody(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(Array.isArray(req.body)).toBe(true);
    expect(req.body).toHaveLength(1);
  });

  it('aceita array válido', () => {
    const { req, res, next } = mockReqResNext();
    req.body = [
      { id_categoria: 1 },
      { id_categoria: 2 },
    ];

    validateBody(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toHaveLength(2);
  });
});
