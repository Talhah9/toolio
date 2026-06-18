import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import { App } from './App';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashScreen />} showDialog={false}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);

function CrashScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F0F1A', margin: 0 }}>Une erreur inattendue s'est produite</h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>L'équipe Savvly a été notifiée. Rechargez la page pour continuer.</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 8, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Recharger la page
      </button>
    </div>
  );
}
// Thu, May 14, 2026 12:03:21 AM
