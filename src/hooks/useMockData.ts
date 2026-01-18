import { useEffect, useState, useRef } from 'react';
import type { MarketTick, MarketMetrics, DataProcessingProgress } from '../types/market';
import { parseCSV } from '../utils/csvParser';

// Import mock data files using Vite's ?raw suffix
import stockA from '../mock/stocks/a.us.txt?raw';
import etfAadr from '../mock/etfs/aadr.us.txt?raw';

export interface UseMockDataReturn {
  ticks: MarketTick[];
  metrics: MarketMetrics | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  lastUpdate: Date | null;
  progress: DataProcessingProgress;
}

/**
 * Calculate metrics from ticks (same logic as MetricsPanel)
 */
function calculateMetrics(ticks: MarketTick[]): MarketMetrics | null {
  if (ticks.length === 0) {
    return null;
  }

  const prices = ticks.map((t) => t.close);
  const volumes = ticks.map((t) => t.volume);
  const latest = ticks[0];
  const oldest = ticks[ticks.length - 1];

  const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const priceChange = latest.close - oldest.close;
  const priceChangePercent = oldest.close !== 0 ? (priceChange / oldest.close) * 100 : 0;

  return {
    totalTicks: ticks.length,
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
 * Configuration for mock data replay
 * Optimized for smooth, professional stock market graph updates
 */
const REPLAY_CONFIG = {
  // Interval between tick batches in milliseconds
  // 800ms = ~1.25 ticks per second for smooth, professional feel
  tickInterval: 800,
  // Batch size - send 1-2 ticks at once for smooth updates
  batchSize: 1,
  // Maximum ticks to keep in memory (same as WebSocket version)
  maxTicks: 1000,
  // Throttle UI updates to max once per frame (60fps = ~16ms)
  // This prevents excessive re-renders while maintaining smoothness
  updateThrottle: 16,
};

/**
 * Hook to load and use mock data from CSV files in src/mock folder
 * Simulates real-time updates by replaying historical data progressively
 */
export function useMockData(enabled = true): UseMockDataReturn {
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

  // Store replay state in refs to avoid stale closures
  const replayIndexRef = useRef(0);
  const replayTicksRef = useRef<MarketTick[]>([]);
  const intervalRef = useRef<number | null>(null);
  const isReplayingRef = useRef(false);
  const pendingTicksRef = useRef<MarketTick[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Throttled update function using requestAnimationFrame
  const updateTicks = () => {
    if (pendingTicksRef.current.length === 0) {
      rafRef.current = null;
      return;
    }

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Throttle updates to prevent excessive re-renders
    if (timeSinceLastUpdate >= REPLAY_CONFIG.updateThrottle) {
      const ticksToAdd = [...pendingTicksRef.current];
      pendingTicksRef.current = [];

      setTicks((prev) => {
        const newTicks = [...ticksToAdd, ...prev];
        // Keep only the latest maxTicks
        return newTicks.slice(0, REPLAY_CONFIG.maxTicks);
      });

      setLastUpdate(new Date());
      lastUpdateTimeRef.current = now;
      rafRef.current = null;
    } else {
      // Schedule next frame if throttled
      rafRef.current = requestAnimationFrame(updateTicks);
    }
  };

  const scheduleUpdate = (ticksToAdd: MarketTick[]) => {
    // Add to pending queue
    pendingTicksRef.current.push(...ticksToAdd);

    // Schedule update if not already scheduled
    rafRef.current ??= requestAnimationFrame(updateTicks);
  };

  const startReplay = () => {
    if (isReplayingRef.current || replayTicksRef.current.length === 0) {
      return;
    }

    isReplayingRef.current = true;
    replayIndexRef.current = 0;
    pendingTicksRef.current = [];
    lastUpdateTimeRef.current = performance.now();

    // Start with empty ticks and begin streaming
    setTicks([]);
    setIsConnected(true);
    setError(null);

    const addTicks = () => {
      const remainingTicks = replayTicksRef.current.length - replayIndexRef.current;
      if (remainingTicks === 0) {
        // Reached end of data, loop back to start
        replayIndexRef.current = 0;
        return;
      }

      // Get batch of ticks to add
      const batchSize = Math.min(REPLAY_CONFIG.batchSize, remainingTicks);
      const ticksToAdd: MarketTick[] = [];

      for (let i = 0; i < batchSize; i++) {
        const index = replayIndexRef.current + i;
        if (index < replayTicksRef.current.length) {
          ticksToAdd.push(replayTicksRef.current[index]);
        }
      }

      // Schedule smooth update (newest first, like WebSocket)
      // Since we're iterating oldest to newest, we reverse the batch so newest goes first
      scheduleUpdate(ticksToAdd.reverse());

      replayIndexRef.current += batchSize;

      // Update progress based on actual processing
      const totalTicks = replayTicksRef.current.length;
      const processedTicks = Math.min(replayIndexRef.current, totalTicks);
      const progressPercent = totalTicks > 0 ? (processedTicks / totalTicks) * 100 : 0;

      // Calculate date range from all processed ticks so far
      const processedTicksArray = replayTicksRef.current.slice(0, processedTicks);
      const dates = new Set(processedTicksArray.map((t) => t.date));
      const sortedDates = Array.from(dates).sort();
      const dateRange =
        sortedDates.length > 0 ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] } : null;

      setProgress({
        totalTicks,
        processedTicks,
        progressPercent,
        dateRange,
        availableDates: sortedDates,
      });
    };

    // Add first batch immediately
    addTicks();

    // Then continue at intervals for smooth, professional updates
    intervalRef.current = window.setInterval(addTicks, REPLAY_CONFIG.tickInterval);
  };

  const stopReplay = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isReplayingRef.current = false;
    pendingTicksRef.current = [];
  };

  const loadMockData = () => {
    try {
      setError(null);
      setIsConnected(false);
      stopReplay();

      // Load all CSV files from mock folders
      const allTicks: MarketTick[] = [];

      // Load stocks
      try {
        const parsedTicks = parseCSV(stockA, 'a.us');
        allTicks.push(...parsedTicks);
      } catch (err) {
        console.warn('Failed to load stock data:', err);
      }

      // Load ETFs
      try {
        const parsedTicks = parseCSV(etfAadr, 'aadr.us');
        allTicks.push(...parsedTicks);
      } catch (err) {
        console.warn('Failed to load ETF data:', err);
      }

      if (allTicks.length === 0) {
        throw new Error('No mock data files found');
      }

      // Sort all ticks by date ascending (oldest first) for replay
      // We'll add them in reverse order (newest first) to match WebSocket behavior
      const sortedTicks = allTicks.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Store ticks for replay
      replayTicksRef.current = sortedTicks;

      // Initialize progress
      const allDates = new Set(sortedTicks.map((t) => t.date));
      const sortedAllDates = Array.from(allDates).sort();
      const fullDateRange =
        sortedAllDates.length > 0 ? { start: sortedAllDates[0], end: sortedAllDates[sortedAllDates.length - 1] } : null;

      setProgress({
        totalTicks: sortedTicks.length,
        processedTicks: 0,
        progressPercent: 0,
        dateRange: fullDateRange,
        availableDates: [],
      });

      // Start replaying
      startReplay();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load mock data';
      setError(errorMessage);
      setIsConnected(false);
      console.error('Error loading mock data:', err);
    }
  };

  const connect = () => {
    loadMockData();
  };

  const disconnect = () => {
    stopReplay();
    setTicks([]);
    setMetrics(null);
    setIsConnected(false);
    setError(null);
    setLastUpdate(null);
    replayIndexRef.current = 0;
    replayTicksRef.current = [];
  };

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    loadMockData();

    // Cleanup on unmount or when enabled changes
    return () => {
      stopReplay();
    };
  }, [enabled]);

  // Recalculate metrics when ticks change
  useEffect(() => {
    if (ticks.length > 0) {
      setMetrics(calculateMetrics(ticks));
    } else {
      setMetrics(null);
    }
  }, [ticks]);

  const returnValue: UseMockDataReturn = {
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
