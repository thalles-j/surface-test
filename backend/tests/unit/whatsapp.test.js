import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, generateWhatsAppLink } from '../../src/helpers/whatsapp.js';

describe('whatsapp helpers', () => {
  const orderFixture = {
    id_pedido: 42,
    nome_cliente: null,
    subtotal: 269.80,
    desconto: 0,
    frete: 15,
    total: 284.80,
    usuario: { nome: 'João Silva', email: 'joao@test.com' },
    pedidoProdutos: [
      {
        produto: { nome_produto: 'Camiseta Surface' },
        sku_variacao: '1-M',
        quantidade: 2,
        preco_unitario: 89.90,
      },
      {
        produto: { nome_produto: 'Calça Cargo' },
        sku_variacao: '2-42',
        quantidade: 1,
        preco_unitario: 90.00,
      },
    ],
  };

  describe('buildWhatsAppMessage()', () => {
    it('contém header "Novo Pedido - Surface"', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Novo Pedido - Surface');
    });

    it('contém nome do cliente', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Cliente: João Silva');
    });

    it('contém número do pedido', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Pedido #: 42');
    });

    it('contém itens numerados com detalhes', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('1. Camiseta Surface (M)');
      expect(msg).toContain('2x');
      expect(msg).toContain('2. Calça Cargo (42)');
      expect(msg).toContain('1x');
    });

    it('contém subtotal formatado', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Subtotal: R$');
    });

    it('mostra frete quando > 0', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Frete: R$');
      expect(msg).not.toContain('Grátis');
    });

    it('mostra "Grátis" quando frete é 0', () => {
      const orderFreteGratis = { ...orderFixture, frete: 0 };
      const msg = buildWhatsAppMessage(orderFreteGratis);
      expect(msg).toContain('Frete: Gratis');
    });

    it('mostra desconto quando > 0', () => {
      const orderComDesconto = { ...orderFixture, desconto: 20 };
      const msg = buildWhatsAppMessage(orderComDesconto);
      expect(msg).toContain('Desconto total:');
    });

    it('omite desconto quando 0', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).not.toContain('Desconto:');
    });

    it('contém total', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Total: R$');
    });

    it('termina com mensagem de confirmação', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      expect(msg).toContain('Aguardo confirmacao para finalizar a compra!');
    });

    it('usa nome_cliente quando disponível (venda presencial)', () => {
      const orderPresencial = { ...orderFixture, nome_cliente: 'Maria', usuario: null };
      const msg = buildWhatsAppMessage(orderPresencial);
      expect(msg).toContain('Cliente: Maria');
    });

    it('usa "Cliente" como fallback sem nome', () => {
      const orderSemNome = { ...orderFixture, nome_cliente: null, usuario: null };
      const msg = buildWhatsAppMessage(orderSemNome);
      expect(msg).toContain('Cliente: Cliente');
    });
  });

  describe('generateWhatsAppLink()', () => {
    it('gera URL wa.me com número correto', () => {
      const link = generateWhatsAppLink('Teste');
      expect(link).toContain('https://wa.me/5524988582885');
    });

    it('encoda a mensagem no parâmetro text', () => {
      const link = generateWhatsAppLink('Olá mundo');
      expect(link).toContain('text=');
      expect(link).toContain(encodeURIComponent('Olá mundo'));
    });

    it('encoda emojis corretamente', () => {
      const link = generateWhatsAppLink('🛒 Pedido');
      expect(link).toContain(encodeURIComponent('🛒'));
    });
  });

  describe('fluxo completo: mensagem → link', () => {
    it('gera link válido a partir de um pedido', () => {
      const msg = buildWhatsAppMessage(orderFixture);
      const link = generateWhatsAppLink(msg);

      expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=.+/);
      expect(decodeURIComponent(link)).toContain('Novo Pedido - Surface');
      expect(decodeURIComponent(link)).toContain('João Silva');
    });
  });
});
