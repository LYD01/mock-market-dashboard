# Mock Market Dashboard (make with ai)

A real-time market data dashboard built with React, TypeScript, and Vite. The app displays stock and ETF market data with interactive charts, tables, and metrics.

## Features

- 📊 Real-time market data visualization
- 📈 Time series charts
- 📋 Detailed data tables
- 📉 Market metrics and statistics
- 🎨 Modern, responsive UI

## Data Sources

The app supports two data sources:

### Mock Data (Default)

By default, the app uses mock data from CSV files in the `src/mock` folder. This allows the app to work without any backend setup. The mock data is processed on the frontend and **simulates real-time updates** by replaying historical data progressively, so the dashboard appears to update in real-time just like the WebSocket version.

**No configuration needed** - the app defaults to mock data with simulated streaming.

### WebSocket Data

For real-time data streaming, you can switch to WebSocket mode. This requires setting up the local development server.

#### Switching to WebSocket Mode

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following line:
   ```
   VITE_DATA_SOURCE=websocket
   ```
3. Start the WebSocket server (see [Server Setup](#server-setup) below)
4. Restart the frontend dev server

#### Switching Back to Mock Data

To switch back to mock data, either:

- Remove the `VITE_DATA_SOURCE` environment variable, or
- Set it to `mock`:
  ```
  VITE_DATA_SOURCE=mock
  ```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App (Mock Data - Default)

Simply start the development server:

```bash
npm run dev
```

The app will run on `http://localhost:5173` (or the next available port) and use mock data from the `src/mock` folder.

### Running with WebSocket Data

If you want to use the WebSocket version with real-time data:

1. **Set up the environment variable:**
   Create a `.env` file in the project root:

   ```
   VITE_DATA_SOURCE=websocket
   VITE_WS_URL=ws://localhost:8080/ws
   ```

2. **Start the WebSocket server:**

   ```bash
   npm run server
   ```

   The server will run on `http://localhost:8080`

3. **Start the frontend:**

   ```bash
   npm run dev
   ```

4. The app will connect to the WebSocket server and display real-time data.

For more information about the server setup, see the [server README](./server/README.md).

## Project Structure

```
├── src/
│   ├── components/              # React components
│   │   ├── About/              # About page component
│   │   ├── BackToTop/          # Back to top button component
│   │   ├── DashboardHeader/    # Dashboard header component
│   │   ├── DataProcessingTimeline/  # Data processing timeline component
│   │   ├── DateRangeFilter/    # Date range filter component
│   │   ├── Footer/             # Footer component
│   │   ├── MerticsPanel.tsx/   # Metrics panel component
│   │   ├── Skeletons/          # Loading skeleton components
│   │   ├── TicksTable/         # Ticks table component
│   │   └── TimeSeriesView/     # Time series chart component
│   ├── hooks/                  # Custom React hooks
│   │   ├── useWebSocket.ts     # WebSocket data hook
│   │   └── useMockData.ts      # Mock data hook
│   ├── mock/                   # Mock data files
│   │   ├── stocks/             # Stock data files (.txt)
│   │   └── etfs/               # ETF data files (.txt)
│   ├── config/                 # Configuration files
│   │   └── dataSource.ts       # Data source switch
│   ├── utils/                  # Utility functions
│   │   ├── csvParser.ts        # CSV parsing utility
│   │   └── date.ts             # Date utility functions
│   ├── types/                  # TypeScript type definitions
│   │   └── market.ts           # Market data types
│   ├── styles/                 # Global SCSS styles
│   │   ├── abstracts/          # SCSS abstracts (variables, mixins, functions)
│   │   ├── base/               # Base styles (reset, typography, global)
│   │   ├── components/         # Component-specific styles
│   │   ├── layout/             # Layout styles
│   │   ├── themes/             # Theme styles (light/dark)
│   │   └── main.scss           # Main stylesheet entry
│   ├── App.tsx                 # Main App component
│   ├── App.css                 # App styles
│   ├── App.module.scss         # App module styles
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global CSS
│   └── vite-env.d.ts           # Vite type definitions
├── server/                     # WebSocket server (optional)
│   ├── src/
│   │   ├── bus/                # Event bus
│   │   │   └── eventBus.ts
│   │   ├── feed/               # Data feed processing
│   │   │   ├── normalize.ts    # Data normalization
│   │   │   ├── parseTxt.ts     # Text file parsing
│   │   │   └── replay.ts       # Data replay logic
│   │   ├── metrics/            # Metrics calculation
│   │   │   └── stats.ts        # Statistics utilities
│   │   ├── utils/              # Server utilities
│   │   │   └── logger.ts       # Logging utility
│   │   ├── ws/                 # WebSocket implementation
│   │   │   ├── protocol.ts     # WebSocket protocol
│   │   │   └── wsGateway.ts    # WebSocket gateway
│   │   ├── config.ts           # Server configuration
│   │   └── index.ts            # Server entry point
│   ├── bunfig.toml             # Bun configuration
│   └── README.md               # Server documentation
├── public/                     # Static assets
│   ├── favicon.webp            # Favicon
│   └── robots.txt              # Robots.txt
├── .husky/                     # Git hooks
│   └── pre-commit              # Pre-commit hook
├── eslint.config.js            # ESLint configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # TypeScript app config
├── tsconfig.node.json          # TypeScript node config
├── tsconfig.server.json        # TypeScript server config
├── vite.config.ts              # Vite configuration
├── package.json                # Dependencies and scripts
├── .prettierrc                 # Prettier configuration
├── .prettierignore             # Prettier ignore rules
├── .gitignore                  # Git ignore rules
├── bun.lock                    # Bun lock file
└── index.html                  # HTML entry point
```

## Configuration

### Data Source Configuration

The data source is configured in `src/config/dataSource.ts`. You can switch between:

- `'mock'` - Uses CSV files from `src/mock` folder (default)
- `'websocket'` - Uses WebSocket server for real-time data

The configuration reads from the `VITE_DATA_SOURCE` environment variable.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run server` - Start WebSocket server (requires Bun)

### Adding Mock Data

To add more mock data files:

1. Add CSV files to `src/mock/stocks/` or `src/mock/etfs/`
2. Update `src/hooks/useMockData.ts` to import the new files
3. The CSV format should be: `Date,Open,High,Low,Close,Volume,OpenInt`

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## License

MIT
