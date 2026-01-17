/**
 * WebSocket Protocol
 * Optimized for performance with compact field names and batching
 */

import type { MarketTick, MarketMetrics } from '../../../src/types/market.js';

// Compact tick format: [symbol, date, open, high, low, close, volume, openInt?]
type CompactTick = [string, string, number, number, number, number, number, number?];

// Compact metrics format
type CompactMetrics = [number, number, number, number, number, number, number, string];

/**
 * Round number to 3 decimal places for prices, 0 for volumes
 */
function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundVolume(value: number): number {
  return Math.round(value);
}

/**
 * Convert MarketTick to compact format
 * Format: [symbol, date, open, high, low, close, volume, openInt?]
 */
export function compactTick(tick: MarketTick): CompactTick {
  const result: CompactTick = [
    tick.symbol,
    tick.date,
    roundPrice(tick.open),
    roundPrice(tick.high),
    roundPrice(tick.low),
    roundPrice(tick.close),
    roundVolume(tick.volume),
  ];
  if (tick.openInt !== undefined && tick.openInt > 0) {
    result[7] = roundVolume(tick.openInt);
  }
  return result;
}

/**
 * Convert compact format back to MarketTick
 */
export function expandTick(compact: CompactTick): MarketTick {
  return {
    symbol: compact[0],
    date: compact[1],
    open: compact[2],
    high: compact[3],
    low: compact[4],
    close: compact[5],
    volume: compact[6],
    openInt: compact[7],
  };
}

/**
 * Convert MarketMetrics to compact format
 * Format: [totalTicks, totalVolume, avgPrice, highPrice, lowPrice, priceChange, priceChangePercent, lastUpdate]
 */
export function compactMetrics(metrics: MarketMetrics): CompactMetrics {
  return [
    metrics.totalTicks,
    roundVolume(metrics.totalVolume),
    roundPrice(metrics.averagePrice),
    roundPrice(metrics.highestPrice),
    roundPrice(metrics.lowestPrice),
    roundPrice(metrics.priceChange),
    roundPrice(metrics.priceChangePercent),
    metrics.lastUpdate,
  ];
}

/**
 * Convert compact format back to MarketMetrics
 */
export function expandMetrics(compact: CompactMetrics): MarketMetrics {
  return {
    totalTicks: compact[0],
    totalVolume: compact[1],
    averagePrice: compact[2],
    highestPrice: compact[3],
    lowestPrice: compact[4],
    priceChange: compact[5],
    priceChangePercent: compact[6],
    lastUpdate: compact[7],
  };
}

/**
 * Create optimized tick message (single or batched)
 * Format: {t: 't', d: CompactTick | CompactTick[]}
 */
export function createTickMessage(tick: MarketTick): string {
  return JSON.stringify({ t: 't', d: compactTick(tick) });
}

/**
 * Create optimized batched tick message
 * Format: {t: 't', d: CompactTick[]}
 */
export function createBatchedTickMessage(ticks: MarketTick[]): string {
  return JSON.stringify({ t: 't', d: ticks.map(compactTick) });
}

/**
 * Create optimized metrics message
 * Format: {t: 'm', d: CompactMetrics}
 */
export function createMetricsMessage(metrics: MarketMetrics): string {
  return JSON.stringify({ t: 'm', d: compactMetrics(metrics) });
}

/**
 * Create optimized snapshot message
 * Format: {t: 's', d: CompactTick[]}
 */
export function createSnapshotMessage(ticks: MarketTick[]): string {
  return JSON.stringify({ t: 's', d: ticks.map(compactTick) });
}

/**
 * Create optimized error message
 * Format: {t: 'e', d: string}
 */
export function createErrorMessage(message: string): string {
  return JSON.stringify({ t: 'e', d: message });
}

/**
 * Parse optimized message
 */
export function parseMessage(data: string): {
  type: 'tick' | 'metrics' | 'snapshot' | 'error';
  data: MarketTick | MarketTick[] | MarketMetrics | string;
} | null {
  try {
    const parsed = JSON.parse(data) as { t: string; d: unknown };
    if (!parsed.t || !('d' in parsed)) {
      return null;
    }

    switch (parsed.t) {
      case 't': {
        // Tick(s) - can be single or array
        const d = parsed.d;
        if (Array.isArray(d)) {
          if (d.length > 0 && Array.isArray(d[0])) {
            // Array of ticks
            return { type: 'tick', data: (d as CompactTick[]).map(expandTick) };
          } else {
            // Single tick as array
            return { type: 'tick', data: expandTick(d as CompactTick) };
          }
        }
        return null;
      }
      case 'm': {
        // Metrics
        return { type: 'metrics', data: expandMetrics(parsed.d as CompactMetrics) };
      }
      case 's': {
        // Snapshot
        return { type: 'snapshot', data: (parsed.d as CompactTick[]).map(expandTick) };
      }
      case 'e': {
        // Error
        return { type: 'error', data: parsed.d as string };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
