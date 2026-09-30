import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, downloadExport } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, Pill, SkeletonRows } from '@/components/ui/primitives';

interface AuditRow {
  id: string;
  actorName: string;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT', 'LOCK', 'ACCESS_DENIED'];
const ACTION_TONE: Record<string, 'ink' | 'accent' | 'neutral' | 'success' | 'critical'> = {
  ACCESS_DENIED: 'critical', DELETE: 'critical', REJECT: 'critical',
  APPROVE: 'success', CREATE: 'success', LOGIN: 'neutral', READ: 'accent', LOCK: 'ink',
};

export function AuditPage() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['audit', q, action, page],
    queryFn: () => api.get<Paged<AuditRow>>(`/audit?page=${page}&pageSize=25${q ? `&q=${encodeURIComponent(q)}` : ''}${action !== 'all' ? `&action=${action}` : ''}`),
    placeholderData: keepPreviousData,
  });

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Append-only · every sensitive read and write is recorded"
        title="Audit trail"
        kpis={query.data ? [{ value: query.data.pagination.total.toLocaleString(), label: 'Recorded events' }] : undefined}
        actions={
          <>
            <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport(`/audit?export=csv${action !== 'all' ? `&action=${action}` : ''}`, 'audit-log.csv')}>CSV</button>
            <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport(`/audit?export=pdf${action !== 'all' ? `&action=${action}` : ''}`, 'audit-log.pdf')}>PDF</button>
          </>
        }
      />

      <div className="card">
        <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 16 }}>
          <input className="field" style={{ maxWidth: 320 }} placeholder="Search actor, summary, entity…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className="field" style={{ maxWidth: 200 }} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="all">All actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {query.isLoading ? (
          <SkeletonRows rows={8} />
        ) : query.isError ? (
          <ErrorState message="Could not load the audit trail." onRetry={() => query.refetch()} />
        ) : query.data && query.data.data.length === 0 ? (
          <EmptyState title="No matching events" message="Adjust the filters to see recorded activity." />
        ) : (
          <div className="flex flex-col">
            {query.data?.data.map((r) => (
              <div key={r.id} className="flex items-center gap-4 flex-wrap" style={{ padding: '13px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
                <span className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)', minWidth: 148 }}>{new Date(r.createdAt).toLocaleString('en-GB')}</span>
                <Pill tone={ACTION_TONE[r.action] ?? 'neutral'}>{r.action}</Pill>
                <span className="flex-1" style={{ minWidth: 200 }}>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--color-ink)' }}>{r.summary}</span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{r.actorName}{r.actorRole ? ` · ${r.actorRole}` : ''} · {r.entityType}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {query.data && query.data.pagination.totalPages > 1 && (
          <Pager page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} onPage={setPage} />
        )}
      </div>
    </div>
  );
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3" style={{ marginTop: 18 }}>
      <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="tnum" style={{ fontSize: 14, color: 'var(--color-muted)' }}>Page {page} of {totalPages}</span>
      <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
