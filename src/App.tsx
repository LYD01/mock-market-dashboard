import './App.css';
import { MetricsPanel } from './components/MerticsPanel.tsx/MetricsPanel';
import { TicksTable } from './components/TicksTable/TicksTable';
import { TickRow } from './components/TickRow/TickRow';

function App() {
  return (
    <div>
      <h1>Hello World</h1>
      <MetricsPanel />
      <TicksTable />
      <TickRow />
    </div>
  );
}

export default App;
