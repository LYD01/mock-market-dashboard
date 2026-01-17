import { formatTime } from '../../utils/date';
import styles from './DashboardHeader.module.scss';

interface DashboardHeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  onReconnect: () => void;
  connectionEnabled: boolean;
  onConnectionToggle: (enabled: boolean) => void;
}

export function DashboardHeader({
  isConnected,
  lastUpdate,
  error,
  onReconnect,
  connectionEnabled,
  onConnectionToggle,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Market Dashboard</h1>
        <span className={styles.subtitle}>Real-time Market Data</span>
      </div>

      <div className={styles.right}>
        <div className={styles.status}>
          <div className={styles.connectionToggle}>
            <label htmlFor="connection-toggle" className={styles.toggleLabel}>
              Simulate Disconnect:
            </label>
            <button
              id="connection-toggle"
              type="button"
              onClick={() => onConnectionToggle(!connectionEnabled)}
              className={`${styles.toggleSwitch} ${connectionEnabled ? styles.enabled : styles.disabled}`}
              aria-label={connectionEnabled ? 'Disable connection' : 'Enable connection'}
            >
              <span className={styles.toggleSlider} />
            </button>
          </div>

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
