import { describe, it, expect } from 'vitest';
import { maskPhone } from '../utils/masks';

describe('maskPhone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(maskPhone('5511999999999')).toBe('(55) 11999-9999');
  });

  it('formata fixo com 10 dígitos', () => {
    expect(maskPhone('1122223333')).toBe('(11) 2222-3333');
  });

  it('ignora não-numéricos', () => {
    expect(maskPhone('(11) 9abcd9999-9999')).toBe('(11) 99999-9999');
  });

  it('limita a 11 dígitos', () => {
    expect(maskPhone('123456789012345')).toBe('(12) 34567-8901');
  });
});
