import styles from './DashboardLayoutSkeleton.module.scss';

export function DashboardLayoutSkeleton() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleSkeleton} />
          <div className={styles.subtitleSkeleton} />
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusSkeleton} />
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <div className={styles.toggleSkeleton} />
            <div className={styles.toggleSkeleton} />
            <div className={styles.toggleSkeleton} />
          </div>
          <div className={styles.filterSkeleton} />
        </div>

        <div className={styles.content}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleSkeleton} />
              <div className={styles.panelMetaSkeleton} />
            </div>
            <div className={styles.panelContent}>
              <div className={styles.contentSkeleton} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
