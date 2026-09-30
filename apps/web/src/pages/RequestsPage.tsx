import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, downloadExport, ApiError } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, Pill, SkeletonRows, Spinner, Avatar } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';

const STATUS_TONE: Record<string, 'ink' | 'accent' | 'success' | 'critical' | 'neutral'> = {
  OVERDUE: 'critical', RESOLVED: 'success', PENDING_MANAGER: 'ink', IN_PROGRESS: 'neutral', AWAITING_EMPLOYEE: 'accent', CANCELLED: 'neutral',
};
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function RequestsPage() {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYEE') return <SelfRequests />;
  return <RequestsQueue />;
}

interface ReqRow { id: string; reference: string; name: string; initials: string; role: string; category: string; detail: string; priority: string; status: string; owner: string; age: string; sla: string; isOperational: boolean }
interface QueueResponse { data: ReqRow[]; kpis: { open: number; pastSla: number; avgResolve: string }; catalogue: { id: string; name: string; slaDays: number }[]; canManage: boolean }

function RequestsQueue() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['requests'], queryFn: () => api.get<QueueResponse>('/requests') });
  const rows = data?.data ?? [];
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Every request carries a reference, an owner and an SLA"
        title="HR requests"
        kpis={data ? [{ value: data.kpis.open, label: 'Open requests' }, { value: data.kpis.pastSla, label: 'Past SLA' }, { value: data.kpis.avgResolve, label: 'Avg days to resolve' }] : undefined}
        actions={<>
          <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport('/requests?export=csv', 'requests.csv')}>CSV</button>
          <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport('/requests?export=pdf', 'requests.pdf')}>PDF</button>
        </>}
      />
      <div className="flex items-start gap-4 flex-wrap">
        <div className="card" style={{ flex: '1 1 460px', minWidth: 320, padding: 20 }}>
          {isLoading ? <SkeletonRows rows={6} /> : isError ? <ErrorState message="Could not load requests." onRetry={() => refetch()} /> : rows.length === 0 ? (
            <EmptyState title="No requests" message="Employee requests routed to HR will appear here." />
          ) : (
            <div className="flex flex-col gap-0.5">
              {rows.map((r) => {
                const active = r.id === selected?.id;
                return (
                  <button key={r.id} onClick={() => setSelectedId(r.id)} className="flex items-center gap-3.5 flex-wrap text-left w-full" style={{ padding: '14px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', background: active ? 'rgba(28,27,24,.07)' : 'transparent' }}>
                    <Avatar initials={r.initials} tone={active ? 'accent' : 'muted'} />
                    <span className="flex-1" style={{ minWidth: 160 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{r.category}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{r.reference} · {r.name}</span>
                    </span>
                    <Pill tone={r.priority === 'HIGH' ? 'accent' : 'neutral'}>{label(r.priority)}</Pill>
                    <span className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)', minWidth: 40 }}>{r.age}</span>
                    <Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>{label(r.status)}</Pill>
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
                  <div style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.2 }}>{selected.category}</div>
                  <div style={{ fontSize: 15, color: 'rgba(247,243,230,.82)', marginTop: 4 }}>{selected.name} · {selected.role}</div>
                </div>
                <Pill tone={STATUS_TONE[selected.status] ?? 'neutral'}>{label(selected.status)}</Pill>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(247,243,230,.88)', margin: '20px 0 18px' }}>{selected.detail}</div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(247,243,230,.16)' }}>
                <DarkFact label="Priority" value={label(selected.priority)} />
                <DarkFact label="Age / SLA" value={`${selected.age} / ${selected.sla}`} />
                <DarkFact label="Owner" value={selected.owner} />
              </div>
              {data?.canManage && selected.status !== 'RESOLVED' && (
                <div className="flex gap-2.5 flex-wrap" style={{ marginTop: 22 }}>
                  <button className="btn-accent inline-flex items-center gap-2" style={{ padding: '12px 22px', fontSize: 15 }} disabled={update.isPending} onClick={() => update.mutate({ id: selected.id, status: 'RESOLVED' })}>
                    {update.isPending && <Spinner size={15} />} Resolve &amp; notify
                  </button>
                  <button className="btn-ghost-dark" style={{ padding: '12px 22px', fontSize: 15 }} onClick={() => update.mutate({ id: selected.id, status: 'AWAITING_EMPLOYEE' })}>Await employee</button>
                </div>
              )}
            </div>
          )}
          <div className="card">
            <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Request catalogue</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-3)' }}>SLA</span>
            </div>
            <div className="flex flex-col">
              {data?.catalogue.map((c) => (
                <div key={c.id} className="flex justify-between gap-3" style={{ padding: '11px 0', borderTop: '1px dashed rgba(28,27,24,.16)', fontSize: 15 }}>
                  <span style={{ color: 'var(--color-ink)' }}>{c.name}</span><span className="tnum" style={{ color: 'var(--color-muted-2)' }}>{c.slaDays} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkFact({ label: l, value }: { label: string; value: string }) {
  return <div><div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(247,243,230,.78)' }}>{l}</div><div style={{ fontSize: 17, marginTop: 4 }}>{value}</div></div>;
}

interface SelfResponse { mine: { id: string; reference: string; category: string; detail: string; status: string; meta: string }[]; catalogue: { id: string; name: string; slaDays: number }[] }
function SelfRequests() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['requests-self'], queryFn: () => api.get<SelfResponse>('/requests/self') });
  const [open, setOpen] = useState(false);
  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader eyebrow="My requests" title="HR requests" actions={<button className="btn-accent" style={{ padding: '11px 20px', fontSize: 15 }} onClick={() => setOpen(true)}>New request</button>} />
      {isLoading ? <div className="card"><SkeletonRows rows={4} /></div> : isError ? <div className="card"><ErrorState message="Could not load your requests." onRetry={() => refetch()} /></div> : (
        <div className="flex items-start gap-4 flex-wrap">
          <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
            <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 14 }}>What I have raised</div>
            {data && data.mine.length === 0 ? <EmptyState title="No requests yet" message="Raise a request and HR will assign an officer with a response time." /> : (
              <div className="flex flex-col">
                {data?.mine.map((r) => (
                  <div key={r.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                    <span className="flex-1" style={{ minWidth: 180 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{r.category}</span>
                      <span style={{ display: 'block', fontSize: 14, color: 'var(--color-muted-2)', marginTop: 3 }}>{r.detail}</span>
                      <span className="tnum" style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{r.reference} · {r.meta}</span>
                    </span>
                    <Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>{label(r.status)}</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-ink" style={{ flex: '1 1 300px', minWidth: 280, padding: 26 }}>
            <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 8 }}>Raise a request</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(247,243,230,.88)' }}>Pick a category and HR assigns an officer with a response time. Track progress here.</div>
            <div className="flex flex-col" style={{ marginTop: 18 }}>
              {data?.catalogue.map((c) => (
                <div key={c.id} className="flex justify-between gap-3" style={{ padding: '11px 0', borderTop: '1px solid rgba(247,243,230,.16)', fontSize: 15 }}>
                  <span>{c.name}</span><span className="tnum" style={{ color: 'rgba(247,243,230,.82)' }}>{c.slaDays} days</span>
                </div>
              ))}
            </div>
            <button className="btn-accent" style={{ width: '100%', marginTop: 20, padding: '14px 22px', fontSize: 16 }} onClick={() => setOpen(true)}>New request</button>
          </div>
        </div>
      )}
      {open && <NewRequestModal catalogue={data?.catalogue ?? []} onClose={() => setOpen(false)} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['requests-self'] }); }} />}
    </div>
  );
}

function NewRequestModal({ catalogue, onClose, onDone }: { catalogue: SelfResponse['catalogue']; onClose: () => void; onDone: () => void }) {
  const [requestTypeId, setType] = useState(catalogue[0]?.id ?? '');
  const [detail, setDetail] = useState('');
  const create = useMutation({ mutationFn: () => api.post('/requests', { requestTypeId, detail }), onSuccess: onDone });
  return (
    <Modal open onClose={onClose} title="New HR request">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
        <div><label className="field-label">Category</label><select className="field" value={requestTypeId} onChange={(e) => setType(e.target.value)}>{catalogue.map((c) => <option key={c.id} value={c.id}>{c.name} — SLA {c.slaDays}d</option>)}</select></div>
        <div><label className="field-label">Details</label><textarea className="field" style={{ minHeight: 90, resize: 'vertical' }} value={detail} onChange={(e) => setDetail(e.target.value)} required /></div>
        {create.isError && <div role="alert" style={{ background: 'rgba(180,85,63,.1)', color: 'var(--color-critical-ink)', borderRadius: 14, padding: '11px 16px', fontSize: 14 }}>{create.error instanceof ApiError ? create.error.message : 'Could not submit.'}</div>}
        <button className="btn-accent inline-flex items-center justify-center gap-2" style={{ padding: '14px 22px', fontSize: 16 }} disabled={create.isPending}>{create.isPending && <Spinner size={16} />} Submit request</button>
      </form>
    </Modal>
  );
}
