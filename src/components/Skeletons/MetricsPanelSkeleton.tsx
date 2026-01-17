import styles from './MetricsPanelSkeleton.module.scss';

export function MetricsPanelSkeleton() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleSkeleton} />
        <div className={styles.timestampSkeleton} />
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.labelSkeleton} />
            <div className={styles.valueSkeleton} />
          </div>
        ))}
      </div>
    </div>
  );
}
