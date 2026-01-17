/**
 * Central Event Bus for decoupled event-driven architecture
 * Provides type-safe event emission and subscription
 */

import { EventEmitter } from 'node:events';
import type { MarketTick, MarketMetrics } from '../../../src/types/market.js';

export interface EventMap {
  tick: MarketTick;
  metrics: MarketMetrics;
  error: { message: string; code?: string };
  replay: { status: 'started' | 'stopped' | 'paused' | 'resumed' };
  connection: { type: 'connected' | 'disconnected'; clientId: string };
}

export class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    // Increase max listeners for production use
    this.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit a typed event
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean {
    return super.emit(event, data);
  }

  /**
   * Subscribe to a typed event
   */
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Subscribe to a typed event once
   */
  once<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this {
    return super.once(event, listener);
  }

  /**
   * Unsubscribe from a typed event
   */
  off<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this {
    return super.off(event, listener);
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: keyof EventMap): this {
    return super.removeAllListeners(event);
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
