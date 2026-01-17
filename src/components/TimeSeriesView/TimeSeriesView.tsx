import { useMemo } from 'react';
import type { MarketTick, DateRange } from '../../types/market';
import { formatDateShort } from '../../utils/date';
import styles from './TimeSeriesView.module.scss';

interface TimeSeriesViewProps {
  ticks: MarketTick[];
  dateRange: DateRange | null;
}

export function TimeSeriesView({ ticks, dateRange }: TimeSeriesViewProps) {
  const filteredTicks = useMemo(() => {
    if (!dateRange) return ticks;
    return ticks.filter((tick) => {
      const tickDate = new Date(tick.date);
      return tickDate >= dateRange.start && tickDate <= dateRange.end;
    });
  }, [ticks, dateRange]);

  const displayTicks = useMemo(() => {
    // Limit to last 50 for performance
    return filteredTicks.slice(0, 50);
  }, [filteredTicks]);

  const maxPrice = useMemo(() => {
    if (displayTicks.length === 0) return 1;
    return Math.max(...displayTicks.map((t) => t.high));
  }, [displayTicks]);

  const minPrice = useMemo(() => {
    if (displayTicks.length === 0) return 0;
    return Math.min(...displayTicks.map((t) => t.low));
  }, [displayTicks]);

  const priceRange = maxPrice - minPrice || 1;

  const getPricePosition = (price: number) => {
    return ((price - minPrice) / priceRange) * 100;
  };

  if (displayTicks.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Time Series</h2>
        </div>
        <div className={styles.empty}>
          <p>No data available for the selected date range</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Time Series</h2>
        <span className={styles.count}>{displayTicks.length} ticks</span>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.yAxis}>
          <div className={styles.yLabel}>${maxPrice.toFixed(2)}</div>
          <div className={styles.yLabel}>${((maxPrice + minPrice) / 2).toFixed(2)}</div>
          <div className={styles.yLabel}>${minPrice.toFixed(2)}</div>
        </div>

        <div className={styles.chart}>
          <svg className={styles.svg} viewBox="0 0 1000 300" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} className={styles.gridLine} />
            ))}

            {/* Price line */}
            <polyline
              points={displayTicks
                .map(
                  (tick, i) =>
                    `${(i / (displayTicks.length - 1 || 1)) * 1000},${
                      300 - (getPricePosition(tick.close) / 100) * 300
                    }`,
                )
                .join(' ')}
              className={styles.priceLine}
              fill="none"
            />

            {/* High/Low range */}
            {displayTicks.map((tick, i) => {
              const x = (i / (displayTicks.length - 1 || 1)) * 1000;
              const highY = 300 - (getPricePosition(tick.high) / 100) * 300;
              const lowY = 300 - (getPricePosition(tick.low) / 100) * 300;
              return <line key={i} x1={x} y1={highY} x2={x} y2={lowY} className={styles.rangeLine} />;
            })}
          </svg>
        </div>
      </div>

      <div className={styles.ticksList}>
        {displayTicks.map((tick, index) => {
          const change = index > 0 ? tick.close - displayTicks[index - 1].close : 0;
          const changePercent =
            index > 0 && displayTicks[index - 1].close !== 0 ? (change / displayTicks[index - 1].close) * 100 : 0;

          return (
            <div key={`${tick.date}-${index}`} className={styles.tickItem}>
              <div className={styles.tickDate}>
                <div className={styles.date}>{formatDateShort(tick.date)}</div>
                {tick.time && <div className={styles.time}>{tick.time}</div>}
              </div>
              <div className={styles.tickPrices}>
                <div className={styles.priceGroup}>
                  <span className={styles.priceLabel}>O:</span>
                  <span className={styles.priceValue}>${tick.open.toFixed(2)}</span>
                </div>
                <div className={styles.priceGroup}>
                  <span className={styles.priceLabel}>H:</span>
                  <span className={`${styles.priceValue} ${styles.high}`}>${tick.high.toFixed(2)}</span>
                </div>
                <div className={styles.priceGroup}>
                  <span className={styles.priceLabel}>L:</span>
                  <span className={`${styles.priceValue} ${styles.low}`}>${tick.low.toFixed(2)}</span>
                </div>
                <div className={styles.priceGroup}>
                  <span className={styles.priceLabel}>C:</span>
                  <span className={`${styles.priceValue} ${change >= 0 ? styles.up : styles.down}`}>
                    ${tick.close.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className={styles.tickMeta}>
                <div className={styles.volume}>Vol: {tick.volume.toLocaleString()}</div>
                {index > 0 && (
                  <div className={`${styles.change} ${change >= 0 ? styles.up : styles.down}`}>
                    {change >= 0 ? '+' : ''}
                    {change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}
                    {changePercent.toFixed(2)}%)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
