import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import type { MarketTick, MarketMetrics } from '../types/market';

// Compact tick format: [symbol, date, open, high, low, close, volume, openInt?]
type CompactTick = [string, string, number, number, number, number, number, number?];

// Compact metrics format
type CompactMetrics = [number, number, number, number, number, number, number, string];

/**
 * Expand compact tick to MarketTick
 */
function expandTick(compact: CompactTick): MarketTick {
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
 * Expand compact metrics to MarketMetrics
 */
function expandMetrics(compact: CompactMetrics): MarketMetrics {
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
 * Parse optimized WebSocket message
 */
type ParsedMessage =
  | { type: 'tick'; data: MarketTick | MarketTick[] }
  | { type: 'metrics'; data: MarketMetrics }
  | { type: 'snapshot'; data: MarketTick[] }
  | { type: 'error'; data: string };

function parseOptimizedMessage(data: string): ParsedMessage | null {
  try {
    const parsed = JSON.parse(data) as { t: string; d: unknown };
    if (!parsed.t || !('d' in parsed)) {
      return null;
    }

    switch (parsed.t) {
      case 't': {
        // Tick(s) - can be single or batched array
        const d = parsed.d;
        if (!Array.isArray(d) || d.length === 0) {
          return null;
        }

        // Check if first element is an array (batched) or primitive (single tick)
        if (Array.isArray(d[0])) {
          // Batched ticks: array of CompactTick arrays
          return { type: 'tick', data: (d as CompactTick[]).map(expandTick) };
        } else {
          // Single tick: single CompactTick array
          return { type: 'tick', data: expandTick(d as CompactTick) };
        }
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

export interface UseWebSocketReturn {
  ticks: MarketTick[];
  metrics: MarketMetrics | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  lastUpdate: Date | null;
}

const getWebSocketUrl = (): string => {
  const url = import.meta.env.VITE_WS_URL as string | undefined;
  if (typeof url === 'string' && url.length > 0) {
    return url;
  }
  return 'ws://localhost:8080/ws';
};

const WS_URL: string = getWebSocketUrl();

export function useWebSocket(enabled = true): UseWebSocketReturn {
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any existing connection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const wsUrl: string = WS_URL;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          // WebSocket message data can be string, Blob, or ArrayBuffer
          // We only handle string messages
          if (typeof event.data !== 'string') {
            console.warn('Received non-string WebSocket message');
            return;
          }

          const message = parseOptimizedMessage(event.data);
          if (!message) {
            console.warn('Failed to parse WebSocket message');
            return;
          }

          setLastUpdate(new Date());

          switch (message.type) {
            case 'tick': {
              const tickData = message.data;
              if (Array.isArray(tickData)) {
                // Batched ticks - add all to beginning
                setTicks((prev) => {
                  return [...tickData, ...prev].slice(0, 1000);
                });
              } else {
                // Single tick
                setTicks((prev) => {
                  return [tickData, ...prev].slice(0, 1000);
                });
              }
              break;
            }
            case 'metrics':
              setMetrics(message.data);
              break;
            case 'snapshot':
              setTicks(message.data);
              break;
            case 'error':
              setError(message.data);
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Failed to parse message');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect only if enabled
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectRef.current?.();
          }, delay);
        } else if (!enabled) {
          reconnectAttempts.current = 0;
        } else {
          setError('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.error('WebSocket connection error:', err);
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Store connect function in ref to avoid stale closure issues
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!enabled) {
      // If disabled, cleanup will handle disconnection
      return () => {
        // Cleanup: disconnect when disabled or component unmounts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        // State will be updated by onclose handler, avoid setState in cleanup
      };
    }

    // Connect when enabled - use startTransition to avoid synchronous setState
    startTransition(() => {
      connect();
    });

    return () => {
      // Cleanup: disconnect when enabled changes or component unmounts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // State will be updated by onclose handler, avoid setState in cleanup
    };
  }, [enabled, connect]);

  return {
    ticks,
    metrics,
    isConnected,
    error,
    connect,
    disconnect,
    lastUpdate,
  };
}
