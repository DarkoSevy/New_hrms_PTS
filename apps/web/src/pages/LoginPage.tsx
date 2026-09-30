import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/lib/api';
import { Spinner } from '@/components/ui/primitives';

const DEMO = [
  { role: 'HR Administrator', email: 'hradmin@pts.rw' },
  { role: 'HR Officer', email: 'hrofficer@pts.rw' },
  { role: 'Manager', email: 'manager@pts.rw' },
  { role: 'Employee', email: 'employee@pts.rw' },
  { role: 'Senior Management', email: 'exec@pts.rw' },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div
        className="w-full"
        style={{
          maxWidth: 940,
          borderRadius: 36,
          overflow: 'hidden',
          background: 'radial-gradient(120% 90% at 88% 8%, #FBEEBC 0%, #FAF3DE 34%, #F3F2EE 62%, #EFEFEC 100%)',
          boxShadow: '0 40px 80px -30px rgba(20,20,25,.45)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
        }}
      >
        {/* Left: brand panel */}
        <div style={{ background: 'var(--color-ink)', color: 'var(--color-cream)', padding: 40, display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>pts</span>
            <span style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(247,243,230,.7)' }}>HR System</span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <h1 style={{ fontSize: 40, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-.02em', margin: '0 0 12px' }}>
              People, contracts and compliance — in one place.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(247,243,230,.82)', lineHeight: 1.6 }}>
              For PTS.rw — a transport and tourism company where compliance decides who can be rostered.
            </p>
          </div>
        </div>

        {/* Right: sign-in form */}
        <div style={{ padding: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Welcome back</div>
          <h2 style={{ fontSize: 30, fontWeight: 400, letterSpacing: '-.01em', margin: '0 0 24px', color: 'var(--color-ink)' }}>Sign in</h2>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="you@pts.rw" />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
            </div>

            {error && (
              <div role="alert" style={{ background: 'rgba(180,85,63,.1)', color: 'var(--color-critical-ink)', borderRadius: 14, padding: '11px 16px', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-accent inline-flex items-center justify-center gap-2" style={{ padding: '14px 22px', fontSize: 16, marginTop: 4 }} disabled={busy}>
              {busy && <Spinner size={16} />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px dashed rgba(28,27,24,.16)' }}>
            <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-muted-4)', marginBottom: 10 }}>
              Demo accounts · password Passw0rd!
            </div>
            <div className="flex flex-col gap-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword('Passw0rd!'); }}
                  className="flex items-center justify-between text-left"
                  style={{ padding: '9px 14px', borderRadius: 12, border: 'none', background: 'rgba(28,27,24,.05)', cursor: 'pointer', fontFamily: 'Outfit' }}
                >
                  <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>{d.role}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
