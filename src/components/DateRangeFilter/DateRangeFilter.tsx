import { useState, useMemo } from 'react';
import type { DateRange } from '../../types/market';
import styles from './DateRangeFilter.module.scss';

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange | null) => void;
  availableDates: string[];
}

export function DateRangeFilter({ onRangeChange, availableDates }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const sortedDates = useMemo(() => {
    return [...availableDates].sort();
  }, [availableDates]);

  const minDate = sortedDates[0] || '';
  const maxDate = sortedDates[sortedDates.length - 1] || '';

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (value && endDate) {
      const range: DateRange = {
        start: new Date(value),
        end: new Date(endDate),
      };
      onRangeChange(range);
    } else {
      onRangeChange(null);
    }
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
    if (startDate && value) {
      const range: DateRange = {
        start: new Date(startDate),
        end: new Date(value),
      };
      onRangeChange(range);
    } else {
      onRangeChange(null);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onRangeChange(null);
  };

  return (
    <div className={styles.filter}>
      <input
        id="start-date"
        type="date"
        value={startDate}
        min={minDate}
        max={maxDate}
        onChange={(e) => handleStartChange(e.target.value)}
        className={styles.input}
        placeholder="Start"
      />
      <span className={styles.separator}>→</span>
      <input
        id="end-date"
        type="date"
        value={endDate}
        min={minDate}
        max={maxDate}
        onChange={(e) => handleEndChange(e.target.value)}
        className={styles.input}
        placeholder="End"
      />
      {(startDate || endDate) && (
        <button onClick={handleClear} className={styles.clearButton} aria-label="Clear date range">
          ×
        </button>
      )}
    </div>
  );
}
