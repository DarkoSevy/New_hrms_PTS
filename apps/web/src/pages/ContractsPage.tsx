import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, downloadExport } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows } from '@/components/ui/primitives';
import { Pager } from '@/pages/AuditPage';

interface ContractRow {
  id: string; name: string; initials: string; role: string; kind: string; period: string;
  signedCopyOnFile: boolean; version: number; event: string; band: 'ok' | 'warn' | 'critical'; eventKind: string;
}
interface ContractsResponse extends Paged<ContractRow> {
  kpis: { expiring60: number; probationDue: number; missingSigned: number; fixedTerm: number };
  reminderRules: { id: string; kind: string; offsetDays: number; action: string; notifyRoles: string[] }[];
}

const BAND_TONE: Record<string, 'critical' | 'accent' | 'neutral'> = { critical: 'critical', warn: 'accent', ok: 'neutral' };

export function ContractsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['contracts', page, q],
    queryFn: () => api.get<ContractsResponse>(`/contracts?page=${page}&pageSize=15${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    placeholderData: keepPreviousData,
  });
  const d = query.data;

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Reminders fire at 60, 30 and 7 days before expiry"
        title="Contracts"
        kpis={d ? [
          { value: d.kpis.expiring60, label: 'Contracts expiring, 60 days' },
          { value: d.kpis.probationDue, label: 'Probation reviews due' },
          { value: d.kpis.missingSigned, label: 'Missing signed copy' },
          { value: d.kpis.fixedTerm, label: 'Fixed-term staff' },
        ] : undefined}
        actions={
          <>
            <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport('/contracts?export=csv', 'contracts.csv')}>CSV</button>
            <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport('/contracts?export=pdf', 'contracts.pdf')}>PDF</button>
          </>
        }
      />

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Contract register</span>
          <input className="field" style={{ maxWidth: 280 }} placeholder="Search employee…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {query.isLoading ? (
          <SkeletonRows rows={6} />
        ) : query.isError ? (
          <ErrorState message="Could not load contracts." onRetry={() => query.refetch()} />
        ) : d && d.data.length === 0 ? (
          <EmptyState title="No contracts found" message="Recorded contracts and their renewal status will appear here." />
        ) : (
          <div className="flex flex-col">
            {d?.data.map((c) => (
              <div key={c.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                <Avatar initials={c.initials} />
                <span className="flex-1" style={{ minWidth: 180 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{c.role}</span>
                </span>
                <span style={{ minWidth: 180 }}>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--color-ink)' }}>{c.kind.replace('_', '-').toLowerCase()}</span>
                  <span className="tnum" style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{c.period}</span>
                </span>
                <Pill tone={BAND_TONE[c.band]}>{c.event}</Pill>
                <span style={{ fontSize: 13, color: c.signedCopyOnFile ? 'var(--color-muted)' : 'var(--color-critical-ink)', minWidth: 130, textAlign: 'right' }}>
                  {c.signedCopyOnFile ? `Signed · v${c.version}` : 'Missing signed copy'}
                </span>
              </div>
            ))}
          </div>
        )}
        {d && d.pagination.totalPages > 1 && <Pager page={d.pagination.page} totalPages={d.pagination.totalPages} onPage={setPage} />}
      </div>

      <div className="flex items-start gap-4 flex-wrap" style={{ marginTop: 18 }}>
        <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
          <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>Reminder rules</div>
          <div style={{ fontSize: 14, color: 'var(--color-muted-3)', marginBottom: 8 }}>Configurable per contract type in Admin</div>
          <div className="flex flex-col">
            {d?.reminderRules.map((r) => (
              <div key={r.id} className="flex items-start gap-3.5" style={{ padding: '13px 0', borderTop: '1px dashed rgba(28,27,24,.16)' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)', minWidth: 170 }}>
                  {r.offsetDays} days before {r.kind === 'PROBATION_END' ? 'probation end' : 'expiry'}
                </span>
                <span className="flex-1">
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--color-ink)' }}>{r.action}</span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>Notifies {r.notifyRoles.map((x) => x.replace('_', ' ').toLowerCase()).join(', ')}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-ink" style={{ flex: '1 1 300px', minWidth: 280, padding: 26 }}>
          <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 8 }}>Why contracts matter here</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(247,243,230,.88)' }}>
            A lapsed contract means the employee cannot legally be rostered — so Operations can lose a chauffeur at short notice. Under Rwandan employment law the signed contract is the document that matters in a dispute.
          </div>
        </div>
      </div>
    </div>
  );
}
