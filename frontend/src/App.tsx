import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionTracker } from './components/SessionTracker';
import { ProgressDashboard } from './components/ProgressDashboard';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        maxWidth: 640,
        margin: '0 auto',
      }}>
        {/* Header */}
        <header style={{ width: '100%', marginBottom: 48, textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            🇩🇪 German Learning Tracker
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Track every hour. See every step forward.
          </p>
        </header>

        {/* Session Tracker */}
        <section style={{
          width: '100%',
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <SessionTracker />
        </section>

        {/* Progress Dashboard */}
        <section style={{
          width: '100%',
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: '32px',
        }}>
          <ProgressDashboard />
        </section>
      </div>
    </QueryClientProvider>
  );
}

export default App;
