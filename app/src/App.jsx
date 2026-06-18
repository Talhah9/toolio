import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layouts/AppShell';
import { useApp } from './context/AppContext';

const lazy1 = (fn) => lazy(() => fn().then(m => ({ default: Object.values(m)[0] })));

const Landing       = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Auth          = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Dashboard     = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ToolPage      = lazy(() => import('./pages/ToolPage').then(m => ({ default: m.ToolPage })));
const Pricing       = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Account       = lazy(() => import('./pages/Account').then(m => ({ default: m.Account })));
const History       = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Legal         = lazy(() => import('./pages/Legal').then(m => ({ default: m.Legal })));
const Admin         = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const ShareResult   = lazy(() => import('./pages/ShareResult').then(m => ({ default: m.ShareResult })));
const Coaching      = lazy(() => import('./pages/Coaching').then(m => ({ default: m.Coaching })));
const CoachingSuccess = lazy(() => import('./pages/CoachingSuccess').then(m => ({ default: m.CoachingSuccess })));
const ComingSoon    = lazy(() => import('./pages/ComingSoon').then(m => ({ default: m.ComingSoon })));
const ToolLanding   = lazy(() => import('./pages/ToolLanding').then(m => ({ default: m.ToolLanding })));

const ADMIN_EMAIL = 'talhahally974@gmail.com';

const _initialReferrer = typeof document !== 'undefined' ? (document.referrer || null) : null;

function RouteTracker() {
  const location = useLocation();
  const tracked = useRef(new Set());
  const isFirst = useRef(true);

  useEffect(() => {
    const { pathname } = location;
    if (pathname.startsWith('/admin')) return;
    if (tracked.current.has(pathname)) return;
    tracked.current.add(pathname);

    const referrer = isFirst.current ? _initialReferrer : null;
    isFirst.current = false;

    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer }),
    }).catch(() => {});
  }, [location.pathname]);

  return null;
}

const Spinner = () => (
  <>
    <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: '_spin 0.8s linear infinite' }} />
    </div>
  </>
);

function AdminGuard() {
  const { user, loading } = useApp();
  if (loading) return null;
  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />;
  return <AppShell />;
}

export function App() {
  return (
    <LanguageProvider>
    <AppProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <RouteTracker />
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/outils/:slug" element={<ToolLanding />} />
            <Route element={<ProtectedRoute />}>
              {/* Main app — with Savvly sidebar */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tools/:toolId" element={<ToolPage />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/account" element={<Account />} />
                <Route path="/history" element={<History />} />
                <Route path="/coaching" element={<Coaching />} />
                <Route path="/coaching/success" element={<CoachingSuccess />} />
                <Route path="/community" element={<ComingSoon />} />
                <Route path="/community/*" element={<ComingSoon />} />
              </Route>
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
            <Route path="/share/:id" element={<ShareResult />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
    </LanguageProvider>
  );
}
