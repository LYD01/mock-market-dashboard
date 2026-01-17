/**
 * CSV Parser for stock data files
 * Parses CSV files with format: Date,Open,High,Low,Close,Volume,OpenInt
 */

import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface RawStockData {
  Date: string;
  Open: string;
  High: string;
  Low: string;
  Close: string;
  Volume: string;
  OpenInt: string;
}

export interface ParsedStockRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInt: number;
}

/**
 * Parse a stock data CSV file
 */
export async function parseStockFile(filePath: string): Promise<ParsedStockRow[]> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Skip header row
        if (context.header) {
          return value;
        }
        // Convert numeric columns
        if (context.column && ['Open', 'High', 'Low', 'Close', 'Volume', 'OpenInt'].includes(String(context.column))) {
          return parseFloat(String(value)) || 0;
        }
        return value;
      },
    }) as RawStockData[];

    // Transform to normalized format
    return records.map((row) => ({
      date: row.Date,
      open: parseFloat(row.Open) || 0,
      high: parseFloat(row.High) || 0,
      low: parseFloat(row.Low) || 0,
      close: parseFloat(row.Close) || 0,
      volume: parseInt(row.Volume, 10) || 0,
      openInt: parseInt(row.OpenInt, 10) || 0,
    }));
  } catch (error) {
    throw new Error(
      `Failed to parse stock file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Extract symbol from filename (e.g., "a.us.txt" -> "A")
 */
export function extractSymbolFromFilename(filename: string): string {
  // Remove .us.txt extension and convert to uppercase
  const symbol = filename.replace(/\.us\.txt$/i, '').toUpperCase();
  return symbol;
}

/**
 * Get all stock files from a directory
 */
export async function getStockFiles(directory: string): Promise<Array<{ symbol: string; path: string }>> {
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(directory);
  const stockFiles = files.filter((file) => file.endsWith('.us.txt'));

  return stockFiles.map((file) => ({
    symbol: extractSymbolFromFilename(file),
    path: join(directory, file),
  }));
}
