import { Pipe, PipeTransform } from '@angular/core';

export type PriceCurrency = 'AOA' | 'EUR';
export type PriceLanguage = 'pt' | 'fr';

export function formatPrice(
  value: number | null | undefined,
  currency: PriceCurrency,
  language: PriceLanguage = 'pt',
  includeCurrency = true,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '';
  }

  const formattedValue = new Intl.NumberFormat(
    language === 'pt' ? 'pt-AO' : 'fr-FR',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(value);

  if (!includeCurrency) return formattedValue;

  const label = currency === 'AOA' ? 'Kz' : '€';

  return currency === 'AOA' && language === 'pt'
    ? `${label} ${formattedValue}`
    : `${formattedValue} ${label}`;
}

@Pipe({
  name: 'priceFormat',
})
export class PriceFormatPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currency: PriceCurrency,
    language: PriceLanguage = 'pt',
    includeCurrency = true,
  ): string {
    return formatPrice(value, currency, language, includeCurrency);
  }
}
