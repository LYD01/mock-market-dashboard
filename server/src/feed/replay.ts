/**
 * Data Replay Engine
 * Replays historical stock data at configurable speed
 */

import { eventBus } from '../bus/eventBus.js';
import type { MarketTick } from '../../../src/types/market.js';
import type { ParsedStockRow } from './parseTxt.js';
import { normalizeToMarketTicks, sortTicksByDate } from './normalize.js';

export interface ReplayConfig {
  speedMultiplier?: number; // 1 = real-time, 2 = 2x speed, 0.5 = half speed
  startDate?: Date;
  endDate?: Date;
  loop?: boolean; // Loop back to start when finished
}

export class DataReplay {
  private ticks: MarketTick[] = [];
  private currentIndex = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private isPaused = false;
  private speedMultiplier = 1;
  private loop = false;
  private baseInterval = 1000; // 1 second per tick in real-time

  /**
   * Load data for replay
   */
  loadData(symbol: string, rows: ParsedStockRow[]): void {
    this.ticks = sortTicksByDate(normalizeToMarketTicks(symbol, rows));
    this.currentIndex = 0;
    this.stop();
  }

  /**
   * Start replaying data
   */
  start(config: ReplayConfig = {}): void {
    if (this.ticks.length === 0) {
      eventBus.emit('error', {
        message: 'No data loaded for replay',
        code: 'NO_DATA',
      });
      return;
    }

    if (this.isPlaying && !this.isPaused) {
      return; // Already playing
    }

    this.speedMultiplier = config.speedMultiplier ?? 1;
    this.loop = config.loop ?? false;

    // Apply date filtering if provided
    let filteredTicks = this.ticks;
    if (config.startDate || config.endDate) {
      const start = config.startDate ?? new Date(0);
      const end = config.endDate ?? new Date();
      filteredTicks = this.ticks.filter((tick) => {
        const tickDate = new Date(tick.date).getTime();
        return tickDate >= start.getTime() && tickDate <= end.getTime();
      });
    }

    if (filteredTicks.length === 0) {
      eventBus.emit('error', {
        message: 'No data in specified date range',
        code: 'NO_DATA_IN_RANGE',
      });
      return;
    }

    this.ticks = filteredTicks;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;

    eventBus.emit('replay', { status: 'started' });

    // Calculate interval based on speed multiplier
    const interval = this.baseInterval / this.speedMultiplier;

    this.intervalId = setInterval(() => {
      this.playNextTick();
    }, interval);
  }

  /**
   * Play the next tick
   */
  private playNextTick(): void {
    if (this.currentIndex >= this.ticks.length) {
      if (this.loop) {
        this.currentIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    const tick = this.ticks[this.currentIndex];
    eventBus.emit('tick', tick);
    this.currentIndex++;
  }

  /**
   * Pause replay
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPaused = true;
    eventBus.emit('replay', { status: 'paused' });
  }

  /**
   * Resume replay
   */
  resume(): void {
    if (!this.isPlaying || !this.isPaused) {
      return;
    }

    const interval = this.baseInterval / this.speedMultiplier;
    this.intervalId = setInterval(() => {
      this.playNextTick();
    }, interval);
    this.isPaused = false;
    eventBus.emit('replay', { status: 'resumed' });
  }

  /**
   * Stop replay
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    eventBus.emit('replay', { status: 'stopped' });
  }

  /**
   * Get current status
   */
  getStatus(): {
    isPlaying: boolean;
    isPaused: boolean;
    currentIndex: number;
    totalTicks: number;
    progress: number;
  } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalTicks: this.ticks.length,
      progress: this.ticks.length > 0 ? this.currentIndex / this.ticks.length : 0,
    };
  }

  /**
   * Get all loaded ticks
   */
  getAllTicks(): MarketTick[] {
    return [...this.ticks];
  }

  /**
   * Jump to a specific index
   */
  seekTo(index: number): void {
    if (index >= 0 && index < this.ticks.length) {
      this.currentIndex = index;
    }
  }
}
