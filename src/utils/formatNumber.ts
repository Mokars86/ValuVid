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

/**
 * Format published date into TikTok-style compact relative time
 * (e.g. "Just now", "5m", "20m", "1h", "3d", "2w")
 */
export function formatPublishedTime(dateInput?: string | number, fallbackId?: string): string {
  let timestamp: number | null = null;

  if (typeof dateInput === 'number' && !isNaN(dateInput) && dateInput > 0) {
    timestamp = dateInput;
  } else if (typeof dateInput === 'string' && dateInput.trim().length > 0) {
    const parsed = Date.parse(dateInput);
    if (!isNaN(parsed)) {
      timestamp = parsed;
    }
  }

  // If no explicit date field, extract from timestamped IDs (e.g. vid-user-1731671234567)
  if (!timestamp && fallbackId) {
    const match = fallbackId.match(/(?:vid-user-|goal-|post-)(\d{10,13})/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        timestamp = num < 10000000000 ? num * 1000 : num;
      }
    }
  }

  // Graceful fallback for initial community drops
  if (!timestamp) {
    return '2h';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSec < 60) {
    return 'Just now';
  }
  if (diffMin < 60) {
    return `${diffMin}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  if (diffWeeks < 52) {
    return `${diffWeeks}w`;
  }
  return `${Math.max(1, Math.floor(diffDays / 365))}y`;
}
