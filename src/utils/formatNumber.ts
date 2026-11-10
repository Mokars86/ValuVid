/**
 * Number formatting utilities for ValuVid
 * Formats metrics compactly (e.g. 1000 -> 1k, 2000 -> 2k, 24800 -> 24.8k, 1000000 -> 1M)
 */

export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num) || num === 0) {
    return '0';
  }

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${abs}`;
  }

  if (abs < 1000000) {
    const k = abs / 1000;
    // Whole thousands: 1000 -> 1k, 2000 -> 2k
    // Fractional: 1500 -> 1.5k, 24800 -> 24.8k
    const formatted = (k % 1 === 0) ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}k`;
  }

  if (abs < 1000000000) {
    const m = abs / 1000000;
    const formatted = (m % 1 === 0) ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}M`;
  }

  const b = abs / 1000000000;
  const formatted = (b % 1 === 0) ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '');
  return `${sign}${formatted}B`;
}
