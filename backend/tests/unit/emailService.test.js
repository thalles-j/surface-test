import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock de dependências ─────────────────────────────
// Mocka o prisma antes de importar o serviço
vi.mock('../../src/database/prisma.js', () => {
  return { default: {} };
});

vi.mock('../../src/services/emailService.js', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue({ status: 'preview' }),
  sendOrderStatusUpdate: vi.fn().mockResolvedValue({ status: 'preview' }),
  sendWelcomeEmail: vi.fn().mockResolvedValue({ status: 'preview' }),
}));

// ─── Templates ────────────────────────────────────────
import * as templates from '../../src/services/email/templates.js';

describe('email/templates', () => {
  describe('orderConfirmation', () => {
    it('retorna subject e html', () => {
      const { subject, html } = templates.orderConfirmation({
        orderId: 42,
        customerName: 'João',
        items: [
          { nome: 'Camiseta Surface', tamanho: 'M', quantidade: 2, preco: 89.9 },
        ],
        subtotal: 179.8,
        desconto: 10,
        frete: 15,
        total: 184.8,
      });

      expect(subject).toContain('#42');
      expect(subject).toContain('Surface');
      expect(html).toContain('Pedido Confirmado');
      expect(html).toContain('João');
      expect(html).toContain('Camiseta Surface');
      expect(html).toContain('R$');
      expect(html).toContain('<!DOCTYPE html');
    });

    it('funciona sem items (array vazio)', () => {
      const { html } = templates.orderConfirmation({
        orderId: 1,
        items: [],
        subtotal: 0,
        desconto: 0,
        frete: 0,
        total: 0,
      });
      expect(html).toContain('<!DOCTYPE html');
    });

    it('funciona sem customerName', () => {
      const { html } = templates.orderConfirmation({
        orderId: 1,
        items: [],
        total: 0,
      });
      expect(html).toContain('Olá');
    });
  });

  describe('orderStatusUpdate', () => {
    it('retorna subject e html com novo status', () => {
      const { subject, html } = templates.orderStatusUpdate({
        orderId: 10,
        statusDe: 'pendente',
        statusPara: 'confirmado',
        customerName: 'Maria',
      });

      expect(subject).toContain('#10');
      expect(subject).toContain('Confirmado');
      expect(html).toContain('Atualização do Pedido');
      expect(html).toContain('Maria');
      expect(html).toContain('Confirmado');
    });

    it('exibe mensagem de cancelamento', () => {
      const { html } = templates.orderStatusUpdate({
        orderId: 5,
        statusDe: 'pendente',
        statusPara: 'cancelado',
      });
      expect(html).toContain('cancelamento');
    });

    it('exibe mensagem de envio', () => {
      const { html } = templates.orderStatusUpdate({
        orderId: 5,
        statusDe: 'em_separacao',
        statusPara: 'enviado',
      });
      expect(html).toContain('caminho');
    });
  });

  describe('welcome', () => {
    it('retorna subject e html com dados do usuário', () => {
      const { subject, html } = templates.welcome({
        name: 'Ana',
        email: 'ana@test.com',
      });

      expect(subject).toContain('Surface');
      expect(html).toContain('Bem-vindo');
      expect(html).toContain('Ana');
      expect(html).toContain('ana@test.com');
    });
  });

  describe('passwordReset', () => {
    it('retorna subject e html com link de reset', () => {
      const { subject, html } = templates.passwordReset({
        name: 'Carlos',
        resetUrl: 'https://surface.com/reset/abc123',
      });

      expect(subject).toContain('senha');
      expect(html).toContain('Carlos');
      expect(html).toContain('https://surface.com/reset/abc123');
    });
  });
});

// ─── sendMail / safeSend comportamento ────────────────

describe('emailService – sendMail (preview mode)', () => {
  // Como EMAIL_PROVIDER não está setado, opera em modo preview
  // Precisamos importar o módulo real (sem mock) para testar sendMail de verdade
  let realEmailService;

  beforeEach(async () => {
    // importOriginal para obter o módulo real
    realEmailService = await vi.importActual('../../src/services/emailService.js');
  });

  it('sendMail retorna preview quando sem provider', async () => {
    const result = await realEmailService.sendMail({
      to: 'test@x.com',
      subject: 'Test',
      html: '<p>Oi</p>',
    });
    expect(result.status).toBe('preview');
  });

  it('sendMail retorna skipped sem destinatário', async () => {
    const result = await realEmailService.sendMail({
      to: '',
      subject: 'Test',
      html: '<p>Oi</p>',
    });
    expect(result.status).toBe('skipped');
  });

  it('sendOrderConfirmation (safeSend) nunca lança erro', async () => {
    const fn = realEmailService.sendOrderConfirmation;
    await expect(fn({})).resolves.not.toThrow();
  });

  it('sendWelcomeEmail (safeSend) nunca lança erro', async () => {
    const fn = realEmailService.sendWelcomeEmail;
    await expect(fn({})).resolves.not.toThrow();
  });
});
