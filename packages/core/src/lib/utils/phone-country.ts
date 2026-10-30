import countries from './countries.json';
export interface PhoneCountry {
  country: string;
  iso: string;
  dialCode: string;
  mask: string;
  localDigits: number;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = countries;

export function phoneCountry(countryOrPhone?: string): PhoneCountry {
  const value = countryOrPhone?.trim() ?? '';
  return PHONE_COUNTRIES.find((item) =>
    item.country === value || value.startsWith(item.dialCode)
  ) ?? (value && !value.startsWith('+') ? { country: value, iso: '', dialCode: '+', mask: '000000000000000', localDigits: 15 } : PHONE_COUNTRIES[0]);
}

export function localPhoneValue(value: string | null | undefined, country: string): string {
  const config = phoneCountry(country);
  const digits = (value ?? '').replace(/\D/g, '');
  const dialDigits = config.dialCode.replace(/\D/g, '');
  const local = digits.length > config.localDigits && digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;
  return local.slice(0, config.localDigits);
}

export function internationalPhone(value: string | null | undefined, country: string): string {
  const config = phoneCountry(country);
  const local = localPhoneValue(value, country);
  return local ? `${config.dialCode}${local}` : '';
}
