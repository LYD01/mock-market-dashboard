import type { MarketTick } from '../types/market';

/**
 * Parse CSV line into MarketTick
 * CSV format: Date,Open,High,Low,Close,Volume,OpenInt
 */
export function parseCSVLine(line: string, symbol: string): MarketTick | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Date')) {
    // Skip header or empty lines
    return null;
  }

  const parts = trimmed.split(',');
  if (parts.length < 6) {
    return null;
  }

  const date = parts[0].trim();
  const open = parseFloat(parts[1].trim());
  const high = parseFloat(parts[2].trim());
  const low = parseFloat(parts[3].trim());
  const close = parseFloat(parts[4].trim());
  const volume = parseFloat(parts[5].trim());
  const openInt = parts.length > 6 ? parseFloat(parts[6].trim()) : undefined;

  // Validate parsed values
  if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume) || !date) {
    return null;
  }

  return {
    symbol,
    date,
    open,
    high,
    low,
    close,
    volume,
    openInt: openInt && !isNaN(openInt) ? openInt : undefined,
  };
}

/**
 * Parse CSV content into array of MarketTick
 */
export function parseCSV(csvContent: string, symbol: string): MarketTick[] {
  const lines = csvContent.split('\n');
  const ticks: MarketTick[] = [];

  for (const line of lines) {
    const tick = parseCSVLine(line, symbol);
    if (tick) {
      ticks.push(tick);
    }
  }

  // Sort by date descending (newest first) to match WebSocket behavior
  return ticks.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Extract symbol from filename
 * Example: "a.us.txt" -> "a.us"
 */
export function extractSymbolFromFilename(filename: string): string {
  return filename.replace(/\.txt$/, '');
}
