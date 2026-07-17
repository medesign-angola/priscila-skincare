import { PriceFormatPipe } from './price-format.pipe';

describe('PriceFormatPipe', () => {
  const pipe = new PriceFormatPipe();

  it('formats AOA for Portuguese', () => {
    expect(pipe.transform(270000, 'AOA', 'pt')).toBe('Kz 270 000,00');
  });

  it('formats AOA for French', () => {
    expect(pipe.transform(270000, 'AOA', 'fr')).toBe('270 000,00 Kz');
  });

  it('formats EUR for Portuguese and French', () => {
    expect(pipe.transform(270, 'EUR', 'pt')).toBe('270,00 €');
    expect(pipe.transform(270, 'EUR', 'fr')).toBe('270,00 €');
  });

  it('formats zero and decimal values', () => {
    expect(pipe.transform(0, 'AOA', 'pt')).toBe('Kz 0,00');
    expect(pipe.transform(12.5, 'EUR', 'pt', false)).toBe('12,50');
  });

  it('returns an empty string for missing values', () => {
    expect(pipe.transform(null, 'AOA')).toBe('');
    expect(pipe.transform(undefined, 'EUR')).toBe('');
  });
});
