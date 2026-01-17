/**
 * Server Configuration
 * Centralized configuration management
 */

export interface ServerConfig {
  port: number;
  dataDirectory: string;
  replaySpeed: number;
  replayLoop: boolean;
  symbols: string[];
  maxRecentTicks: number;
  metricsUpdateInterval: number;
}

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '8080', 10),
    dataDirectory: process.env.DATA_DIRECTORY || './data/stocks',
    replaySpeed: parseFloat(process.env.REPLAY_SPEED || '1'),
    replayLoop: process.env.REPLAY_LOOP !== 'false',
    symbols: process.env.SYMBOLS ? process.env.SYMBOLS.split(',').map((s) => s.trim().toUpperCase()) : [],
    maxRecentTicks: parseInt(process.env.MAX_RECENT_TICKS || '1000', 10),
    metricsUpdateInterval: parseInt(process.env.METRICS_UPDATE_INTERVAL || '1000', 10),
  };
}
