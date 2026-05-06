import { describe, it, expect, vi } from 'vitest';
import {
  applyCoupon,
  normalizeCouponCode,
  normalizeCouponData,
  incrementCouponUsage,
} from '../../src/services/couponService.js';
import { createPrismaMock } from '../helpers/prismaMock.js';

describe('couponService — applyCoupon (pure)', () => {
  // ─── Cupom porcentagem ──────────────────────────────

  describe('tipo porcentagem', () => {
    it('calcula 10% de desconto corretamente', () => {
      const coupon = { tipo: 'porcentagem', desconto: 10 };
      const result = applyCoupon(coupon, 200);
      expect(result).toBe(20);
    });

    it('calcula 50% de desconto', () => {
      const coupon = { tipo: 'porcentagem', desconto: 50 };
      const result = applyCoupon(coupon, 100);
      expect(result).toBe(50);
    });

    it('calcula 100% de desconto (capped ao subtotal)', () => {
      const coupon = { tipo: 'porcentagem', desconto: 100 };
      const result = applyCoupon(coupon, 150);
      expect(result).toBe(150);
    });

    it('arredonda para 2 casas decimais', () => {
      const coupon = { tipo: 'porcentagem', desconto: 33 };
      const result = applyCoupon(coupon, 100);
      // 33% de 100 = 33.00
      expect(result).toBe(33);
    });

    it('lida com subtotais com centavos', () => {
      const coupon = { tipo: 'porcentagem', desconto: 15 };
      const result = applyCoupon(coupon, 99.90);
      // 15% de 99.90 = 14.985 → arredondado para 14.99
      expect(result).toBe(14.99);
    });

    it('porcentagem > 100% é limitada ao subtotal', () => {
      const coupon = { tipo: 'porcentagem', desconto: 150 };
      const result = applyCoupon(coupon, 80);
      // 150% de 80 = 120, mas capped em 80
      expect(result).toBe(80);
    });
  });

  // ─── Cupom fixo ─────────────────────────────────────

  describe('tipo fixo', () => {
    it('aplica desconto fixo menor que subtotal', () => {
      const coupon = { tipo: 'fixo', desconto: 30 };
      const result = applyCoupon(coupon, 200);
      expect(result).toBe(30);
    });

    it('desconto fixo é limitado ao subtotal', () => {
      const coupon = { tipo: 'fixo', desconto: 500 };
      const result = applyCoupon(coupon, 150);
      expect(result).toBe(150);
    });

    it('desconto fixo igual ao subtotal retorna subtotal', () => {
      const coupon = { tipo: 'fixo', desconto: 100 };
      const result = applyCoupon(coupon, 100);
      expect(result).toBe(100);
    });
  });

  // ─── Edge cases ─────────────────────────────────────

  describe('edge cases', () => {
    it('tipo desconhecido retorna 0', () => {
      const coupon = { tipo: 'outro', desconto: 50 };
      const result = applyCoupon(coupon, 200);
      expect(result).toBe(0);
    });

    it('desconto 0 retorna 0', () => {
      const coupon = { tipo: 'porcentagem', desconto: 0 };
      const result = applyCoupon(coupon, 200);
      expect(result).toBe(0);
    });

    it('subtotal 0 retorna 0', () => {
      const coupon = { tipo: 'fixo', desconto: 50 };
      const result = applyCoupon(coupon, 0);
      expect(result).toBe(0);
    });

    it('aceita strings numéricas (desconto e subtotal)', () => {
      const coupon = { tipo: 'porcentagem', desconto: '20' };
      const result = applyCoupon(coupon, '100');
      expect(result).toBe(20);
    });
  });
});

// ─── normalizeCouponCode ──────────────────────────────

describe('couponService — normalizeCouponCode', () => {
  it('converte para uppercase e trim', () => {
    expect(normalizeCouponCode('  promo10  ')).toBe('PROMO10');
  });

  it('retorna string vazia para null', () => {
    expect(normalizeCouponCode(null)).toBe('');
  });

  it('retorna string vazia para undefined', () => {
    expect(normalizeCouponCode(undefined)).toBe('');
  });
});

// ─── normalizeCouponData ──────────────────────────────

describe('couponService — normalizeCouponData', () => {
  it('normaliza dados válidos de cupom porcentagem', () => {
    const result = normalizeCouponData({
      codigo: '  promo10  ',
      tipo: 'porcentagem',
      desconto: 10,
    });
    expect(result.codigo).toBe('PROMO10');
    expect(result.tipo).toBe('porcentagem');
    expect(result.desconto).toBe(10);
    expect(result.ativo).toBe(true);
  });

  it('normaliza dados válidos de cupom fixo', () => {
    const result = normalizeCouponData({
      codigo: 'OFF50',
      tipo: 'fixo',
      desconto: 50,
    });
    expect(result.tipo).toBe('fixo');
  });

  it('rejeita código vazio', () => {
    expect(() => normalizeCouponData({ codigo: '', tipo: 'fixo', desconto: 10 })).toThrow('Codigo do cupom e obrigatorio');
  });

  it('rejeita desconto <= 0', () => {
    expect(() => normalizeCouponData({ codigo: 'X', tipo: 'fixo', desconto: 0 })).toThrow('Desconto do cupom deve ser maior que zero');
  });

  it('rejeita porcentagem > 100', () => {
    expect(() => normalizeCouponData({ codigo: 'X', tipo: 'porcentagem', desconto: 101 })).toThrow('maior que 100%');
  });

  it('rejeita limite de usos inválido', () => {
    expect(() => normalizeCouponData({ codigo: 'X', tipo: 'fixo', desconto: 10, limite_usos: 0 })).toThrow('Limite de usos invalido');
  });

  it('aceita limite_usos null', () => {
    const result = normalizeCouponData({ codigo: 'X', tipo: 'fixo', desconto: 10, limite_usos: null });
    expect(result.limite_usos).toBeNull();
  });

  it('aceita limite_usos vazio (string)', () => {
    const result = normalizeCouponData({ codigo: 'X', tipo: 'fixo', desconto: 10, limite_usos: '' });
    expect(result.limite_usos).toBeNull();
  });
});

// ─── incrementCouponUsage ─────────────────────────────

describe('couponService — incrementCouponUsage', () => {
  it('incrementa usos do cupom via tx', async () => {
    const txMock = createPrismaMock();
    await incrementCouponUsage(txMock, 'PROMO10');

    expect(txMock.cupons.update).toHaveBeenCalledWith({
      where: { codigo: 'PROMO10' },
      data: { usos: { increment: 1 } },
    });
  });
});
