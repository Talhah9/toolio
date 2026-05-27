import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layouts/AppShell';
import { CommunityLayout } from './layouts/CommunityLayout';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { ToolPage } from './pages/ToolPage';
import { Pricing } from './pages/Pricing';
import { Account } from './pages/Account';
import { History } from './pages/History';
import { Legal } from './pages/Legal';
import { Admin } from './pages/Admin';
import { ShareResult } from './pages/ShareResult';
import { Coaching } from './pages/Coaching';
import { CoachingSuccess } from './pages/CoachingSuccess';
import { CommunityHome } from './pages/community/CommunityHome';
import { PostMission } from './pages/community/PostMission';
import { FindMission } from './pages/community/FindMission';
import { MissionDetail } from './pages/community/MissionDetail';
import { Feed } from './pages/community/Feed';
import { Channels } from './pages/community/Channels';
import { PostDetail } from './pages/community/PostDetail';
import { CreatePost } from './pages/community/CreatePost';
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
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/legal" element={<Legal />} />
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
            </Route>
            {/* Community — standalone layout, no Savvly sidebar */}
            <Route element={<CommunityLayout />}>
              <Route path="/community" element={<CommunityHome />} />
              <Route path="/community/post" element={<PostMission />} />
              <Route path="/community/find" element={<FindMission />} />
              <Route path="/community/mission/:id" element={<MissionDetail />} />
              <Route path="/community/feed" element={<Feed />} />
              <Route path="/community/feed/:postId" element={<PostDetail />} />
              <Route path="/community/channels" element={<Channels />} />
              <Route path="/community/create" element={<CreatePost />} />
            </Route>
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="/share/:id" element={<ShareResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </LanguageProvider>
  );
}
