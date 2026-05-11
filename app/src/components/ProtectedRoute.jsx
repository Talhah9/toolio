import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function ProtectedRoute() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="auth-page">
        <div style={{ color: 'var(--fg-3)', fontSize: 14 }}>Chargement…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <Outlet />;
}
