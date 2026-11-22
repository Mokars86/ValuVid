export type SupportedCurrency = 'USD' | 'GHS' | 'NGN' | 'KES' | 'ZAR';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  country: string;
  rateFromUSD: number;
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'Global',
    rateFromUSD: 1,
  },
  GHS: {
    code: 'GHS',
    symbol: 'GHS',
    name: 'Ghanaian Cedi',
    country: 'Ghana',
    rateFromUSD: 12,
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    country: 'Nigeria',
    rateFromUSD: 1600,
  },
  KES: {
    code: 'KES',
    symbol: 'KES',
    name: 'Kenyan Shilling',
    country: 'Kenya',
    rateFromUSD: 130,
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    country: 'South Africa',
    rateFromUSD: 18,
  },
};

export const SUPPORTED_CASHOUT_CURRENCIES: CurrencyInfo[] = [
  CURRENCY_CONFIG.USD,
  CURRENCY_CONFIG.GHS,
  CURRENCY_CONFIG.NGN,
  CURRENCY_CONFIG.KES,
  CURRENCY_CONFIG.ZAR,
];

export const MIN_CASHOUT_USD = 5.0;

export function ghsFromUsd(usd: number): number {
  return Number((usd * CURRENCY_CONFIG.GHS.rateFromUSD).toFixed(2));
}

export function usdFromGhs(ghs: number): number {
  return Number((ghs / CURRENCY_CONFIG.GHS.rateFromUSD).toFixed(2));
}

export function convertUsdToCurrency(usd: number, currency: SupportedCurrency): number {
  const rate = CURRENCY_CONFIG[currency]?.rateFromUSD ?? 1;
  return Number((usd * rate).toFixed(2));
}

export function formatUsd(usd: number): string {
  return `$${Number(usd || 0).toFixed(2)}`;
}

export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  const info = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const formatted = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return info.code === 'USD' || info.code === 'NGN'
    ? `${info.symbol}${formatted}`
    : `${info.symbol} ${formatted}`;
}
