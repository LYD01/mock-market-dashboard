import { useState, useMemo } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useMockData } from './hooks/useMockData';
import { DATA_SOURCE } from './config/dataSource';
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader';
import { About } from './components/About/About';
import { MetricsPanel } from './components/MerticsPanel.tsx/MetricsPanel';
import { TimeSeriesView } from './components/TimeSeriesView/TimeSeriesView';
import { TicksTable } from './components/TicksTable/TicksTable';
import { DateRangeFilter } from './components/DateRangeFilter/DateRangeFilter';
import { DataProcessingTimeline } from './components/DataProcessingTimeline/DataProcessingTimeline';
import { MetricsPanelSkeleton } from './components/Skeletons/MetricsPanelSkeleton';
import { TimeSeriesViewSkeleton } from './components/Skeletons/TimeSeriesViewSkeleton';
import { TicksTableSkeleton } from './components/Skeletons/TicksTableSkeleton';
import { BackToTop } from './components/BackToTop/BackToTop';
import { Footer } from './components/Footer/Footer';
import type { DateRange } from './types/market';
import styles from './App.module.scss';

function App() {
  // Use mock data by default, or websocket if configured
  const mockData = useMockData(DATA_SOURCE === 'mock');
  const wsData = useWebSocket(DATA_SOURCE === 'websocket');

  // Select the active data source
  const { ticks, isConnected, error, connect, lastUpdate, progress } = DATA_SOURCE === 'mock' ? mockData : wsData;

  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'about'>('dashboard');

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
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <main className={styles.main}>
        {currentView === 'about' ? (
          <About />
        ) : (
          <div className={styles.unifiedView}>
            {/* Date Range Filter - On top */}
            <div className={styles.metricsSection}>
              <div className={styles.metricsHeader}>
                {!isLoading && <DateRangeFilter onRangeChange={setDateRange} availableDates={availableDates} />}
              </div>
              {/* Data Processing Timeline - Slim and minimal */}
              <DataProcessingTimeline progress={progress} dataSource={DATA_SOURCE} />
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
          </div>
        )}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

export default App;
