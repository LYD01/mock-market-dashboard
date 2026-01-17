/**
 * WebSocket Gateway
 * Manages WebSocket connections and broadcasts events to clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import { eventBus } from '../bus/eventBus.js';
import {
  createTickMessage,
  createMetricsMessage,
  createSnapshotMessage,
  createErrorMessage,
  serializeMessage,
} from './protocol.js';
import { MetricsCalculator } from '../metrics/stats.js';
import type { MarketTick, MarketMetrics } from '../../../src/types/market.js';

export interface WSGatewayConfig {
  port?: number;
  path?: string;
}

export class WSGateway {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WebSocket>();
  private clientIdCounter = 0;
  private metricsCalculator: MetricsCalculator;
  private recentTicks: MarketTick[] = [];
  private readonly maxRecentTicks = 1000;

  constructor() {
    this.metricsCalculator = new MetricsCalculator();
  }

  /**
   * Start the WebSocket server
   */
  start(port: number = 8080): void {
    if (this.wss) {
      console.warn('WebSocket server already started');
      return;
    }

    this.wss = new WebSocketServer({ port, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Subscribe to event bus events
    this.subscribeToEvents();

    console.log(`WebSocket server started on ws://localhost:${port}/ws`);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = `client-${++this.clientIdCounter}`;
    this.clients.set(clientId, ws);

    console.log(`Client connected: ${clientId} (Total: ${this.clients.size})`);

    // Send initial snapshot if available
    if (this.recentTicks.length > 0) {
      const snapshot = createSnapshotMessage(
        this.recentTicks.slice(0, 100), // Send last 100 ticks
      );
      ws.send(serializeMessage(snapshot));
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        console.error(`Error parsing message from ${clientId}:`, error);
        ws.send(serializeMessage(createErrorMessage('Invalid message format')));
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`Client disconnected: ${clientId} (Total: ${this.clients.size})`);
      eventBus.emit('connection', { type: 'disconnected', clientId });
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });

    eventBus.emit('connection', { type: 'connected', clientId });
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(clientId: string, message: unknown): void {
    // Handle client requests (e.g., subscribe to specific symbols, request snapshot, etc.)
    if (typeof message === 'object' && message !== null && 'type' in message) {
      switch ((message as { type: string }).type) {
        case 'request_snapshot':
          this.sendSnapshot(clientId);
          break;
        case 'request_metrics':
          this.sendMetrics(clientId);
          break;
        default:
          console.warn(`Unknown message type from ${clientId}:`, message);
      }
    }
  }

  /**
   * Subscribe to event bus events
   */
  private subscribeToEvents(): void {
    // Subscribe to tick events
    eventBus.on('tick', (tick: MarketTick) => {
      this.handleTick(tick);
    });

    // Subscribe to metrics events
    eventBus.on('metrics', (metrics: MarketMetrics) => {
      this.broadcast(createMetricsMessage(metrics));
    });

    // Subscribe to error events
    eventBus.on('error', (error) => {
      this.broadcast(createErrorMessage(error.message));
    });
  }

  /**
   * Handle tick event
   */
  private handleTick(tick: MarketTick): void {
    // Add to recent ticks
    this.recentTicks = [tick, ...this.recentTicks].slice(0, this.maxRecentTicks);

    // Update metrics
    if (this.metricsCalculator) {
      const metrics = this.metricsCalculator.addTick(tick);
      eventBus.emit('metrics', metrics);
    }

    // Broadcast tick to all clients
    this.broadcast(createTickMessage(tick));
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: ReturnType<typeof createTickMessage>): void {
    const serialized = serializeMessage(message);
    const disconnectedClients: string[] = [];

    this.clients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(serialized);
        } catch (error) {
          console.error(`Error sending to ${clientId}:`, error);
          disconnectedClients.push(clientId);
        }
      } else {
        disconnectedClients.push(clientId);
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach((clientId) => {
      this.clients.delete(clientId);
    });
  }

  /**
   * Send snapshot to a specific client
   */
  private sendSnapshot(clientId: string): void {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const snapshot = createSnapshotMessage(this.recentTicks.slice(0, 100));
      ws.send(serializeMessage(snapshot));
    }
  }

  /**
   * Send metrics to a specific client
   */
  private sendMetrics(clientId: string): void {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (this.metricsCalculator) {
        const metrics = this.metricsCalculator.calculateMetrics();
        ws.send(serializeMessage(createMetricsMessage(metrics)));
      }
    }
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all client connections
      this.clients.forEach((ws) => {
        ws.close();
      });
      this.clients.clear();

      // Close server
      if (this.wss) {
        this.wss.close(() => {
          this.wss = null;
          console.log('WebSocket server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
