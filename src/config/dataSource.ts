/**
 * Data Source Configuration
 *
 * Switch between mock data (CSV files) and WebSocket data.
 * Set to 'mock' to use CSV files from src/mock folder.
 * Set to 'websocket' to use the WebSocket server.
 */
export type DataSource = 'mock' | 'websocket';

/**
 * Get the current data source from environment variable or default to 'mock'
 *
 * To use WebSocket, set VITE_DATA_SOURCE=websocket in your .env file
 * To use mock data (default), set VITE_DATA_SOURCE=mock or leave unset
 */
export function getDataSource(): DataSource {
  const source = import.meta.env.VITE_DATA_SOURCE as string | undefined;
  if (source === 'websocket') {
    return 'websocket';
  }
  // Default to mock data
  return 'mock';
}

/**
 * Current data source
 */
export const DATA_SOURCE: DataSource = getDataSource();
