// Utility functions for formatting numbers and currency

export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000) {
    return sign + (absValue / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absValue >= 1_000) {
    return sign + (absValue / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return sign + absValue.toString();
  }
}

export function formatCurrency(value: number, currency: string = '₱'): string {
  const compactNumber = formatCompactNumber(value);
  return `${currency}${compactNumber}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrencyFull(value: number, currency: string = '₱'): string {
  return `${currency}${formatNumber(value)}`;
}
