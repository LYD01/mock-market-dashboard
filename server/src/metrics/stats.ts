/**
 * Market Metrics Calculator
 * Calculates aggregate statistics from market ticks
 */

import type { MarketTick, MarketMetrics } from '../../../src/types/market.js';

export class MetricsCalculator {
  private ticks: MarketTick[] = [];
  private readonly maxTicks = 10000; // Keep last N ticks for metrics

  /**
   * Add a tick and update metrics
   */
  addTick(tick: MarketTick): MarketMetrics {
    // Add to beginning and keep last N ticks
    this.ticks = [tick, ...this.ticks].slice(0, this.maxTicks);

    return this.calculateMetrics();
  }

  /**
   * Calculate metrics from current ticks
   */
  calculateMetrics(): MarketMetrics {
    if (this.ticks.length === 0) {
      return this.getEmptyMetrics();
    }

    const prices = this.ticks.map((t) => t.close);
    const volumes = this.ticks.map((t) => t.volume);

    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);

    // Calculate price change from first to last tick
    const firstPrice = this.ticks[this.ticks.length - 1]?.close ?? 0;
    const lastPrice = this.ticks[0]?.close ?? 0;
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

    return {
      totalTicks: this.ticks.length,
      totalVolume,
      averagePrice: Math.round(averagePrice * 100) / 100,
      highestPrice: Math.round(highestPrice * 100) / 100,
      lowestPrice: Math.round(lowestPrice * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(): MarketMetrics {
    return {
      totalTicks: 0,
      totalVolume: 0,
      averagePrice: 0,
      highestPrice: 0,
      lowestPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Reset all ticks
   */
  reset(): void {
    this.ticks = [];
  }

  /**
   * Get current ticks
   */
  getTicks(): MarketTick[] {
    return [...this.ticks];
  }
}
