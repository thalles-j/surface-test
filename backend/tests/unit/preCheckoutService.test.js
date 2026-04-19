import { describe, it, expect } from 'vitest';
import {
  buildPreCheckoutWhatsAppMessage,
  createPreCheckoutWhatsApp,
  generatePreCheckoutWhatsAppUrl,
} from '../../src/services/checkoutService.js';

const payload = {
  nome: 'Joao Silva',
  email: 'joao@email.com',
  telefone: '+55 24 99999-9999',
  endereco: 'Rua A, 100 - Centro',
  tipo_pagamento: 'PIX',
};

describe('pre-checkout whatsapp service', () => {
  it('gera mensagem no formato esperado', () => {
    const message = buildPreCheckoutWhatsAppMessage(payload);
    expect(message).toContain('🛒 *NOVO PRÉ-CHECKOUT*');
    expect(message).toContain('👤 Nome: Joao Silva');
    expect(message).toContain('📧 Email: joao@email.com');
    expect(message).toContain('📞 Telefone: 5524999999999');
    expect(message).toContain('📍 Endereço: Rua A, 100 - Centro');
    expect(message).toContain('💳 Pagamento: PIX');
  });

  it('gera URL com encodeURIComponent correto', () => {
    const message = buildPreCheckoutWhatsAppMessage(payload);
    const url = generatePreCheckoutWhatsAppUrl(message);
    expect(url).toContain('https://wa.me/5524988582885');
    expect(url).toContain(encodeURIComponent(message));
  });

  it('retorna objeto final com message e whatsappUrl', () => {
    const result = createPreCheckoutWhatsApp(payload);
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('whatsappUrl');
  });

  it('valida campos obrigatorios', () => {
    expect(() => createPreCheckoutWhatsApp({ ...payload, nome: '' })).toThrow('Nome e obrigatorio.');
    expect(() => createPreCheckoutWhatsApp({ ...payload, email: 'abc' })).toThrow('Email invalido.');
    expect(() => createPreCheckoutWhatsApp({ ...payload, telefone: '' })).toThrow('Telefone e obrigatorio.');
    expect(() => createPreCheckoutWhatsApp({ ...payload, endereco: '' })).toThrow('Endereco e obrigatorio.');
    expect(() => createPreCheckoutWhatsApp({ ...payload, tipo_pagamento: '' })).toThrow('Tipo de pagamento e obrigatorio.');
  });
});
