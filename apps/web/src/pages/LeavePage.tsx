import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, downloadExport, ApiError } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows, Spinner } from '@/components/ui/primitives';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';

const STAGE_TONE: Record<string, 'ink' | 'accent' | 'success' | 'critical' | 'neutral'> = {
  SUPERVISOR: 'ink', HR_VALIDATION: 'accent', APPROVED: 'success', REJECTED: 'critical', CANCELLED: 'neutral',
};

export function LeavePage() {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYEE') return <SelfLeave />;
  if (user?.role === 'SENIOR_MANAGEMENT') return <ExecLeave />;
  return <LeaveQueue />;
}

// ---------------------------------------------------------------------------
// Manager / HR queue
// ---------------------------------------------------------------------------
interface LeaveRow {
  id: string; reference: string; name: string; initials: string; role: string; type: string; days: number;
  dates: string; stage: string; stageLabel: string; reason: string; coverNote: string | null; isOperational: boolean;
}
interface QueueResponse {
  data: LeaveRow[];
  kpis: { awaiting: number; onLeaveToday: number };
  leaveTypes: { id: string; name: string; entitlementLabel: string; rule: string }[];
  cover: { floor: number; days: { day: string; away: number; need: string }[] };
  canDecide: boolean;
}
const FILTERS = ['Pending', 'Operations', 'Decided', 'All'];

function LeaveQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('Pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<LeaveRow | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['leave', filter], queryFn: () => api.get<QueueResponse>(`/leave?filter=${filter}`) });
  const rows = data?.data ?? [];
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => api.post(`/leave/${id}/decision`, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setConfirmDecline(null); },
  });

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Request → supervisor → HR validation"
        title="Leave"
        kpis={data ? [{ value: data.kpis.awaiting, label: 'Awaiting decision' }, { value: data.kpis.onLeaveToday, label: 'On leave today' }] : undefined}
        actions={<>
          <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport(`/leave?filter=${filter}&export=csv`, 'leave.csv')}>CSV</button>
          <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport(`/leave?filter=${filter}&export=pdf`, 'leave.pdf')}>PDF</button>
        </>}
      />

      <div className="flex items-start gap-4 flex-wrap">
        <div className="card" style={{ flex: '1 1 460px', minWidth: 320, padding: 20 }}>
          <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 16 }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14, padding: '9px 16px', borderRadius: 999, background: filter === f ? 'var(--color-ink)' : 'rgba(28,27,24,.06)', color: filter === f ? 'var(--color-cream)' : 'var(--color-muted-2)' }}>{f}</button>
            ))}
          </div>
          {isLoading ? <SkeletonRows rows={5} /> : isError ? <ErrorState message="Could not load leave." onRetry={() => refetch()} /> : rows.length === 0 ? (
            <EmptyState title="Nothing here" message="No leave requests match this filter. Try another." />
          ) : (
            <div className="flex flex-col gap-0.5">
              {rows.map((r) => {
                const active = r.id === selected?.id;
                return (
                  <button key={r.id} onClick={() => setSelectedId(r.id)} className="flex items-center gap-3.5 flex-wrap text-left w-full" style={{ padding: '14px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', background: active ? 'rgba(28,27,24,.07)' : 'transparent' }}>
                    <Avatar initials={r.initials} tone={active ? 'accent' : 'muted'} />
                    <span className="flex-1" style={{ minWidth: 160 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{r.name}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{r.role}</span>
                    </span>
                    <span style={{ minWidth: 96 }}>
                      <span style={{ display: 'block', fontSize: 15, color: 'var(--color-ink)' }}>{r.type} · {r.days}d</span>
                      <span className="tnum" style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{r.dates}</span>
                    </span>
                    <Pill tone={STAGE_TONE[r.stage] ?? 'neutral'}>{r.stageLabel}</Pill>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4" style={{ flex: '1 1 340px', minWidth: 300 }}>
          {selected && (
            <div className="card-ink" style={{ padding: 24 }}>
              <div className="flex items-start justify-between gap-3.5 flex-wrap">
                <div>
                  <div style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(247,243,230,.78)', marginBottom: 8 }}>{selected.reference}</div>
                  <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>{selected.name}</div>
                  <div style={{ fontSize: 15, color: 'rgba(247,243,230,.82)', marginTop: 4 }}>{selected.role}</div>
                </div>
                <Pill tone={STAGE_TONE[selected.stage] ?? 'neutral'}>{selected.stageLabel}</Pill>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 18, margin: '24px 0 20px' }}>
                <DarkFact label="Type" value={selected.type} />
                <DarkFact label="Duration" value={`${selected.days} days`} />
                <DarkFact label="Dates" value={selected.dates} />
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(247,243,230,.88)' }}>{selected.reason}</div>
              {selected.coverNote && <div style={{ fontSize: 14, color: 'rgba(247,243,230,.78)', marginTop: 12 }}>Cover: {selected.coverNote}</div>}

              {data?.canDecide && (selected.stage === 'SUPERVISOR' || selected.stage === 'HR_VALIDATION') && (
                <div className="flex gap-2.5 flex-wrap" style={{ marginTop: 22 }}>
                  <button className="btn-accent inline-flex items-center gap-2" style={{ padding: '12px 22px', fontSize: 15 }} disabled={decide.isPending} onClick={() => decide.mutate({ id: selected.id, action: 'approve' })}>
                    {decide.isPending && <Spinner size={15} />} {selected.stage === 'SUPERVISOR' ? 'Approve as supervisor' : 'Validate & approve'}
                  </button>
                  <button className="btn-ghost-dark" style={{ padding: '12px 22px', fontSize: 15 }} onClick={() => setConfirmDecline(selected)}>Decline</button>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="card">
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 18 }}>Approval flow</div>
              <FlowSteps stage={selected.stage} />
            </div>
          )}
        </div>
      </div>

      {/* Cover check + leave types */}
      <div className="flex items-start gap-4 flex-wrap" style={{ marginTop: 18 }}>
        <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
          <div className="flex items-baseline justify-between flex-wrap gap-3" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Operations cover check</span>
            <span style={{ fontSize: 14, color: 'var(--color-muted-3)' }}>Minimum {data?.cover.floor ?? 55} drivers on duty</span>
          </div>
          <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
            {data?.cover.days.map((c) => (
              <div key={c.day} className="flex items-center gap-3.5">
                <span className="tnum" style={{ fontSize: 14, color: 'var(--color-ink)', minWidth: 62 }}>{c.day}</span>
                <span className="flex-1" style={{ height: 12, borderRadius: 999, background: 'rgba(28,27,24,.1)', overflow: 'hidden', display: 'block' }}>
                  <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (c.away / 10) * 100)}%`, borderRadius: 999, background: c.need === 'Below cover' ? 'var(--color-critical)' : c.need === 'Tight' ? 'var(--color-accent)' : 'var(--color-ink)' }} />
                </span>
                <span className="tnum" style={{ fontSize: 14, color: 'var(--color-ink)', minWidth: 62 }}>{c.away} away</span>
                <span style={{ fontSize: 13, color: c.need === 'Below cover' ? 'var(--color-critical-ink)' : 'var(--color-muted-2)', minWidth: 92, textAlign: 'right' }}>{c.need}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ flex: '1 1 380px', minWidth: 300 }}>
          <div className="flex items-baseline justify-between flex-wrap gap-3" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Leave types</span>
            <span style={{ fontSize: 14, color: 'var(--color-muted-3)' }}>Configurable in Admin</span>
          </div>
          <div className="flex flex-col">
            {data?.leaveTypes.map((t) => (
              <div key={t.id} className="flex items-start gap-3.5" style={{ padding: '13px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                <span className="flex-1">
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.45 }}>{t.rule}</span>
                </span>
                <span style={{ fontSize: 15, color: 'var(--color-ink)', textAlign: 'right' }}>{t.entitlementLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDecline}
        title="Decline this leave request?"
        message={confirmDecline ? <>You're about to decline <strong>{confirmDecline.reference}</strong> — {confirmDecline.type} leave for {confirmDecline.name}. They'll be notified. This can't be undone.</> : ''}
        confirmLabel="Decline request"
        busy={decide.isPending}
        onConfirm={() => confirmDecline && decide.mutate({ id: confirmDecline.id, action: 'reject' })}
        onCancel={() => setConfirmDecline(null)}
      />
    </div>
  );
}

function DarkFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(247,243,230,.78)' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 18, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function FlowSteps({ stage }: { stage: string }) {
  const idx = { EMPLOYEE_REQUEST: 0, SUPERVISOR: 1, HR_VALIDATION: 2, APPROVED: 3, REJECTED: 1, CANCELLED: 0 }[stage] ?? 0;
  const steps = ['Employee request', 'Supervisor approval', 'HR validation', stage === 'REJECTED' ? 'Rejected' : 'Approved'];
  return (
    <div className="flex flex-col gap-3.5">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="grid place-items-center shrink-0" style={{ width: 26, height: 26, borderRadius: 999, fontSize: 12, fontWeight: 600, background: i < idx ? 'var(--color-ink)' : i === idx ? 'var(--color-accent)' : 'rgba(28,27,24,.1)', color: i < idx ? 'var(--color-cream)' : 'var(--color-ink)' }}>{i + 1}</span>
          <span style={{ fontSize: 15, color: i <= idx ? 'var(--color-ink)' : 'var(--color-muted)', fontWeight: i === idx ? 500 : 400 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Self leave (employee)
// ---------------------------------------------------------------------------
interface SelfResponse {
  annual: { entitlement: number; taken: number; pending: number; remaining: number } | null;
  balances: { type: string; entitlement: number; taken: number; pending: number }[];
  history: { id: string; reference: string; type: string; days: number; dates: string; stage: string; stageLabel: string }[];
  types: { id: string; name: string; entitlementLabel: string; rule: string; appliesTo: string }[];
}
function SelfLeave() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['leave-self'], queryFn: () => api.get<SelfResponse>('/leave/self') });
  const [open, setOpen] = useState(false);

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader eyebrow="My leave" title="Leave" />
      {isLoading ? <div className="card"><SkeletonRows rows={4} /></div> : isError ? <div className="card"><ErrorState message="Could not load your leave." onRetry={() => refetch()} /></div> : (
        <div className="flex items-start gap-4 flex-wrap">
          <div className="card-ink" style={{ flex: '1 1 320px', minWidth: 300, padding: 26 }}>
            <div style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(247,243,230,.78)' }}>Annual leave balance</div>
            <div className="flex items-end gap-2.5" style={{ margin: '14px 0 18px' }}>
              <span className="tnum" style={{ fontSize: 64, lineHeight: 1, fontWeight: 500 }}>{data?.annual?.remaining ?? 0}</span>
              <span style={{ fontSize: 18, color: 'rgba(247,243,230,.82)', paddingBottom: 8 }}>of {data?.annual?.entitlement ?? 18} days left</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: 'rgba(247,243,230,.16)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${data?.annual ? Math.round((data.annual.remaining / data.annual.entitlement) * 100) : 0}%`, background: 'var(--color-accent)', borderRadius: 999 }} />
            </div>
            <div className="flex flex-col" style={{ marginTop: 20 }}>
              {data?.annual && [['Annual entitlement', `${data.annual.entitlement} days`], ['Taken', `${data.annual.taken} days`], ['Pending decision', `${data.annual.pending} days`], ['Remaining', `${data.annual.remaining} days`]].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-3" style={{ padding: '11px 0', borderTop: '1px solid rgba(247,243,230,.16)', fontSize: 15 }}>
                  <span style={{ color: 'rgba(247,243,230,.88)' }}>{l}</span><span className="tnum">{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-accent" style={{ width: '100%', marginTop: 22, padding: '14px 22px', fontSize: 16 }} onClick={() => setOpen(true)}>Request leave</button>
            <div style={{ fontSize: 13, color: 'rgba(247,243,230,.78)', marginTop: 12, lineHeight: 1.5 }}>Goes to your supervisor first, then HR. You will be notified at each step.</div>
          </div>

          <div className="flex flex-col gap-4" style={{ flex: '1 1 420px', minWidth: 320 }}>
            <div className="card">
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 14 }}>My requests</div>
              {data && data.history.length === 0 ? <EmptyState title="No requests yet" message="When you request leave it will show here with its status." /> : (
                <div className="flex flex-col">
                  {data?.history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                      <span className="flex-1" style={{ minWidth: 150 }}>
                        <span style={{ display: 'block', fontSize: 16, color: 'var(--color-ink)' }}>{h.type} · {h.days}d</span>
                        <span className="tnum" style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{h.reference} · {h.dates}</span>
                      </span>
                      <Pill tone={STAGE_TONE[h.stage] ?? 'neutral'}>{h.stageLabel}</Pill>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>What I can request</div>
              <div style={{ fontSize: 14, color: 'var(--color-muted-3)', marginBottom: 8 }}>Per PTS policy and Rwandan labour law</div>
              <div className="flex flex-col">
                {data?.types.map((t) => (
                  <div key={t.id} className="flex justify-between gap-3" style={{ padding: '12px 0', borderTop: '1px dashed rgba(28,27,24,.16)', fontSize: 15 }}>
                    <span style={{ color: 'var(--color-ink)' }}>{t.name}</span><span style={{ color: 'var(--color-muted-2)' }}>{t.entitlementLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {open && <RequestLeaveModal types={data?.types ?? []} onClose={() => setOpen(false)} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['leave-self'] }); }} />}
    </div>
  );
}

function RequestLeaveModal({ types, onClose, onDone }: { types: SelfResponse['types']; onClose: () => void; onDone: () => void }) {
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? '');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const create = useMutation({
    mutationFn: () => api.post('/leave', { leaveTypeId, startDate, endDate, reason }),
    onSuccess: onDone,
  });
  return (
    <Modal open onClose={onClose} title="Request leave" subtitle="Goes to your supervisor, then HR">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
        <div>
          <label className="field-label">Leave type</label>
          <select className="field" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.entitlementLabel}</option>)}
          </select>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 140 }}><label className="field-label">Start date</label><input className="field" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} required /></div>
          <div style={{ flex: 1, minWidth: 140 }}><label className="field-label">End date</label><input className="field" type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} required /></div>
        </div>
        <div><label className="field-label">Reason</label><textarea className="field" style={{ minHeight: 80, resize: 'vertical' }} value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
        {create.isError && <div role="alert" style={{ background: 'rgba(180,85,63,.1)', color: 'var(--color-critical-ink)', borderRadius: 14, padding: '11px 16px', fontSize: 14 }}>{create.error instanceof ApiError ? create.error.message : 'Could not submit.'}</div>}
        <button className="btn-accent inline-flex items-center justify-center gap-2" style={{ padding: '14px 22px', fontSize: 16 }} disabled={create.isPending}>{create.isPending && <Spinner size={16} />} Submit request</button>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Executive aggregate
// ---------------------------------------------------------------------------
interface ExecResponse {
  byDept: { name: string; used: number; days: number }[];
  cover: { floor: number; days: { day: string; away: number; need: string }[] };
  accruedUnused: number;
}
function ExecLeave() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['leave-exec'], queryFn: () => api.get<ExecResponse>('/leave/exec') });
  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader eyebrow="Aggregate only · no individual records" title="Leave & absence" kpis={data ? [{ value: data.accruedUnused, label: 'Days accrued, unused' }, { value: `${data.cover.floor}`, label: 'Driver cover floor' }] : undefined} />
      {isLoading ? <div className="card"><SkeletonRows rows={6} /></div> : isError ? <div className="card"><ErrorState message="Could not load." onRetry={() => refetch()} /></div> : (
        <div className="flex items-start gap-4 flex-wrap">
          <div className="card" style={{ flex: '1 1 460px', minWidth: 320 }}>
            <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 18 }}>Entitlement used by department</div>
            <div className="flex flex-col gap-3.5">
              {data?.byDept.map((d) => (
                <div key={d.name} className="flex items-center gap-3.5">
                  <span style={{ fontSize: 15, color: 'var(--color-ink)', minWidth: 104 }}>{d.name}</span>
                  <span className="flex-1" style={{ height: 14, borderRadius: 999, background: 'rgba(28,27,24,.1)', overflow: 'hidden', display: 'block' }}>
                    <span style={{ display: 'block', height: '100%', width: `${d.used}%`, borderRadius: 999, background: d.used >= 70 ? 'var(--color-ink)' : 'var(--color-accent)' }} />
                  </span>
                  <span className="tnum" style={{ fontSize: 15, color: 'var(--color-ink)', minWidth: 44, textAlign: 'right' }}>{d.used}%</span>
                  <span className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)', minWidth: 76, textAlign: 'right' }}>{d.days} days</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-ink" style={{ flex: '1 1 320px', minWidth: 300, padding: 26 }}>
            <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 8 }}>Where leave hurts operations</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(247,243,230,.88)' }}>
              Operations is measured against a {data?.cover.floor}-driver daily cover floor. Days that fall below cover put confirmed airport transfers at risk.
            </div>
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(247,243,230,.16)', fontSize: 15, color: 'rgba(247,243,230,.88)', lineHeight: 1.6 }}>
              {data?.accruedUnused} accrued days sit unused. Carry-forward is capped and expires, so unused balance becomes a liability HR should schedule down before year end.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
