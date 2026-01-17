import styles from './TicksTableSkeleton.module.scss';

export function TicksTableSkeleton() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className={styles.th}>
                  <div className={styles.thSkeleton} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <tr key={rowIndex} className={styles.row}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className={styles.td}>
                    <div className={styles.cellSkeleton} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
