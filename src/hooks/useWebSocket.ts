import { useEffect, useRef, useState, useCallback } from 'react';
import type { MarketTick, MarketMetrics, WebSocketMessage } from '../types/market';

export interface UseWebSocketReturn {
  ticks: MarketTick[];
  metrics: MarketMetrics | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  lastUpdate: Date | null;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export function useWebSocket(enabled: boolean = true): UseWebSocketReturn {
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

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
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastUpdate(new Date());

          switch (message.type) {
            case 'tick':
              setTicks((prev) => {
                const newTick = message.data as MarketTick;
                // Add to beginning and keep last 1000 ticks
                return [newTick, ...prev].slice(0, 1000);
              });
              break;
            case 'metrics':
              setMetrics(message.data as MarketMetrics);
              break;
            case 'snapshot':
              const snapshot = message.data as MarketTick[];
              setTicks(snapshot);
              break;
            case 'error':
              setError((message.data as { message: string }).message);
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
            connect();
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

  useEffect(() => {
    if (!enabled) {
      // If disabled, disconnect and clear any pending connections
      disconnect();
      return;
    }

    // Disconnect first if already connected
    disconnect();
    // Then connect
    connect();

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

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
