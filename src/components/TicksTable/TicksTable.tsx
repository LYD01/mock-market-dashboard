import { useState, useMemo, useEffect } from 'react';
import type { MarketTick, DateRange } from '../../types/market';
import { formatDateShort } from '../../utils/date';
import styles from './TicksTable.module.scss';

interface TicksTableProps {
  ticks: MarketTick[];
  dateRange: DateRange | null;
}

type SortField = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume';
type SortDirection = 'asc' | 'desc';

const RECORDS_PER_PAGE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_RECORDS_PER_PAGE = 50;

export function TicksTable({ ticks, dateRange }: TicksTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(DEFAULT_RECORDS_PER_PAGE);

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

  // Pagination calculations
  const totalPages = useMemo(() => {
    return Math.ceil(sortedTicks.length / recordsPerPage);
  }, [sortedTicks.length, recordsPerPage]);

  const paginatedTicks = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return sortedTicks.slice(startIndex, endIndex);
  }, [sortedTicks, currentPage, recordsPerPage]);

  // Reset to page 1 when filters or records per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, sortField, sortDirection, recordsPerPage]);

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
    const globalIndex = (currentPage - 1) * recordsPerPage + index;
    if (globalIndex === sortedTicks.length - 1) return null;
    const prevTick = sortedTicks[globalIndex + 1];
    const change = tick.close - prevTick.close;
    const changePercent = prevTick.close !== 0 ? (change / prevTick.close) * 100 : 0;
    return { change, changePercent };
  };

  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing records per page
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table when page changes
      const tableContainer = document.querySelector(`.${styles.tableContainer}`);
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Market Ticks</h2>
        <div className={styles.headerRight}>
          <div className={styles.recordsPerPageSelector}>
            <label htmlFor="records-per-page" className={styles.recordsPerPageLabel}>
              Show:
            </label>
            <select
              id="records-per-page"
              className={styles.recordsPerPageSelect}
              value={recordsPerPage}
              onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
            >
              {RECORDS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <span className={styles.count}>
            {sortedTicks.length.toLocaleString()} records
            {sortedTicks.length > recordsPerPage && (
              <span className={styles.paginationInfo}>
                {' '}
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </span>
        </div>
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
            {paginatedTicks.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No data available
                </td>
              </tr>
            ) : (
              paginatedTicks.map((tick, index) => {
                const priceChange = getPriceChange(tick, index);
                return (
                  <tr key={`${tick.date}-${(currentPage - 1) * recordsPerPage + index}`} className={styles.row}>
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

      {sortedTicks.length > recordsPerPage && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ← Prev
          </button>

          <div className={styles.pageNumbers}>
            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                  onClick={() => handlePageChange(page as number)}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
