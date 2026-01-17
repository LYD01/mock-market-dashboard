import { useState, useMemo } from 'react';
import type { MarketTick, DateRange } from '../../types/market';
import { formatDateShort } from '../../utils/date';
import styles from './TicksTable.module.scss';

interface TicksTableProps {
  ticks: MarketTick[];
  dateRange: DateRange | null;
}

type SortField = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume';
type SortDirection = 'asc' | 'desc';

export function TicksTable({ ticks, dateRange }: TicksTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredTicks = useMemo(() => {
    let filtered = ticks;

    if (dateRange) {
      filtered = filtered.filter((tick) => {
        const tickDate = new Date(tick.date);
        return tickDate >= dateRange.start && tickDate <= dateRange.end;
      });
    }

    return filtered;
  }, [ticks, dateRange]);

  const sortedTicks = useMemo(() => {
    const sorted = [...filteredTicks].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'date':
          aValue = a.date;
          bValue = b.date;
          break;
        case 'open':
        case 'high':
        case 'low':
        case 'close':
        case 'volume':
          aValue = a[sortField];
          bValue = b[sortField];
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [filteredTicks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getPriceChange = (tick: MarketTick, index: number) => {
    if (index === sortedTicks.length - 1) return null;
    const prevTick = sortedTicks[index + 1];
    const change = tick.close - prevTick.close;
    const changePercent = prevTick.close !== 0 ? (change / prevTick.close) * 100 : 0;
    return { change, changePercent };
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Market Ticks</h2>
        <span className={styles.count}>{sortedTicks.length} records</span>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('date')}>
                Date {getSortIcon('date')}
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('open')}>
                Open {getSortIcon('open')}
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('high')}>
                High {getSortIcon('high')}
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('low')}>
                Low {getSortIcon('low')}
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('close')}>
                Close {getSortIcon('close')}
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort('volume')}>
                Volume {getSortIcon('volume')}
              </th>
              <th className={styles.th}>Change</th>
            </tr>
          </thead>
          <tbody>
            {sortedTicks.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No data available
                </td>
              </tr>
            ) : (
              sortedTicks.map((tick, index) => {
                const priceChange = getPriceChange(tick, index);
                return (
                  <tr key={`${tick.date}-${index}`} className={styles.row}>
                    <td className={styles.td}>
                      <div className={styles.dateCell}>
                        <div>{formatDateShort(tick.date)}</div>
                        {tick.time && <div className={styles.time}>{tick.time}</div>}
                      </div>
                    </td>
                    <td className={styles.td}>${tick.open.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.high}`}>${tick.high.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.low}`}>${tick.low.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.close}`}>${tick.close.toFixed(2)}</td>
                    <td className={styles.td}>{tick.volume.toLocaleString()}</td>
                    <td className={styles.td}>
                      {priceChange ? (
                        <div className={`${styles.change} ${priceChange.change >= 0 ? styles.up : styles.down}`}>
                          {priceChange.change >= 0 ? '+' : ''}
                          {priceChange.change.toFixed(2)} ({priceChange.changePercent >= 0 ? '+' : ''}
                          {priceChange.changePercent.toFixed(2)}%)
                        </div>
                      ) : (
                        <span className={styles.neutral}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
