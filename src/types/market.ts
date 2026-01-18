// Market data types for WebSocket messages

export interface MarketTick {
  symbol: string;
  date: string; // ISO date string
  time?: string; // Optional time component
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInt?: number;
}

export interface MarketMetrics {
  totalTicks: number;
  totalVolume: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdate: string;
}

export interface WebSocketMessage {
  type: 'tick' | 'metrics' | 'snapshot' | 'error';
  data: MarketTick | MarketMetrics | MarketTick[] | { message: string };
  timestamp: string;
}

export type ViewMode = 'table' | 'timeseries' | 'metrics';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DataProcessingProgress {
  totalTicks: number;
  processedTicks: number;
  progressPercent: number;
  dateRange: { start: string; end: string } | null;
  availableDates: string[];
}
