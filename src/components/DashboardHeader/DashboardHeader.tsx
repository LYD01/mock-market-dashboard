import { formatTime } from '../../utils/date';
import type { DataSource } from '../../config/dataSource';
import styles from './DashboardHeader.module.scss';

interface DashboardHeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  onReconnect: () => void;
  currentView: 'dashboard' | 'about';
  onViewChange: (view: 'dashboard' | 'about') => void;
  dataSource: DataSource;
}

export function DashboardHeader({
  isConnected,
  lastUpdate,
  error,
  onReconnect,
  currentView,
  onViewChange,
  dataSource,
}: DashboardHeaderProps) {
  const getStatusClass = () => {
    if (!isConnected) return styles.disconnected;
    if (dataSource === 'mock') return styles.mock;
    return styles.connected;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (dataSource === 'mock') return 'Mock Data';
    return 'Connected';
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${currentView === 'dashboard' ? styles.active : ''}`}
            onClick={() => onViewChange('dashboard')}
            type="button"
          >
            Dashboard
          </button>
          <button
            className={`${styles.navButton} ${currentView === 'about' ? styles.active : ''}`}
            onClick={() => onViewChange('about')}
            type="button"
          >
            About
          </button>
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.status}>
          <div className={`${styles.statusIndicator} ${getStatusClass()}`}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{getStatusText()}</span>
          </div>

          {lastUpdate && <div className={styles.lastUpdate}>Last update: {formatTime(lastUpdate)}</div>}

          {error && (
            <div className={styles.error}>
              <span className={styles.errorText}>{error}</span>
              <button onClick={onReconnect} className={styles.reconnectButton}>
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
