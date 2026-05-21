import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layouts/AppShell';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ToolPage } from './pages/ToolPage';
import { Pricing } from './pages/Pricing';
import { Account } from './pages/Account';
import { History } from './pages/History';
import { Legal } from './pages/Legal';
import { Admin } from './pages/Admin';
import { useApp } from './context/AppContext';

const ADMIN_EMAIL = 'talhahally974@gmail.com';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/legal" element={<Legal />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tools/:toolId" element={<ToolPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/account" element={<Account />} />
              <Route path="/history" element={<History />} />
            </Route>
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </LanguageProvider>
  );
}
