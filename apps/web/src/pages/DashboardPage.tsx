import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonLine, SkeletonRows } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api';

interface DashboardData {
  headline: { value: number; label: string }[];
  actionPills: { count: number; label: string; key: string }[];
  attendance: { total: number; onDuty: number; onLeave: number; unexplained: number; pct: number };
  leaveQueue: { id: string; reference: string; name: string; role: string; type: string; days: number; dates: string; stage: string }[];
  watchlist: { label: string; value: number; of: number }[];
  headcountByDept: { name: string; count: number }[];
  onLeaveToday: number;
  expiring: { id: string; name: string; initials: string; kind: string; due: string | null }[];
}

const STAGE_TONE: Record<string, 'ink' | 'accent' | 'neutral'> = {
  SUPERVISOR: 'ink',
  HR_VALIDATION: 'accent',
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
  });

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-8" style={{ padding: '14px 4px 26px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{today} · Kigali</div>
          <h1 style={{ margin: 0, fontSize: 56, lineHeight: 1, fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
            Muraho, {user?.fullName.split(' ')[0]}
          </h1>
        </div>
        <div className="flex flex-wrap items-end" style={{ gap: '20px 40px' }}>
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div key={i} style={{ minWidth: 108 }}>
                  <SkeletonLine w={72} h={40} />
                  <div style={{ height: 8 }} />
                  <SkeletonLine w={90} h={12} />
                </div>
              ))
            : data?.headline.map((h, i) => (
                <div key={i} style={{ minWidth: 108 }}>
                  <div className="tnum" style={{ fontSize: 46, lineHeight: 1, fontWeight: 500, color: 'var(--color-ink)' }}>{h.value}</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: 'var(--color-muted-3)' }}>{h.label}</div>
                </div>
              ))}
        </div>
      </div>

      {isError ? (
        <ErrorState message={error instanceof ApiError ? error.message : 'Could not load the dashboard.'} onRetry={() => refetch()} />
      ) : (
        <>
          {/* Action pills */}
          <div className="flex items-center flex-wrap gap-3.5" style={{ padding: '0 4px 26px' }}>
            <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--color-muted)' }}>Needs HR action</span>
            {isLoading
              ? <SkeletonLine w={280} h={38} />
              : data?.actionPills.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-2" style={{ padding: '9px 18px', borderRadius: 999, fontSize: 15, background: i === 0 ? 'var(--color-ink)' : i === 1 ? 'var(--color-accent)' : 'rgba(255,255,255,.7)', color: i === 0 ? 'var(--color-cream)' : 'var(--color-ink)' }}>
                    <span className="tnum font-semibold">{p.count}</span>
                    <span style={{ opacity: 0.85 }}>{p.label}</span>
                  </span>
                ))}
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
            {/* Attendance */}
            <div className="card-ink" style={{ minHeight: 300, display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-baseline">
                <span style={{ fontSize: 20, fontWeight: 500 }}>Attendance today</span>
                <span style={{ fontSize: 13, color: 'rgba(247,243,230,.78)' }}>07:45</span>
              </div>
              <div className="flex items-center gap-4" style={{ margin: '22px 0 20px' }}>
                <div style={{ width: 108, height: 108, borderRadius: 999, background: `conic-gradient(var(--color-accent) 0 ${data?.attendance.pct ?? 0}%, rgba(247,243,230,.22) ${data?.attendance.pct ?? 0}% 100%)`, display: 'grid', placeItems: 'center' }}>
                  <div style={{ width: 78, height: 78, borderRadius: 999, background: 'var(--color-ink)', display: 'grid', placeItems: 'center' }}>
                    <span className="tnum" style={{ fontSize: 24, fontWeight: 500 }}>{data ? `${data.attendance.pct}%` : '—'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <Legend color="var(--color-accent)" label="On duty" value={data?.attendance.onDuty} />
                  <Legend color="#6E6A5C" label="On leave" value={data?.attendance.onLeave} />
                  <Legend color="rgba(247,243,230,.3)" label="Unexplained" value={data?.attendance.unexplained} />
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(247,243,230,.14)', fontSize: 14, color: 'rgba(247,243,230,.8)', lineHeight: 1.5 }}>
                Operations runs shift rosters — drivers are counted against their assigned shift, not 08:00.
              </div>
            </div>

            {/* Leave awaiting approval */}
            <div className="card" style={{ gridColumn: 'span 2', minHeight: 300 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)' }}>Leave awaiting approval</span>
                {user?.modules.includes('leave') && (
                  <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }} onClick={() => navigate('/leave')}>Open queue</button>
                )}
              </div>
              {isLoading ? (
                <SkeletonRows rows={4} />
              ) : data && data.leaveQueue.length === 0 ? (
                <EmptyState title="Nothing awaiting decision" message="When employees file leave, requests waiting on a supervisor or HR validation appear here." />
              ) : (
                <div className="flex flex-col">
                  {data?.leaveQueue.map((l) => (
                    <div key={l.id} className="grid items-center" style={{ gridTemplateColumns: '1.4fr .9fr .8fr auto', gap: '10px 14px', padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
                      <div>
                        <div style={{ fontSize: 16, color: 'var(--color-ink)', fontWeight: 500 }}>{l.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{l.role}</div>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-muted-2)' }}>{l.type} ({l.days}d)</div>
                      <div className="tnum" style={{ fontSize: 14, color: 'var(--color-muted-2)' }}>{l.dates}</div>
                      <Pill tone={STAGE_TONE[l.stage] ?? 'neutral'}>{l.stage === 'HR_VALIDATION' ? 'HR validation' : 'Supervisor'}</Pill>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance watchlist */}
            <div className="card" style={{ minHeight: 300 }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 18 }}>Compliance watchlist</div>
              {isLoading ? (
                <SkeletonRows rows={3} />
              ) : (
                <div className="flex flex-col gap-4">
                  {data?.watchlist.map((w, i) => {
                    const pct = w.of ? Math.round((w.value / w.of) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between" style={{ fontSize: 14, color: 'var(--color-ink)', marginBottom: 7 }}>
                          <span>{w.label}</span>
                          <span className="tnum" style={{ color: 'var(--color-muted)' }}>{w.value} of {w.of}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: 'rgba(28,27,24,.1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--color-ink)' : 'var(--color-accent)', borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Second row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', marginTop: 18 }}>
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)' }}>Headcount by department</span>
              </div>
              {isLoading ? (
                <SkeletonLine w="100%" h={190} />
              ) : (
                <div className="flex items-end gap-4" style={{ height: 190 }}>
                  {data?.headcountByDept.slice(0, 7).map((d, i) => {
                    const max = Math.max(...(data?.headcountByDept.map((x) => x.count) ?? [1]));
                    return (
                      <div key={d.name} className="flex-1 flex flex-col items-center gap-2.5 justify-end" style={{ height: '100%' }}>
                        <span className="tnum" style={{ fontSize: 15, color: 'var(--color-ink)' }}>{d.count}</span>
                        <div style={{ width: '100%', height: `${(d.count / max) * 100}%`, minHeight: 10, borderRadius: 14, background: i === 0 ? 'var(--color-ink)' : 'var(--color-accent)', opacity: i === 0 ? 1 : 0.55 + i * 0.06 }} />
                        <span style={{ fontSize: 13, color: 'var(--color-muted-3)', textAlign: 'center' }}>{d.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 18 }}>Contracts &amp; probation expiring</div>
              {isLoading ? (
                <SkeletonRows rows={4} />
              ) : data && data.expiring.length === 0 ? (
                <EmptyState title="Nothing expiring soon" message="Contracts and probation periods ending within the reminder window will appear here." />
              ) : (
                <div className="flex flex-col">
                  {data?.expiring.map((e) => (
                    <div key={e.id} className="flex items-center gap-3.5" style={{ padding: '12px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
                      <Avatar initials={e.initials} />
                      <div className="flex-1">
                        <div style={{ fontSize: 15, color: 'var(--color-ink)', fontWeight: 500 }}>{e.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{e.kind}</div>
                      </div>
                      <Pill tone="accent">{e.due ? new Date(e.due).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}</Pill>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 14 }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: color }} />
      <span style={{ color: 'rgba(247,243,230,.88)' }}>{label}</span>
      <span className="tnum" style={{ marginLeft: 'auto' }}>{value ?? '—'}</span>
    </div>
  );
}
