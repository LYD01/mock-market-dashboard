import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <img src="/favicon.webp" alt="" className={styles.favicon} />
        <span className={styles.text}>Built by</span>
        <a
          href="https://github.com/LYD01/mock-market-dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          aria-label="GitHub profile"
        >
          GitHub
        </a>
        <span className={styles.separator}>•</span>
        <a
          href="https://x.com/dantavius9"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          aria-label="X.com profile"
        >
          X.com
        </a>
      </div>
    </footer>
  );
}
