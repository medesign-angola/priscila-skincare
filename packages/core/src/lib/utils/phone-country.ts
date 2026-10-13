export interface PhoneCountry {
  country: string;
  iso: 'AO' | 'PT' | 'FR';
  dialCode: string;
  mask: string;
  localDigits: number;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { country: 'Angola', iso: 'AO', dialCode: '+244', mask: '000 000 000', localDigits: 9 },
  { country: 'Portugal', iso: 'PT', dialCode: '+351', mask: '000 000 000', localDigits: 9 },
  { country: 'França', iso: 'FR', dialCode: '+33', mask: '0 00 00 00 00', localDigits: 9 },
];

export function phoneCountry(countryOrPhone?: string): PhoneCountry {
  const value = countryOrPhone?.trim() ?? '';
  return PHONE_COUNTRIES.find((item) =>
    item.country === value || value.startsWith(item.dialCode)
  ) ?? PHONE_COUNTRIES[0];
}

export function localPhoneValue(value: string | null | undefined, country: string): string {
  const config = phoneCountry(country);
  const digits = (value ?? '').replace(/\D/g, '');
  const dialDigits = config.dialCode.replace(/\D/g, '');
  const local = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;
  return local.slice(0, config.localDigits);
}

export function internationalPhone(value: string | null | undefined, country: string): string {
  const config = phoneCountry(country);
  const local = localPhoneValue(value, country);
  return local ? `${config.dialCode}${local}` : '';
}
