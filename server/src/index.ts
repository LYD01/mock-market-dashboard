/**
 * Main Server Entry Point
 * Orchestrates the event-driven market data server
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { WSGateway } from './ws/wsGateway.js';
import { DataReplay } from './feed/replay.js';
import { parseStockFile, getStockFiles } from './feed/parseTxt.js';
import { eventBus } from './bus/eventBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ServerConfig {
  port?: number;
  dataDirectory?: string;
  replaySpeed?: number;
  replayLoop?: boolean;
  symbols?: string[]; // If empty, load all symbols
}

class MarketDataServer {
  private wsGateway: WSGateway;
  private dataReplay: DataReplay;
  private config: Required<ServerConfig>;
  private isShuttingDown = false;

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: config.port ?? 8080,
      dataDirectory: config.dataDirectory ?? join(__dirname, '../data/stocks'),
      replaySpeed: config.replaySpeed ?? 1,
      replayLoop: config.replayLoop ?? true,
      symbols: config.symbols ?? [],
    };

    this.wsGateway = new WSGateway();
    this.dataReplay = new DataReplay();
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      console.log('Starting Market Data Server...');
      console.log(`Data directory: ${this.config.dataDirectory}`);
      console.log(`Port: ${this.config.port}`);

      // Start WebSocket server
      this.wsGateway.start(this.config.port);

      // Load and start data replay
      await this.loadAndStartReplay();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('Market Data Server started successfully');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Load stock data and start replay
   */
  private async loadAndStartReplay(): Promise<void> {
    try {
      const stockFiles = await getStockFiles(this.config.dataDirectory);

      if (stockFiles.length === 0) {
        throw new Error(`No stock files found in ${this.config.dataDirectory}`);
      }

      // Filter by symbols if specified
      const filesToLoad =
        this.config.symbols.length > 0
          ? stockFiles.filter((file) => this.config.symbols.includes(file.symbol))
          : stockFiles;

      if (filesToLoad.length === 0) {
        throw new Error(`No matching stock files found for symbols: ${this.config.symbols.join(', ')}`);
      }

      console.log(`Loading ${filesToLoad.length} stock file(s)...`);

      // Load first file (or you could load multiple and interleave)
      const fileToLoad = filesToLoad[0];
      console.log(`Loading ${fileToLoad.symbol} from ${fileToLoad.path}`);

      const rows = await parseStockFile(fileToLoad.path);
      console.log(`Loaded ${rows.length} data points for ${fileToLoad.symbol}`);

      // Load data into replay engine
      this.dataReplay.loadData(fileToLoad.symbol, rows);

      // Start replay
      this.dataReplay.start({
        speedMultiplier: this.config.replaySpeed,
        loop: this.config.replayLoop,
      });

      console.log(`Started replaying ${fileToLoad.symbol} at ${this.config.replaySpeed}x speed`);
    } catch (error) {
      console.error('Failed to load and start replay:', error);
      eventBus.emit('error', {
        message: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'LOAD_ERROR',
      });
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }
      this.isShuttingDown = true;

      console.log(`\nReceived ${signal}, shutting down gracefully...`);

      try {
        // Stop data replay
        this.dataReplay.stop();

        // Stop WebSocket server
        await this.wsGateway.stop();

        console.log('Server shut down successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    connections: number;
    replayStatus: ReturnType<DataReplay['getStatus']>;
  } {
    return {
      isRunning: !this.isShuttingDown,
      connections: this.wsGateway.getConnectionCount(),
      replayStatus: this.dataReplay.getStatus(),
    };
  }
}

// Start server when this module is executed directly
// Works with Bun, Node.js, and tsx
const isMainModule =
  // Bun sets import.meta.main
  (typeof import.meta.main !== 'undefined' && import.meta.main) ||
  // Fallback for Node.js/tsx
  (process.argv[1] &&
    (process.argv[1].includes('index.ts') ||
      process.argv[1].includes('index.js') ||
      import.meta.url === `file://${process.argv[1]}`));

if (isMainModule) {
  const server = new MarketDataServer({
    port: parseInt(process.env.PORT || '8080', 10),
    replaySpeed: parseFloat(process.env.REPLAY_SPEED || '1'),
    replayLoop: process.env.REPLAY_LOOP !== 'false',
    symbols: process.env.SYMBOLS ? process.env.SYMBOLS.split(',').map((s) => s.trim().toUpperCase()) : [],
  });

  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { MarketDataServer };
