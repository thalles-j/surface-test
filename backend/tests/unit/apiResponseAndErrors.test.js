import { describe, it, expect, vi } from 'vitest';
import { sucesso, erro } from '../../src/helpers/apiResponse.js';
import ErroBase from '../../src/errors/ErroBase.js';
import ErroValidation from '../../src/errors/ErroValidation.js';
import { ErroAuth, ErroTokenExpirado, ErroTokenInvalido, ErroSemToken } from '../../src/errors/ErroAuth.js';
import ErroRole from '../../src/errors/ErroRole.js';

// ─── apiResponse ──────────────────────────────────────

describe('apiResponse', () => {
  function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  }

  describe('sucesso()', () => {
    it('retorna status 200 por padrão', () => {
      const res = mockRes();
      sucesso(res, { pedido: { id: 1 } });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        sucesso: true,
        pedido: { id: 1 },
      });
    });

    it('permite status customizado', () => {
      const res = mockRes();
      sucesso(res, { mensagem: 'Criado' }, 201);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('espalha data corretamente no JSON', () => {
      const res = mockRes();
      sucesso(res, { items: [1, 2], total: 3 });

      expect(res.json).toHaveBeenCalledWith({
        sucesso: true,
        items: [1, 2],
        total: 3,
      });
    });
  });

  describe('erro()', () => {
    it('retorna status 400 por padrão', () => {
      const res = mockRes();
      erro(res, 'Erro qualquer');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        sucesso: false,
        mensagem: 'Erro qualquer',
      });
    });

    it('permite status customizado', () => {
      const res = mockRes();
      erro(res, 'Não encontrado', 404);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

// ─── Error classes ─────────────────────────────────────

describe('Error classes', () => {
  describe('ErroBase', () => {
    it('default: mensagem de erro interno, status 500', () => {
      const err = new ErroBase();
      expect(err.message).toBe('Erro interno do servidor');
      expect(err.status).toBe(500);
    });

    it('aceita mensagem e status customizados', () => {
      const err = new ErroBase('Custom', 418);
      expect(err.message).toBe('Custom');
      expect(err.status).toBe(418);
    });

    it('instanceof Error', () => {
      expect(new ErroBase()).toBeInstanceOf(Error);
    });

    it('enviarResposta() envia JSON correto', () => {
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const err = new ErroBase('Falha', 500);
      err.enviarResposta(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        mensagem: 'Falha',
        status: 500,
      });
    });
  });

  describe('ErroValidation', () => {
    it('default: status 400', () => {
      const err = new ErroValidation();
      expect(err.status).toBe(400);
      expect(err).toBeInstanceOf(ErroBase);
    });

    it('aceita mensagem customizada', () => {
      const err = new ErroValidation('Campo inválido');
      expect(err.message).toBe('Campo inválido');
      expect(err.status).toBe(400);
    });
  });

  describe('ErroAuth', () => {
    it('default: Falha na autenticação, status 401', () => {
      const err = new ErroAuth();
      expect(err.message).toBe('Falha na autenticação');
      expect(err.status).toBe(401);
      expect(err).toBeInstanceOf(ErroBase);
    });
  });

  describe('ErroTokenExpirado', () => {
    it('default message refere a token expirado', () => {
      const err = new ErroTokenExpirado();
      expect(err.message).toContain('Token expirado');
      expect(err.status).toBe(401);
      expect(err).toBeInstanceOf(ErroAuth);
    });
  });

  describe('ErroTokenInvalido', () => {
    it('default message refere a token inválido', () => {
      const err = new ErroTokenInvalido();
      expect(err.message).toContain('Token inválido');
      expect(err.status).toBe(401);
    });
  });

  describe('ErroSemToken', () => {
    it('default message refere a sem token', () => {
      const err = new ErroSemToken();
      expect(err.message).toContain('Nenhum token');
      expect(err.status).toBe(401);
    });
  });

  describe('ErroRole', () => {
    it('herda de ErroBase', () => {
      const err = new ErroRole();
      expect(err).toBeInstanceOf(ErroBase);
    });
  });
});
