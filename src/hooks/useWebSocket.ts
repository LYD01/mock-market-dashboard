import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import type { MarketTick, MarketMetrics, DataProcessingProgress } from '../types/market';

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
  progress: DataProcessingProgress;
}

const getWebSocketUrl = (): string => {
  const url = import.meta.env.VITE_WS_URL;
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
  const [progress, setProgress] = useState<DataProcessingProgress>({
    totalTicks: 0,
    processedTicks: 0,
    progressPercent: 0,
    dateRange: null,
    availableDates: [],
  });

  /**
   * Update progress information from ticks
   */
  const updateProgress = useCallback((newTicks: MarketTick[]) => {
    if (newTicks.length === 0) {
      setProgress({
        totalTicks: 0,
        processedTicks: 0,
        progressPercent: 0,
        dateRange: null,
        availableDates: [],
      });
      return;
    }

    const dates = new Set(newTicks.map((t) => t.date));
    const sortedDates = Array.from(dates).sort();
    const dateRange =
      sortedDates.length > 0 ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] } : null;

    setProgress({
      totalTicks: newTicks.length,
      processedTicks: newTicks.length,
      progressPercent: 100, // WebSocket is always "complete" as it streams
      dateRange,
      availableDates: sortedDates,
    });
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const isIntentionallyClosingRef = useRef(false);

  const connect = useCallback(() => {
    // Don't connect if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    // Don't create a new connection if one is already open or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
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
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          console.log('WebSocket connected');
        } else {
          // Component unmounted, close the connection
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        // Don't process messages if component is unmounted
        if (!isMountedRef.current) {
          return;
        }

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
                  const newTicks = [...tickData, ...prev].slice(0, 1000);
                  updateProgress(newTicks);
                  return newTicks;
                });
              } else {
                // Single tick
                setTicks((prev) => {
                  const newTicks = [tickData, ...prev].slice(0, 1000);
                  updateProgress(newTicks);
                  return newTicks;
                });
              }
              break;
            }
            case 'metrics':
              setMetrics(message.data);
              break;
            case 'snapshot': {
              const snapshotTicks = message.data;
              setTicks(snapshotTicks);
              updateProgress(snapshotTicks);
              break;
            }
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
        // Suppress errors that occur during intentional cleanup (e.g., StrictMode double-invoke)
        if (isIntentionallyClosingRef.current) {
          return;
        }
        // Only log errors, don't set state if unmounted
        if (isMountedRef.current) {
          console.error('WebSocket error:', event);
          setError('WebSocket connection error');
        }
      };

      ws.onclose = () => {
        // Reset intentional closing flag when connection closes
        isIntentionallyClosingRef.current = false;
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsConnected(false);
        }
        wsRef.current = null;

        // Attempt to reconnect only if enabled and component is still mounted
        if (isMountedRef.current && enabled && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              connectRef.current?.();
            }
          }, delay);
        } else if (!enabled) {
          reconnectAttempts.current = 0;
        } else if (isMountedRef.current && reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.error('WebSocket connection error:', err);
    }
  }, [enabled, updateProgress]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      const ws = wsRef.current;
      // Mark as intentionally closing to suppress expected errors
      isIntentionallyClosingRef.current = true;

      // Only close if OPEN - if CONNECTING, just remove reference to avoid browser warning
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.close();
        } catch (err) {
          console.debug('Error closing WebSocket:', err);
        }
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // Don't call close() during CONNECTING to avoid browser warning
        // Just remove reference - if it connects, onopen will close it if unmounted
        // If it fails, error handler will be suppressed
      }

      wsRef.current = null;
      // Reset flag after a brief delay to allow error event to be suppressed
      setTimeout(() => {
        isIntentionallyClosingRef.current = false;
      }, 0);
    }
    setIsConnected(false);
  }, []);

  // Store connect function in ref to avoid stale closure issues
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      // If disabled, cleanup will handle disconnection
      return () => {
        isMountedRef.current = false;
        // Cleanup: disconnect when disabled or component unmounts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
          const ws = wsRef.current;
          // Mark as intentionally closing to suppress expected errors
          isIntentionallyClosingRef.current = true;
          // Only close if OPEN - if CONNECTING, just remove reference to avoid browser warning
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.close();
            } catch (err) {
              console.debug('Error closing WebSocket during cleanup:', err);
            }
          } else if (ws.readyState === WebSocket.CONNECTING) {
            // Don't call close() during CONNECTING to avoid browser warning
            // Just remove reference - if it connects, onopen will close it if unmounted
            // If it fails, error handler will be suppressed
          }
          wsRef.current = null;
          // Reset flag after a brief delay to allow error event to be suppressed
          setTimeout(() => {
            isIntentionallyClosingRef.current = false;
          }, 0);
        }
        // State will be updated by onclose handler, avoid setState in cleanup
      };
    }

    // Connect when enabled - use startTransition to avoid synchronous setState
    startTransition(() => {
      if (isMountedRef.current) {
        connect();
      }
    });

    return () => {
      isMountedRef.current = false;
      // Cleanup: disconnect when enabled changes or component unmounts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        // Mark as intentionally closing to suppress expected errors
        isIntentionallyClosingRef.current = true;
        // Only close if OPEN - if CONNECTING, just remove reference to avoid browser warning
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.close();
          } catch (err) {
            console.debug('Error closing WebSocket during cleanup:', err);
          }
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // Don't call close() during CONNECTING to avoid browser warning
          // Just remove reference - if it connects, onopen will close it if unmounted
          // If it fails, error handler will be suppressed
        }
        wsRef.current = null;
        // Reset flag after a brief delay to allow error event to be suppressed
        setTimeout(() => {
          isIntentionallyClosingRef.current = false;
        }, 0);
      }
      // State will be updated by onclose handler, avoid setState in cleanup
    };
  }, [enabled, connect]);

  const returnValue: UseWebSocketReturn = {
    ticks,
    metrics,
    isConnected,
    error,
    connect,
    disconnect,
    lastUpdate,
    progress,
  };

  return returnValue;
}
