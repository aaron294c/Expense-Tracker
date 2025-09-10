// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency helpers
export function getCurrencyFromHousehold(
  household?: { base_currency?: string | null },
  fallback: string = 'USD'
) {
  const code = household?.base_currency?.toUpperCase?.();
  return code && code.length === 3 ? code : fallback;
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-GB'): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercentage(value: number): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${Math.round(n)}%`;
}

// Date helpers
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' = 'short',
  locale = 'en-GB'
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return ''; // guard invalid dates

  if (format === 'long') {
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getMonthDisplay(monthString: string, locale = 'en-GB'): string {
  const date = new Date(monthString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
