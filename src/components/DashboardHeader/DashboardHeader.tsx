import { formatTime } from '../../utils/date';
import styles from './DashboardHeader.module.scss';

interface DashboardHeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  onReconnect: () => void;
  currentView: 'dashboard' | 'about';
  onViewChange: (view: 'dashboard' | 'about') => void;
}

export function DashboardHeader({
  isConnected,
  lastUpdate,
  error,
  onReconnect,
  currentView,
  onViewChange,
}: DashboardHeaderProps) {
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
          <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</span>
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
