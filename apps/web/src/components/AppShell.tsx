import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { MODULE_LABELS, NAV_ORDER, ROLE_LABELS, type ModuleKey } from '@/lib/types';

const ROUTE: Record<ModuleKey, string> = {
  dashboard: '/',
  people: '/people',
  leave: '/leave',
  contracts: '/contracts',
  hiring: '/hiring',
  training: '/training',
  requests: '/requests',
  payroll: '/payroll',
  attendance: '/attendance',
  schedules: '/schedules',
  reports: '/reports',
  admin: '/admin',
  audit: '/audit',
};

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const modules = NAV_ORDER.filter((m) => user.modules.includes(m));

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 28,
        display: 'flex',
        justifyContent: 'center',
        background: 'linear-gradient(180deg,#A7ABB4,#9298A2)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1560,
          borderRadius: 36,
          overflow: 'hidden',
          background:
            'radial-gradient(120% 90% at 88% 8%, #FBEEBC 0%, #FAF3DE 34%, #F3F2EE 62%, #EFEFEC 100%)',
          boxShadow: '0 40px 80px -30px rgba(20,20,25,.45)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-5 flex-wrap" style={{ padding: '22px 28px 6px' }}>
          <div className="flex items-center gap-3" style={{ background: 'var(--color-ink)', borderRadius: 999, padding: '6px 20px 6px 6px' }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--color-cream)', paddingLeft: 14 }}>pts</span>
            <span style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-cream)', fontWeight: 500 }}>
              HR System
            </span>
          </div>

          <nav className="flex items-center flex-wrap" style={{ gap: 2, padding: 6, background: 'rgba(255,255,255,.55)', borderRadius: 999 }}>
            {modules.map((m) => (
              <NavLink
                key={m}
                to={ROUTE[m]}
                end={m === 'dashboard'}
                style={({ isActive }) => ({
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Outfit',
                  fontSize: 15,
                  padding: '10px 20px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  background: isActive ? 'var(--color-ink)' : 'transparent',
                  color: isActive ? 'var(--color-cream)' : 'var(--color-muted-2)',
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                {MODULE_LABELS[m]}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5" style={{ marginLeft: 'auto', position: 'relative' }}>
            {/* Role is shown, NOT switchable — it comes from the session. */}
            <div className="flex items-center gap-1.5" style={{ padding: '8px 16px', background: 'rgba(255,255,255,.7)', borderRadius: 999 }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Signed in as</span>
              <span style={{ fontSize: 13, color: 'var(--color-ink)', fontWeight: 500 }}>{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              aria-label="Account menu"
              onClick={() => setMenuOpen((v) => !v)}
              style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--color-ink)', color: 'var(--color-cream-2)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600, letterSpacing: '.04em', border: 'none', cursor: 'pointer' }}
            >
              {user.initials}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute z-50" style={{ top: 52, right: 0, background: 'var(--color-canvas)', borderRadius: 18, boxShadow: '0 20px 50px -20px rgba(20,20,25,.5)', padding: 8, minWidth: 220 }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px dashed rgba(28,27,24,.16)', marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{user.fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{user.email}</div>
                  </div>
                  <button
                    className="w-full text-left"
                    style={{ padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14 }}
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding: '10px 28px 34px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
