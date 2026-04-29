import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('@/database/prisma.js', () => ({
  default: {
    usuarios: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    pedidos: {
      findMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

vi.mock('@/services/emailService.js', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ status: 'preview' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ status: 'preview' }),
}));

vi.mock('@/services/payment/index.js', () => ({
  initPaymentProviders: vi.fn(),
}));

import { createApp } from '@/app.js';

const app = createApp();

describe('HTTP — Auth', () => {
  it('POST /api/auth/login rejeita payload vazio', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.sucesso).toBe(false);
  });

  it('POST /api/auth/login rejeita email inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'invalid', senha: '1234567' });
    expect(res.status).toBe(400);
    expect(res.body.erros).toBeDefined();
  });

  it('POST /api/auth/register rejeita senha curta', async () => {
    const res = await request(app).post('/api/auth/register').send({ nome: 'Test', email: 'test@test.com', senha: '123', telefone: '11999' });
    expect(res.status).toBe(400);
    expect(res.body.erros.senha).toBeDefined();
  });

  it('POST /api/auth/forgot-password rejeita email inválido', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'naoemail' });
    expect(res.status).toBe(400);
  });

  it('GET / retorna 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('API Funcionando');
  });
});

describe('HTTP — Rate Limits', () => {
  it('login retorna 429 após muitas tentativas', async () => {
    const agent = request.agent(app);
    // 11 requisições (limite é 10)
    for (let i = 0; i < 11; i++) {
      await agent.post('/api/auth/login').send({ email: 'test@test.com', senha: 'wrong' });
    }
    const res = await agent.post('/api/auth/login').send({ email: 'test@test.com', senha: 'wrong' });
    expect(res.status).toBe(429);
    expect(res.body.mensagem).toContain('Muitas tentativas');
  });

  it('rotas admin nao retornam 429 em uso normal (6 reqs paralelas)', async () => {
    const reqs = [
      request(app).get('/api/admin/dashboard/stats'),
      request(app).get('/api/admin/dashboard/top-products'),
      request(app).get('/api/admin/analytics/recent-orders'),
      request(app).get('/api/admin/settings'),
      request(app).get('/api/admin/analytics/visits'),
      request(app).get('/api/admin/analytics/category-sales'),
    ];
    const results = await Promise.all(reqs);
    // Podem retornar 401 (sem auth) ou 200, mas NUNCA 429
    for (const res of results) {
      expect(res.status).not.toBe(429);
    }
  });
});
