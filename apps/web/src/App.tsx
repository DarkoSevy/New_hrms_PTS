import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PeoplePage } from '@/pages/PeoplePage';
import { ContractsPage } from '@/pages/ContractsPage';
import { HiringPage } from '@/pages/HiringPage';
import { AdminPage } from '@/pages/AdminPage';
import { AuditPage } from '@/pages/AuditPage';
import { Spinner } from '@/components/ui/primitives';
import type { ModuleKey } from '@/lib/types';

function FullScreenLoader() {
  return (
    <div className="grid place-items-center" style={{ minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );
}

/** Route guard. The server is the authority on access; this only avoids
 *  rendering a page the current role has no module for. */
function Guarded({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.modules.includes(module)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/people" element={<Guarded module="people"><PeoplePage /></Guarded>} />
        <Route path="/people/:id" element={<Guarded module="people"><PeoplePage /></Guarded>} />
        <Route path="/contracts" element={<Guarded module="contracts"><ContractsPage /></Guarded>} />
        <Route path="/hiring" element={<Guarded module="hiring"><HiringPage /></Guarded>} />
        <Route path="/admin" element={<Guarded module="admin"><AdminPage /></Guarded>} />
        <Route path="/audit" element={<Guarded module="audit"><AuditPage /></Guarded>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
