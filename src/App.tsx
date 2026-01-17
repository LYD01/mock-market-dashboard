import { useState, useMemo } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader';
import { MetricsPanel } from './components/MerticsPanel.tsx/MetricsPanel';
import { TimeSeriesView } from './components/TimeSeriesView/TimeSeriesView';
import { TicksTable } from './components/TicksTable/TicksTable';
import { DateRangeFilter } from './components/DateRangeFilter/DateRangeFilter';
import { MetricsPanelSkeleton } from './components/Skeletons/MetricsPanelSkeleton';
import { TimeSeriesViewSkeleton } from './components/Skeletons/TimeSeriesViewSkeleton';
import { TicksTableSkeleton } from './components/Skeletons/TicksTableSkeleton';
import type { DateRange } from './types/market';
import styles from './App.module.scss';

function App() {
  const [connectionEnabled, setConnectionEnabled] = useState<boolean>(true);
  const { ticks, isConnected, error, connect, lastUpdate } = useWebSocket(connectionEnabled);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const availableDates = useMemo(() => {
    const dates = new Set(ticks.map((tick) => tick.date));
    return Array.from(dates).sort();
  }, [ticks]);

  const isLoading = !isConnected;

  return (
    <div className={styles.dashboard}>
      <DashboardHeader
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        error={error}
        onReconnect={connect}
        connectionEnabled={connectionEnabled}
        onConnectionToggle={setConnectionEnabled}
      />

      <main className={styles.main}>
        <div className={styles.unifiedView}>
          {/* Metrics Panel - Compact at top */}
          <div className={styles.metricsSection}>
            <div className={styles.metricsHeader}>
              {!isLoading && <DateRangeFilter onRangeChange={setDateRange} availableDates={availableDates} />}
            </div>
            {isLoading ? <MetricsPanelSkeleton /> : <MetricsPanel ticks={ticks} lastUpdate={lastUpdate} />}
          </div>

          {/* Time Series View - Front and center */}
          <div className={styles.timeseriesSection}>
            {isLoading ? <TimeSeriesViewSkeleton /> : <TimeSeriesView ticks={ticks} dateRange={dateRange} />}
          </div>

          {/* Table View - Below, scrollable */}
          <div className={styles.tableSection}>
            {isLoading ? <TicksTableSkeleton /> : <TicksTable ticks={ticks} dateRange={dateRange} />}
          </div>

          {/* Placeholder text section */}
          <div className={styles.aboutSection}>
            <h2 className={styles.aboutTitle}>About This Project</h2>
            <p className={styles.aboutPlaceholder}>[Placeholder text - to be updated with project description]</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
