import { useState, useMemo } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader';
import { MetricsPanel } from './components/MerticsPanel.tsx/MetricsPanel';
import { TimeSeriesView } from './components/TimeSeriesView/TimeSeriesView';
import { TicksTable } from './components/TicksTable/TicksTable';
import { DateRangeFilter } from './components/DateRangeFilter/DateRangeFilter';
import type { DateRange } from './types/market';
import styles from './App.module.scss';

function App() {
  const { ticks, isConnected, error, connect, lastUpdate } = useWebSocket();
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'timeseries' | 'metrics'>('timeseries');

  const availableDates = useMemo(() => {
    const dates = new Set(ticks.map((tick) => tick.date));
    return Array.from(dates).sort();
  }, [ticks]);

  return (
    <div className={styles.dashboard}>
      <DashboardHeader isConnected={isConnected} lastUpdate={lastUpdate} error={error} onReconnect={connect} />

      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${viewMode === 'metrics' ? styles.active : ''}`}
              onClick={() => setViewMode('metrics')}
            >
              Metrics
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'timeseries' ? styles.active : ''}`}
              onClick={() => setViewMode('timeseries')}
            >
              Time Series
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
          </div>

          <DateRangeFilter onRangeChange={setDateRange} availableDates={availableDates} />
        </div>

        <div className={styles.content}>
          {viewMode === 'metrics' && <MetricsPanel ticks={ticks} lastUpdate={lastUpdate} />}

          {viewMode === 'timeseries' && <TimeSeriesView ticks={ticks} dateRange={dateRange} />}

          {viewMode === 'table' && <TicksTable ticks={ticks} dateRange={dateRange} />}
        </div>
      </main>
    </div>
  );
}

export default App;
