import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
