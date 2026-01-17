# Market Data Server

Production-level event-driven WebSocket server for streaming stock and ETF market data.

## Architecture

The server uses an event-driven architecture with the following components:

- **Event Bus**: Central event emitter for decoupled communication
- **Data Parser**: Parses CSV stock data files
- **Data Normalizer**: Converts parsed data to MarketTick format
- **Data Replay**: Replays historical data at configurable speed
- **Metrics Calculator**: Calculates aggregate market statistics
- **WebSocket Gateway**: Manages WebSocket connections and broadcasts events

## Features

- Real-time WebSocket streaming of market data
- Configurable replay speed (1x, 2x, 0.5x, etc.)
- Automatic metrics calculation
- Graceful shutdown handling
- Connection management
- Error handling and logging

## Usage

### Prerequisites

This server uses [Bun](https://bun.sh) as the runtime. Install Bun if you haven't already:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Start Server

```bash
# Development (with watch mode)
bun run server

# Production
bun run server:prod

# Or run directly with Bun
bun server/src/index.ts
```

### Environment Variables

- `PORT`: WebSocket server port (default: 8080)
- `DATA_DIRECTORY`: Path to stock data directory (default: ./data/stocks)
- `REPLAY_SPEED`: Replay speed multiplier (default: 1)
- `REPLAY_LOOP`: Whether to loop replay (default: true)
- `SYMBOLS`: Comma-separated list of symbols to load (default: all)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARN, ERROR)

### Example

```bash
PORT=8080 REPLAY_SPEED=2 SYMBOLS=AAPL,MSFT bun run server
```

## WebSocket Protocol

The server sends JSON messages with the following structure:

```typescript
{
  type: 'tick' | 'metrics' | 'snapshot' | 'error',
  data: MarketTick | MarketMetrics | MarketTick[] | { message: string },
  timestamp: string
}
```

### Message Types

- **tick**: Individual market tick update
- **metrics**: Aggregate market metrics
- **snapshot**: Initial snapshot of recent ticks
- **error**: Error message

### Client Messages

Clients can send:

```json
{
  "type": "request_snapshot"
}
```

```json
{
  "type": "request_metrics"
}
```

## Data Format

Stock data files should be CSV format:

```
Date,Open,High,Low,Close,Volume,OpenInt
1999-11-18,30.713,33.754,27.002,29.702,66277506,0
```

Files should be named as `{SYMBOL}.us.txt` (e.g., `AAPL.us.txt`).
