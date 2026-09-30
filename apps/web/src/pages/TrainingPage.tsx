import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows } from '@/components/ui/primitives';

export function TrainingPage() {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYEE') return <SelfTraining />;
  return <TrainingOverview aggregate={user?.role === 'SENIOR_MANAGEMENT'} />;
}

interface OverviewResponse {
  eyebrow: string;
  kpis: { current: number; overdue: number; sessions: number };
  programmes: { id: string; name: string; category: string; cycleMonths: number | null; provider: string | null; who: number; done: number; overdue: number; pct: number; blocksRostering: boolean }[];
  sessions: { id: string; date: string; name: string; location: string | null; seats: string }[];
  blocked: { name: string; initials: string; role: string; reasons: string[] }[];
}

function TrainingOverview({ aggregate }: { aggregate?: boolean }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['training'], queryFn: () => api.get<OverviewResponse>('/training') });

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow={data?.eyebrow ?? 'Mandatory programmes and development'}
        title="Training"
        kpis={data ? [{ value: `${data.kpis.current}%`, label: 'Mandatory training current' }, { value: data.kpis.overdue, label: 'Enrolments overdue' }, { value: data.kpis.sessions, label: 'Sessions this month' }] : undefined}
      />

      {isError ? <ErrorState message="Could not load training." onRetry={() => refetch()} /> : (
        <>
          <div className="card">
            <div className="flex items-baseline justify-between flex-wrap gap-3" style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Programme compliance</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-3)' }}>Completed against required, per programme</span>
            </div>
            {isLoading ? <SkeletonRows rows={6} /> : (
              <div className="flex flex-col">
                {data?.programmes.map((p) => (
                  <div key={p.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                    <span className="flex-1" style={{ minWidth: 200 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{p.category} · {p.cycleMonths ? `every ${p.cycleMonths}m` : 'optional'}{p.provider ? ` · ${p.provider}` : ''}</span>
                    </span>
                    <span style={{ flex: '1 1 140px', minWidth: 120, height: 12, borderRadius: 999, background: 'rgba(28,27,24,.1)', overflow: 'hidden', display: 'block' }}>
                      <span style={{ display: 'block', height: '100%', width: `${p.pct}%`, borderRadius: 999, background: p.overdue > 5 ? 'var(--color-critical)' : p.pct >= 90 ? 'var(--color-ink)' : 'var(--color-accent)' }} />
                    </span>
                    <span className="tnum" style={{ fontSize: 15, color: 'var(--color-ink)', minWidth: 46, textAlign: 'right' }}>{p.pct}%</span>
                    <span className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)', minWidth: 84, textAlign: 'right' }}>{p.done} of {p.who}</span>
                    <span style={{ fontSize: 13, minWidth: 96, textAlign: 'right', color: p.overdue > 5 ? 'var(--color-critical-ink)' : p.overdue > 0 ? 'var(--color-warn-ink)' : 'var(--color-muted)' }}>{p.overdue > 0 ? `${p.overdue} overdue` : 'All current'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-4 flex-wrap" style={{ marginTop: 18 }}>
            {!aggregate && (
              <div className="card-ink" style={{ flex: '1 1 400px', minWidth: 300 }}>
                <div style={{ fontSize: 19, fontWeight: 500 }}>Should not be rostered</div>
                <div style={{ fontSize: 14, color: 'rgba(247,243,230,.82)', marginTop: 4, lineHeight: 1.5 }}>Mandatory training lapsed or a compliance document expired. Operations is notified so these staff are kept off assignment until cleared.</div>
                {data && data.blocked.length === 0 ? (
                  <div style={{ marginTop: 16, fontSize: 15, color: 'rgba(247,243,230,.8)' }}>All operational staff are currently rosterable.</div>
                ) : (
                  <div className="flex flex-col" style={{ marginTop: 16 }}>
                    {data?.blocked.map((b, i) => (
                      <div key={i} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderTop: '1px solid rgba(247,243,230,.16)' }}>
                        <span className="grid place-items-center shrink-0 font-semibold" style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(247,243,230,.16)', color: 'var(--color-cream)', fontSize: 13 }}>{b.initials}</span>
                        <span className="flex-1" style={{ minWidth: 150 }}>
                          <span style={{ display: 'block', fontSize: 16 }}>{b.name}</span>
                          <span style={{ display: 'block', fontSize: 13, color: 'rgba(247,243,230,.82)', marginTop: 2 }}>{b.reasons.join(' · ')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!aggregate && (
              <div className="card" style={{ flex: '1 1 340px', minWidth: 300 }}>
                <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 14 }}>Upcoming sessions</div>
                {data && data.sessions.length === 0 ? <EmptyState title="No sessions scheduled" message="Scheduled training sessions will appear here." /> : (
                  <div className="flex flex-col">
                    {data?.sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-3.5" style={{ padding: '13px 0', borderTop: '1px dashed rgba(28,27,24,.16)' }}>
                        <span className="tnum" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', minWidth: 54 }}>{new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        <span className="flex-1">
                          <span style={{ display: 'block', fontSize: 15, color: 'var(--color-ink)' }}>{s.name}</span>
                          <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>{s.location} · {s.seats}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface SelfResponse {
  records: { id: string; name: string; state: string; meta: string; overdue: boolean }[];
  rosterable: boolean;
  reasons: string[];
}
function SelfTraining() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['training-self'], queryFn: () => api.get<SelfResponse>('/training/self') });
  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader eyebrow="My training" title="Training" />
      {isLoading ? <div className="card"><SkeletonRows rows={5} /></div> : isError ? <div className="card"><ErrorState message="Could not load your training." onRetry={() => refetch()} /></div> : (
        <div className="flex items-start gap-4 flex-wrap">
          <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
            <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>My certifications</div>
            <div style={{ fontSize: 14, color: 'var(--color-muted-3)', marginBottom: 8 }}>Keeping these current keeps you rosterable</div>
            <div className="flex flex-col">
              {data?.records.map((r) => (
                <div key={r.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderTop: '1px dashed rgba(28,27,24,.16)' }}>
                  <span className="flex-1" style={{ minWidth: 170 }}>
                    <span style={{ display: 'block', fontSize: 16, color: 'var(--color-ink)' }}>{r.name}</span>
                    <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{r.meta}</span>
                  </span>
                  <Pill tone={r.overdue ? 'critical' : r.state === 'Booked' ? 'accent' : r.state === 'Valid' ? 'success' : 'neutral'}>{r.state}</Pill>
                </div>
              ))}
            </div>
          </div>
          <div className="card-ink" style={{ flex: '1 1 300px', minWidth: 280, padding: 26 }}>
            <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 8 }}>{data?.rosterable ? 'You are rosterable' : 'Action needed to stay rosterable'}</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(247,243,230,.88)' }}>
              {data?.rosterable
                ? 'All your mandatory certifications are current. Keep them up to date to stay eligible for VIP and airport assignments.'
                : `You are currently not rosterable: ${data?.reasons.join('; ')}. Book the required session to restore eligibility.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
