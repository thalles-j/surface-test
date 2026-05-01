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
  tipo_pagamento: 'DINHEIRO',
};

describe('pre-checkout whatsapp service', () => {
  it('gera mensagem no formato esperado', () => {
    const message = buildPreCheckoutWhatsAppMessage(payload);
    expect(message).toContain('NOVO PRE-CHECKOUT');
    expect(message).toContain('Nome: Joao Silva');
    expect(message).toContain('Email: joao@email.com');
    expect(message).toContain('Telefone: 5524999999999');
    expect(message).toContain('Endereco: Rua A, 100 - Centro');
    expect(message).toContain('Pagamento: DINHEIRO');
  });

  it('gera URL com encodeURIComponent correto', () => {
    const message = buildPreCheckoutWhatsAppMessage(payload);
    const url = generatePreCheckoutWhatsAppUrl(message);
    expect(url).toContain('https://wa.me/5524988582885');
    expect(url).toContain(encodeURIComponent(message));
  });

  it('retorna objeto final com message e whatsappUrl', async () => {
    const result = await createPreCheckoutWhatsApp(payload);
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('whatsappUrl');
  });

  it('valida campos obrigatorios', async () => {
    await expect(createPreCheckoutWhatsApp({ ...payload, nome: '' })).rejects.toThrow('Nome e obrigatorio.');
    await expect(createPreCheckoutWhatsApp({ ...payload, email: 'abc' })).rejects.toThrow('Email invalido.');
    await expect(createPreCheckoutWhatsApp({ ...payload, telefone: '' })).rejects.toThrow('Telefone e obrigatorio.');
    await expect(createPreCheckoutWhatsApp({ ...payload, endereco: '' })).rejects.toThrow('Endereco e obrigatorio.');
    await expect(createPreCheckoutWhatsApp({ ...payload, tipo_pagamento: '' })).rejects.toThrow('Tipo de pagamento e obrigatorio.');
  });
});
