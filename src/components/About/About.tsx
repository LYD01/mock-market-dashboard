import styles from './About.module.scss';

export function About() {
  return (
    <div className={styles.about}>
      <div className={styles.plaque}>
        <h1 className={styles.title}>Market Dashboard</h1>
        <p className={styles.subtitle}>
          A side project exploring real-time data visualization through WebSocket implementation. This interactive
          dashboard displays mock market data processed from Kaggle stock market datasets, transformed via Node.js ETL
          pipelines and delivered through a custom WebSocket server.
        </p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>About This Project</h2>
        <div className={styles.sectionContent}>
          <p>
            This is a <strong>side project</strong> designed to practice WebSocket implementation and real-time data
            visualization. The dashboard displays mock market data sourced from{' '}
            <strong>Kaggle stock market datasets</strong>, which are processed through an{' '}
            <strong>ETL pipeline built with Node.js</strong>.
          </p>
          <p>
            The backend architecture includes a <strong>WebSocket server</strong> that streams processed market data to
            connected clients in real-time. The frontend React application consumes this data stream, providing
            interactive visualizations including time series charts, metrics panels, and detailed tick tables.
          </p>
          <p>
            This project serves as a learning exercise in building end-to-end real-time data systems, from data
            extraction and transformation to WebSocket communication and responsive UI design.
          </p>
        </div>
      </div>
    </div>
  );
}
