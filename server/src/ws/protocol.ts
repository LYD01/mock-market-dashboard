/**
 * WebSocket Protocol
 * Defines message types and serialization for WebSocket communication
 */

import type { MarketTick, MarketMetrics, WebSocketMessage } from '../../../src/types/market.js';

/**
 * Create a WebSocket message
 */
export function createMessage(type: WebSocketMessage['type'], data: WebSocketMessage['data']): WebSocketMessage {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a tick message
 */
export function createTickMessage(tick: MarketTick): WebSocketMessage {
  return createMessage('tick', tick);
}

/**
 * Create a metrics message
 */
export function createMetricsMessage(metrics: MarketMetrics): WebSocketMessage {
  return createMessage('metrics', metrics);
}

/**
 * Create a snapshot message (array of ticks)
 */
export function createSnapshotMessage(ticks: MarketTick[]): WebSocketMessage {
  return createMessage('snapshot', ticks);
}

/**
 * Create an error message
 */
export function createErrorMessage(message: string): WebSocketMessage {
  return createMessage('error', { message });
}

/**
 * Serialize message to JSON string
 */
export function serializeMessage(message: WebSocketMessage): string {
  return JSON.stringify(message);
}

/**
 * Parse message from JSON string
 */
export function parseMessage(data: string): WebSocketMessage | null {
  try {
    const parsed = JSON.parse(data) as WebSocketMessage;
    // Validate message structure
    if (parsed.type && ['tick', 'metrics', 'snapshot', 'error'].includes(parsed.type) && parsed.data !== undefined) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
