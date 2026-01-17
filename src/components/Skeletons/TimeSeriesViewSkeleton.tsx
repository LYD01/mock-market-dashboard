import styles from './TimeSeriesViewSkeleton.module.scss';

export function TimeSeriesViewSkeleton() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.yAxis}>
          <div className={styles.yLabelSkeleton} />
          <div className={styles.yLabelSkeleton} />
          <div className={styles.yLabelSkeleton} />
        </div>
        <div className={styles.chart}>
          <div className={styles.chartSkeleton} />
        </div>
      </div>

      <div className={styles.ticksList}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.tickItem}>
            <div className={styles.tickDate}>
              <div className={styles.dateSkeleton} />
              <div className={styles.timeSkeleton} />
            </div>
            <div className={styles.tickPrices}>
              <div className={styles.priceGroupSkeleton} />
              <div className={styles.priceGroupSkeleton} />
              <div className={styles.priceGroupSkeleton} />
              <div className={styles.priceGroupSkeleton} />
            </div>
            <div className={styles.tickMeta}>
              <div className={styles.volumeSkeleton} />
              <div className={styles.changeSkeleton} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
