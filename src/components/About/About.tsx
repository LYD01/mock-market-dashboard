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

        <h2 className={styles.sectionTitle}>Local Development Setup</h2>
        <div className={styles.sectionContent}>
          <p>
            Currently, you're viewing the dashboard with <strong>mock data</strong> from CSV files. To test the{' '}
            <strong>WebSocket data source</strong> with real-time streaming, you can set up local development:
          </p>
          <ol>
            <li>
              <strong>Clone the repository</strong> (if you haven't already):
              <pre className={styles.codeBlock}>
                <code>git clone &lt;repository-url&gt;</code>
              </pre>
            </li>
            <li>
              <strong>Install dependencies</strong>:
              <pre className={styles.codeBlock}>
                <code>npm install</code>
              </pre>
            </li>
            <li>
              <strong>Set up the environment</strong>:
              <p>
                Create a <code>.env</code> file in the project root and add:
              </p>
              <pre className={styles.codeBlock}>
                <code>VITE_DATA_SOURCE=websocket{'\n'}VITE_WS_URL=ws://localhost:8080/ws</code>
              </pre>
            </li>
            <li>
              <strong>Start the WebSocket server</strong> (requires Bun):
              <pre className={styles.codeBlock}>
                <code>npm run server</code>
              </pre>
              <p>
                The server will run on <code>http://localhost:8080</code>
              </p>
            </li>
            <li>
              <strong>Start the frontend</strong>:
              <pre className={styles.codeBlock}>
                <code>npm run dev</code>
              </pre>
            </li>
            <li>
              The app will connect to the WebSocket server and display real-time data. The status indicator will show{' '}
              <strong>"Connected"</strong> in green when successfully connected to the WebSocket server.
            </li>
          </ol>
          <p>
            <strong>Note:</strong> To switch back to mock data, remove the <code>VITE_DATA_SOURCE</code> environment
            variable or set it to <code>mock</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
