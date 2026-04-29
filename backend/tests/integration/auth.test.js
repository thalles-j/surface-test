import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../helpers/prismaMock.js';

// ─── Mock prisma ──────────────────────────────────────

let prismaMock;

vi.mock('../../src/database/prisma.js', () => {
  return {
    default: new Proxy({}, {
      get(_, prop) {
        if (!prismaMock) return undefined;
        return prismaMock[prop];
      },
    }),
  };
});

vi.mock('../../src/services/emailService.js', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ status: 'preview' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ status: 'preview' }),
}));

// Precisa setar JWT_SECRET antes de importar o authMiddleware
process.env.JWT_SECRET = 'test-secret-key-for-vitest';

import {
  loginService,
  registerService,
  requestPasswordResetService,
  resetPasswordService,
  getFirstAccessStatusService,
  logoutService,
} from '../../src/services/authService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Fixtures ─────────────────────────────────────────

const senhaHash = bcrypt.hashSync('senha123', 10);

const usuarioFixture = {
  id_usuario: 1,
  nome: 'Thalles',
  email: 'thalles@example.com',
  senha: senhaHash,
  telefone: '11999999999',
  id_role: 1,
  role: { id_role: 1, nome: 'admin' },
};

// ─── loginService ─────────────────────────────────────

describe('authService — loginService', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('retorna token e usuario com credenciais válidas', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(usuarioFixture);

    const result = await loginService('thalles@example.com', 'senha123');

    expect(result.token).toBeDefined();
    expect(result.usuario.email).toBe('thalles@example.com');

    // Token deve conter as claims corretas
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('thalles@example.com');
    expect(decoded.id_role).toBe(1);
  });

  it('rejeita usuário não encontrado', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(null);

    await expect(
      loginService('nao@existe.com', 'senha')
    ).rejects.toThrow('não encontrado');
  });

  it('rejeita senha incorreta', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(usuarioFixture);

    await expect(
      loginService('thalles@example.com', 'senhaErrada')
    ).rejects.toThrow('Senha incorreta');
  });
});

// ─── registerService ──────────────────────────────────

describe('authService — registerService', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('registra com sucesso e retorna token', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(null); // email não existe

    const novoUsuario = {
      id_usuario: 2,
      nome: 'Novo User',
      email: 'novo@test.com',
      telefone: '11888888888',
      id_role: 2,
    };
    prismaMock.usuarios.create.mockResolvedValue(novoUsuario);

    const result = await registerService({
      nome: 'Novo User',
      email: 'novo@test.com',
      senha: 'MinhaS3nha!',
      telefone: '11888888888',
    });

    expect(result.token).toBeDefined();
    expect(result.usuario.id_role).toBe(2); // deve ser role 2 (customer)

    // Verifica que criou com hash (não a senha plain)
    const createCall = prismaMock.usuarios.create.mock.calls[0][0];
    expect(createCall.data.senha).not.toBe('MinhaS3nha!');
    expect(createCall.data.id_role).toBe(2);
  });

  it('rejeita se telefone não fornecido', async () => {
    await expect(
      registerService({ nome: 'X', email: 'x@y.com', senha: '123' })
    ).rejects.toThrow('Telefone');
  });

  it('rejeita email já cadastrado', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(usuarioFixture);

    await expect(
      registerService({
        nome: 'Dup',
        email: 'thalles@example.com',
        senha: '123',
        telefone: '11999',
      })
    ).rejects.toThrow('já cadastrado');
  });
});

// ─── authMiddleware ───────────────────────────────────

import { authMiddleware, adminMiddleware, isOwnerOrAdmin } from '../../src/middlewares/authMiddleware.js';

function mockReqResNext() {
  const req = { headers: {} };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  it('atribui req.user com token válido', () => {
    const token = jwt.sign(
      { id: 1, email: 'a@b.com', id_role: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
    expect(req.user.email).toBe('a@b.com');
    expect(req.user.id_role).toBe(1);
  });

  it('rejeita sem token', () => {
    const { req, res, next } = mockReqResNext();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejeita token inválido', () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = 'Bearer token.invalido.aqui';

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejeita token expirado', () => {
    const token = jwt.sign(
      { id: 1, email: 'a@b.com', id_role: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );

    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    // Esperar 1ms para expirar
    setTimeout(() => {
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    }, 10);
  });
});

describe('adminMiddleware', () => {
  it('permite admin (id_role === 1)', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 1, id_role: 1 };

    adminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejeita não-admin (id_role !== 1)', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 2, id_role: 2 };

    adminMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejeita sem req.user', () => {
    const { req, res, next } = mockReqResNext();

    adminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('isOwnerOrAdmin', () => {
  it('permite admin acessar qualquer recurso', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 1, id_role: 1 };
    req.params = { id: '99' };

    isOwnerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite dono acessar seu próprio recurso', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 10, id_role: 2 };
    req.params = { id: '10' };

    isOwnerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejeita user acessando recurso de outro', () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 10, id_role: 2 };
    req.params = { id: '20' };

    isOwnerOrAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─── requestPasswordResetService ──────────────────────

describe('authService — requestPasswordResetService', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita email vazio', async () => {
    await expect(requestPasswordResetService('')).rejects.toThrow('Email é obrigatório');
  });

  it('retorna ok mesmo se usuário não existe (não revela)', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(null);

    const result = await requestPasswordResetService('nao@existe.com');
    expect(result.ok).toBe(true);
  });

  it('gera token e retorna ok para usuário existente', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue({
      id_usuario: 1,
      nome: 'Test',
      email: 'test@t.com',
    });

    const result = await requestPasswordResetService('test@t.com');
    expect(result.ok).toBe(true);
  });
});

// ─── resetPasswordService ─────────────────────────────

describe('authService — resetPasswordService', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita token ausente', async () => {
    await expect(resetPasswordService('', 'novasenha123')).rejects.toThrow('Token de recuperação é obrigatório');
  });

  it('rejeita senha muito curta', async () => {
    await expect(resetPasswordService('token', '123')).rejects.toThrow('mínimo 7 caracteres');
  });

  it('rejeita token inválido', async () => {
    await expect(resetPasswordService('token.invalido', 'novasenha123')).rejects.toThrow('Token inválido ou expirado');
  });

  it('rejeita token com ação errada', async () => {
    const token = jwt.sign(
      { action: 'other', id: 1, email: 'test@t.com' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    await expect(resetPasswordService(token, 'novasenha123')).rejects.toThrow('Token inválido');
  });

  it('rejeita usuário não encontrado', async () => {
    const token = jwt.sign(
      { action: 'reset_password', id: 1, email: 'test@t.com' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    prismaMock.usuarios.findUnique.mockResolvedValue(null);

    await expect(resetPasswordService(token, 'novasenha123')).rejects.toThrow('Usuário não encontrado');
  });

  it('reseta senha com sucesso', async () => {
    const token = jwt.sign(
      { action: 'reset_password', id: 1, email: 'test@t.com' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    prismaMock.usuarios.findUnique.mockResolvedValue({ id_usuario: 1 });
    prismaMock.usuarios.update.mockResolvedValue({});

    const result = await resetPasswordService(token, 'novasenha123');
    expect(result.ok).toBe(true);

    const updateCall = prismaMock.usuarios.update.mock.calls[0][0];
    expect(updateCall.data.senha).not.toBe('novasenha123'); // deve estar hasheada
  });
});

// ─── getFirstAccessStatusService ──────────────────────

describe('authService — getFirstAccessStatusService', () => {
  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('rejeita email vazio', async () => {
    await expect(getFirstAccessStatusService('')).rejects.toThrow('Email é obrigatório');
  });

  it('retorna podePrimeiroAcesso quando não tem conta mas tem pedidos', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue(null);
    prismaMock.pedidos.findMany.mockResolvedValue([
      { id_pedido: 1, endereco_entrega: { email: 'cliente@test.com' } },
    ]);

    const result = await getFirstAccessStatusService('cliente@test.com');
    expect(result.hasConta).toBe(false);
    expect(result.temPedidosPorEmail).toBe(true);
    expect(result.podePrimeiroAcesso).toBe(true);
  });

  it('retorna hasConta quando usuário existe', async () => {
    prismaMock.usuarios.findUnique.mockResolvedValue({ id_usuario: 1, email: 'cliente@test.com' });
    prismaMock.pedidos.findMany.mockResolvedValue([]);

    const result = await getFirstAccessStatusService('cliente@test.com');
    expect(result.hasConta).toBe(true);
    expect(result.podePrimeiroAcesso).toBe(false);
  });
});

// ─── logoutService ────────────────────────────────────

describe('authService — logoutService', () => {
  it('resolve sem erro', async () => {
    await expect(logoutService()).resolves.toBeUndefined();
  });
});
