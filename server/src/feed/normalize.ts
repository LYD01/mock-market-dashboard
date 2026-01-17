/**
 * Data Normalizer
 * Converts parsed stock data to MarketTick format
 */

import type { MarketTick } from '../../../src/types/market.js';
import type { ParsedStockRow } from './parseTxt.js';

/**
 * Normalize parsed stock row to MarketTick format
 */
export function normalizeToMarketTick(symbol: string, row: ParsedStockRow): MarketTick {
  return {
    symbol,
    date: row.date,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
    openInt: row.openInt > 0 ? row.openInt : undefined,
  };
}

/**
 * Normalize multiple rows
 */
export function normalizeToMarketTicks(symbol: string, rows: ParsedStockRow[]): MarketTick[] {
  return rows.map((row) => normalizeToMarketTick(symbol, row));
}

/**
 * Sort ticks by date (oldest first)
 */
export function sortTicksByDate(ticks: MarketTick[]): MarketTick[] {
  return [...ticks].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });
}

/**
 * Filter ticks by date range
 */
export function filterTicksByDateRange(ticks: MarketTick[], startDate: Date, endDate: Date): MarketTick[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return ticks.filter((tick) => {
    const tickTime = new Date(tick.date).getTime();
    return tickTime >= startTime && tickTime <= endTime;
  });
}
