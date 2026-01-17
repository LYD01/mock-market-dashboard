import { useMemo } from 'react';
import type { MarketTick } from '../../types/market';
import { formatTime } from '../../utils/date';
import styles from './MetricsPanel.module.scss';

interface MetricsPanelProps {
  ticks: MarketTick[];
  lastUpdate: Date | null;
}

export function MetricsPanel({ ticks, lastUpdate }: MetricsPanelProps) {
  const metrics = useMemo(() => {
    if (ticks.length === 0) {
      return {
        totalTicks: 0,
        totalVolume: 0,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
      };
    }

    const prices = ticks.map((t) => t.close);
    const volumes = ticks.map((t) => t.volume);
    const latest = ticks[0];
    const oldest = ticks[ticks.length - 1];

    const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const priceChange = latest.close - oldest.close;
    const priceChangePercent = oldest.close !== 0 ? (priceChange / oldest.close) * 100 : 0;

    return {
      totalTicks: ticks.length,
      totalVolume,
      averagePrice,
      highestPrice,
      lowestPrice,
      priceChange,
      priceChangePercent,
    };
  }, [ticks]);

  const getPriceClass = (change: number) => {
    if (change > 0) return styles.priceUp;
    if (change < 0) return styles.priceDown;
    return styles.priceNeutral;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Market Metrics</h2>
        {lastUpdate && <span className={styles.timestamp}>{formatTime(lastUpdate)}</span>}
      </div>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.label}>Total Ticks</div>
          <div className={styles.value}>{metrics.totalTicks.toLocaleString()}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.label}>Total Volume</div>
          <div className={styles.value}>
            {metrics.totalVolume.toLocaleString(undefined, {
              notation: 'compact',
              maximumFractionDigits: 1,
            })}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.label}>Average Price</div>
          <div className={styles.value}>${metrics.averagePrice.toFixed(2)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.label}>Highest Price</div>
          <div className={`${styles.value} ${styles.highlight}`}>${metrics.highestPrice.toFixed(2)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.label}>Lowest Price</div>
          <div className={`${styles.value} ${styles.lowlight}`}>${metrics.lowestPrice.toFixed(2)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.label}>Price Change</div>
          <div className={`${styles.value} ${getPriceClass(metrics.priceChange)}`}>
            {metrics.priceChange >= 0 ? '+' : ''}${metrics.priceChange.toFixed(2)}
          </div>
          <div className={`${styles.change} ${getPriceClass(metrics.priceChange)}`}>
            {metrics.priceChangePercent >= 0 ? '+' : ''}
            {metrics.priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
