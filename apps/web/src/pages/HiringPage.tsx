import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows, Spinner } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';

interface HiringData {
  kpis: { openPositions: number; inPipeline: number; offersOut: number };
  openings: { id: string; title: string; dept: string; numberOfPositions: number; stage: string; isOperational: boolean; candidates: number; since: string }[];
  funnel: { stage: string; n: number }[];
  candidates: { id: string; name: string; initials: string; role: string; stage: string; note: string | null; isOperational: boolean; hasOffer: boolean }[];
  driverGate: string[];
}

const STAGE_LABEL = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function HiringPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hiring'], queryFn: () => api.get<HiringData>('/hiring') });
  const aggregate = user?.role === 'SENIOR_MANAGEMENT';

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow={aggregate ? 'Recruitment status · aggregate' : 'Job request → opening → candidates → interview → offer → hired'}
        title="Hiring"
        kpis={data ? [
          { value: data.kpis.openPositions, label: 'Open positions' },
          { value: data.kpis.inPipeline, label: 'Candidates in pipeline' },
          { value: data.kpis.offersOut, label: 'Offers out' },
        ] : undefined}
      />

      {isError ? (
        <ErrorState message="Could not load hiring data." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="card" style={{ flex: '1 1 460px', minWidth: 320 }}>
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 16 }}>Open positions</div>
              {isLoading ? <SkeletonRows rows={4} /> : data && data.openings.length === 0 ? (
                <EmptyState title="No open positions" message="Approved job requests and their openings will appear here." />
              ) : (
                <div className="flex flex-col">
                  {data?.openings.map((o) => (
                    <div key={o.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                      <span className="flex-1" style={{ minWidth: 180 }}>
                        <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{o.title}{o.isOperational && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}> · operational</span>}</span>
                        <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{o.dept} · {o.numberOfPositions} vacancy{o.numberOfPositions > 1 ? 's' : ''}</span>
                      </span>
                      <span className="tnum" style={{ fontSize: 15, color: 'var(--color-muted-2)', minWidth: 100 }}>{o.candidates} candidates</span>
                      <Pill tone={o.stage === 'OFFER_OUT' ? 'accent' : 'neutral'}>{STAGE_LABEL(o.stage)}</Pill>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ flex: '1 1 340px', minWidth: 300 }}>
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 16 }}>Pipeline</div>
              {isLoading ? <SkeletonRows rows={5} /> : (
                <div className="flex flex-col gap-3.5">
                  {data?.funnel.map((f, i) => {
                    const max = Math.max(...(data?.funnel.map((x) => x.n) ?? [1]), 1);
                    return (
                      <div key={f.stage} className="flex items-center gap-3.5">
                        <span style={{ fontSize: 14, color: 'var(--color-ink)', minWidth: 150 }}>{STAGE_LABEL(f.stage)}</span>
                        <span className="flex-1" style={{ height: 14, borderRadius: 999, background: 'rgba(28,27,24,.1)', overflow: 'hidden', display: 'block' }}>
                          <span style={{ display: 'block', height: '100%', width: `${(f.n / max) * 100}%`, borderRadius: 999, background: i === (data!.funnel.length - 1) ? 'var(--color-ink)' : 'var(--color-accent)' }} />
                        </span>
                        <span className="tnum" style={{ fontSize: 15, color: 'var(--color-ink)', minWidth: 30, textAlign: 'right' }}>{f.n}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 flex-wrap" style={{ marginTop: 18 }}>
            {!aggregate && (
              <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
                <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 14 }}>Candidates in progress</div>
                {isLoading ? <SkeletonRows rows={4} /> : data && data.candidates.length === 0 ? (
                  <EmptyState title="No active candidates" message="Candidates being screened, interviewed or assessed will appear here." />
                ) : (
                  <div className="flex flex-col">
                    {data?.candidates.map((c) => (
                      <button key={c.id} onClick={() => setSelected(c.id)} className="flex items-center gap-3.5 flex-wrap text-left" style={{ padding: '14px 6px', borderTop: '1px dashed rgba(28,27,24,.16)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>
                        <Avatar initials={c.initials} />
                        <span className="flex-1" style={{ minWidth: 170 }}>
                          <span style={{ display: 'block', fontSize: 16, color: 'var(--color-ink)' }}>{c.name}</span>
                          <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{c.role}{c.note ? ` · ${c.note}` : ''}</span>
                        </span>
                        <Pill tone={c.stage === 'OFFER_OUT' ? 'accent' : 'neutral'}>{STAGE_LABEL(c.stage)}</Pill>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="card-ink" style={{ flex: '1 1 300px', minWidth: 280, padding: 26 }}>
              <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 6 }}>Driver hiring gate</div>
              <div style={{ fontSize: 14, color: 'rgba(247,243,230,.82)', marginBottom: 12, lineHeight: 1.5 }}>No offer is issued to an operational candidate until all five are cleared.</div>
              <div className="flex flex-col">
                {data?.driverGate.map((g, i) => (
                  <div key={i} className="flex items-start gap-3" style={{ padding: '12px 0', borderTop: '1px solid rgba(247,243,230,.16)', fontSize: 15, lineHeight: 1.45 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--color-accent)', flexShrink: 0, marginTop: 8 }} />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {selected && <CandidateModal id={selected} canManage={user?.modules.includes('hiring') && (user.role === 'HR_ADMINISTRATOR' || user.role === 'HR_OFFICER')} onClose={() => setSelected(null)} />}
    </div>
  );
}

interface CandidateDetail {
  id: string; name: string; role: string; stage: string; isOperational: boolean; gateComplete: boolean;
  offer: { status: string } | null;
  gate: { key: string; label: string; cleared: boolean }[];
}

function CandidateModal({ id, canManage, onClose }: { id: string; canManage?: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['candidate', id], queryFn: () => api.get<CandidateDetail>(`/hiring/candidates/${id}`) });
  const [offerError, setOfferError] = useState<{ message: string; missing?: { label: string }[] } | null>(null);

  const toggleGate = useMutation({
    mutationFn: ({ key, cleared }: { key: string; cleared: boolean }) => api.put(`/hiring/candidates/${id}/gate/${key}`, { cleared }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidate', id] }),
  });
  const issueOffer = useMutation({
    mutationFn: () => api.post(`/hiring/candidates/${id}/offer`, {}),
    onSuccess: () => { setOfferError(null); qc.invalidateQueries({ queryKey: ['candidate', id] }); qc.invalidateQueries({ queryKey: ['hiring'] }); },
    onError: (e) => {
      if (e instanceof ApiError) setOfferError({ message: e.message, missing: (e.details as { missing?: { label: string }[] })?.missing });
    },
  });

  return (
    <Modal open onClose={onClose} title={data?.name ?? 'Candidate'} subtitle={data ? `${data.role} · ${STAGE_LABEL(data.stage)}` : undefined}>
      {isLoading ? <SkeletonRows rows={4} /> : isError || !data ? <ErrorState message="Could not load candidate." /> : (
        <div className="flex flex-col gap-4">
          {data.isOperational ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>Driver hiring gate</div>
              <div className="flex flex-col gap-2">
                {data.gate.map((g) => (
                  <label key={g.key} className="flex items-start gap-3" style={{ padding: '10px 12px', borderRadius: 12, background: g.cleared ? 'rgba(47,93,58,.1)' : 'rgba(28,27,24,.04)', cursor: canManage ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={g.cleared} disabled={!canManage || toggleGate.isPending} onChange={(e) => toggleGate.mutate({ key: g.key, cleared: e.target.checked })} style={{ marginTop: 3 }} />
                    <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>{g.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--color-muted-2)' }}>This is a non-operational role — the driver hiring gate does not apply.</div>
          )}

          {data.offer ? (
            <Pill tone="success">Offer {data.offer.status.toLowerCase()}</Pill>
          ) : canManage ? (
            <div>
              <button
                className="btn-accent inline-flex items-center gap-2"
                style={{ padding: '12px 22px', fontSize: 15, opacity: data.isOperational && !data.gateComplete ? 0.5 : 1 }}
                disabled={issueOffer.isPending}
                onClick={() => issueOffer.mutate()}
              >
                {issueOffer.isPending && <Spinner size={15} />} Issue offer
              </button>
              {data.isOperational && !data.gateComplete && (
                <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 8 }}>All five gate checks must be cleared before an offer can be issued.</div>
              )}
              {offerError && (
                <div role="alert" style={{ marginTop: 12, background: 'rgba(180,85,63,.1)', color: 'var(--color-critical-ink)', borderRadius: 14, padding: '12px 16px', fontSize: 14 }}>
                  <div style={{ fontWeight: 500 }}>{offerError.message}</div>
                  {offerError.missing && <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{offerError.missing.map((m, i) => <li key={i}>{m.label}</li>)}</ul>}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
