import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { OnboardingModal } from '../components/OnboardingModal';
import { useApp } from '../context/AppContext';

export function AppShell() {
  const { showOnboarding } = useApp();

  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <Outlet />
      </main>
      <BottomNav />
      {showOnboarding && <OnboardingModal />}
    </div>
  );
}
