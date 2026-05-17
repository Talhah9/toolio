import { useLang } from '../context/LanguageContext';

// Fixed conversion table — clean round numbers, 1€ ≈ 1.08$
const USD_MAP = { 0: 0, 9: 10, 19: 21, 39: 42, 49: 54, 79: 85 };

export function useCurrency() {
  const { lang } = useLang();
  const isEn = lang === 'en';

  const convert = (eur) => isEn ? (USD_MAP[eur] ?? Math.round(eur * 1.08)) : eur;

  const format = (eur) => {
    const amount = convert(eur);
    return isEn ? `$${amount}` : `${amount} €`;
  };

  return {
    symbol: isEn ? '$' : '€',
    convert,
    format,
  };
}
