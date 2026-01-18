import { useMemo } from 'react';
import type { DataProcessingProgress } from '../../types/market';
import styles from './DataProcessingTimeline.module.scss';

interface DataProcessingTimelineProps {
  progress: DataProcessingProgress;
  dataSource: 'mock' | 'websocket';
}

/**
 * Generate timeline intervals by month and year
 */
function generateTimelineIntervals(
  startDate: string,
  endDate: string,
): Array<{ date: Date; label: string; position: number }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const intervals: Array<{ date: Date; label: string; position: number }> = [];

  const totalTime = end.getTime() - start.getTime();
  if (totalTime <= 0) return intervals;

  // Start from the first day of the start month
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const position = ((current.getTime() - start.getTime()) / totalTime) * 100;
    const label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    intervals.push({
      date: new Date(current),
      label,
      position: Math.max(0, Math.min(100, position)),
    });

    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }

  // Always add the end date
  if (intervals.length === 0 || intervals[intervals.length - 1].date < end) {
    intervals.push({
      date: end,
      label: end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      position: 100,
    });
  }

  return intervals;
}

export function DataProcessingTimeline({ progress, dataSource }: DataProcessingTimelineProps) {
  const timelineIntervals = useMemo(() => {
    if (!progress.dateRange) return [];
    return generateTimelineIntervals(progress.dateRange.start, progress.dateRange.end);
  }, [progress.dateRange]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className={styles.timeline}>
      <div className={styles.statsInline}>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>{dataSource === 'mock' ? 'Mock' : 'WS'}</span>
        </span>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>Ticks:</span>
          <span className={styles.statValue}>{formatNumber(progress.totalTicks)}</span>
        </span>
        {dataSource === 'mock' && (
          <span className={styles.statItem}>
            <span className={styles.statLabel}>Progress:</span>
            <span className={styles.statValue}>{progress.progressPercent.toFixed(1)}%</span>
          </span>
        )}
        {progress.dateRange && (
          <span className={styles.statItem}>
            <span className={styles.statLabel}>Range:</span>
            <span className={styles.statValue}>
              {formatDate(progress.dateRange.start)} → {formatDate(progress.dateRange.end)}
            </span>
          </span>
        )}
      </div>

      {progress.dateRange && timelineIntervals.length > 0 && (
        <div className={styles.timelineVisualization}>
          <div className={styles.timelineBar}>
            <div className={styles.timelineProgress} style={{ width: `${progress.progressPercent}%` }} />
            {timelineIntervals.map((interval, index) => (
              <div
                key={`${interval.date.getTime()}-${index}`}
                className={styles.timelineMarker}
                style={{ left: `${interval.position}%` }}
                title={interval.label}
              >
                <div className={styles.markerDot} />
                {index % 2 === 0 && <div className={styles.markerLabel}>{interval.label}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
