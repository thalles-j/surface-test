import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUS,
  STATUS_LABELS,
  isValidTransition,
  getAllStatuses,
  getNextStatuses,
} from '../../src/helpers/orderStatus.js';

describe('orderStatus', () => {
  // ─── ORDER_STATUS enum ─────────────────────────────

  describe('ORDER_STATUS', () => {
    it('deve conter todos os 8 status', () => {
      const keys = Object.keys(ORDER_STATUS);
      expect(keys).toHaveLength(8);
    });

    it('valores devem ser strings lowercase', () => {
      for (const val of Object.values(ORDER_STATUS)) {
        expect(val).toBe(val.toLowerCase());
      }
    });

    it('deve ter status legados (processando, concluido)', () => {
      expect(ORDER_STATUS.PROCESSANDO).toBe('processando');
      expect(ORDER_STATUS.CONCLUIDO).toBe('concluido');
    });
  });

  // ─── STATUS_LABELS ─────────────────────────────────

  describe('STATUS_LABELS', () => {
    it('deve ter label para cada status', () => {
      for (const val of Object.values(ORDER_STATUS)) {
        expect(STATUS_LABELS[val]).toBeDefined();
        expect(typeof STATUS_LABELS[val]).toBe('string');
      }
    });
  });

  // ─── isValidTransition ─────────────────────────────

  describe('isValidTransition()', () => {
    // Transições válidas
    const validTransitions = [
      ['pendente', 'confirmado'],
      ['pendente', 'cancelado'],
      ['confirmado', 'em_separacao'],
      ['confirmado', 'cancelado'],
      ['em_separacao', 'enviado'],
      ['em_separacao', 'cancelado'],
      ['enviado', 'finalizado'],
      // Legados
      ['processando', 'enviado'],
      ['processando', 'finalizado'],
      ['processando', 'cancelado'],
    ];

    it.each(validTransitions)(
      'deve permitir transição %s → %s',
      (from, to) => {
        expect(isValidTransition(from, to)).toBe(true);
      }
    );

    // Transições inválidas
    const invalidTransitions = [
      ['pendente', 'enviado'],
      ['pendente', 'finalizado'],
      ['pendente', 'em_separacao'],
      ['confirmado', 'finalizado'],
      ['confirmado', 'enviado'],
      ['em_separacao', 'confirmado'],
      ['em_separacao', 'finalizado'],
      ['enviado', 'cancelado'],
      ['enviado', 'confirmado'],
      ['finalizado', 'pendente'],
      ['finalizado', 'cancelado'],
      ['cancelado', 'pendente'],
      ['cancelado', 'confirmado'],
      ['concluido', 'cancelado'],
      ['concluido', 'pendente'],
    ];

    it.each(invalidTransitions)(
      'deve rejeitar transição %s → %s',
      (from, to) => {
        expect(isValidTransition(from, to)).toBe(false);
      }
    );

    it('deve retornar false para status inexistente', () => {
      expect(isValidTransition('inexistente', 'pendente')).toBe(false);
    });

    it('deve retornar false para status undefined', () => {
      expect(isValidTransition(undefined, 'pendente')).toBe(false);
    });
  });

  // ─── getAllStatuses ─────────────────────────────────

  describe('getAllStatuses()', () => {
    it('deve retornar array com 8 status', () => {
      const all = getAllStatuses();
      expect(all).toHaveLength(8);
      expect(all).toContain('pendente');
      expect(all).toContain('processando');
      expect(all).toContain('concluido');
    });
  });

  // ─── getNextStatuses ────────────────────────────────

  describe('getNextStatuses()', () => {
    it('pendente pode ir para confirmado ou cancelado', () => {
      expect(getNextStatuses('pendente')).toEqual(['confirmado', 'cancelado']);
    });

    it('confirmado pode ir para em_separacao ou cancelado', () => {
      expect(getNextStatuses('confirmado')).toEqual(['em_separacao', 'cancelado']);
    });

    it('enviado só pode ir para finalizado', () => {
      expect(getNextStatuses('enviado')).toEqual(['finalizado']);
    });

    it('finalizado não tem próximos status', () => {
      expect(getNextStatuses('finalizado')).toEqual([]);
    });

    it('cancelado não tem próximos status', () => {
      expect(getNextStatuses('cancelado')).toEqual([]);
    });

    it('concluido (legado) não tem próximos status', () => {
      expect(getNextStatuses('concluido')).toEqual([]);
    });

    it('processando (legado) pode ir para enviado, finalizado ou cancelado', () => {
      expect(getNextStatuses('processando')).toEqual(['enviado', 'finalizado', 'cancelado']);
    });

    it('status inexistente retorna array vazio', () => {
      expect(getNextStatuses('invalido')).toEqual([]);
    });
  });
});
