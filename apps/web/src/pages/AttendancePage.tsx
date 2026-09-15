import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, downloadExport } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows } from '@/components/ui/primitives';
import { Pager } from '@/pages/AuditPage';

interface AttRow { id: string; name: string; initials: string; role: string; isOperational: boolean; status: string; checkIn: string | null; checkOut: string | null }
interface AttResponse extends Paged<AttRow> { date: string; summary: Record<string, number> }

const STATUS_TONE: Record<string, 'success' | 'accent' | 'critical' | 'neutral'> = {
  ON_DUTY: 'success', ON_LEAVE: 'accent', ABSENT: 'critical', UNEXPLAINED: 'critical', REST_DAY: 'neutral',
};
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const q = useQuery({
    queryKey: ['attendance', date, page, status],
    queryFn: () => api.get<AttResponse>(`/attendance?date=${date}&page=${page}&pageSize=20${status !== 'all' ? `&status=${status}` : ''}`),
    placeholderData: keepPreviousData,
  });
  const d = q.data;
  const total = d ? Object.values(d.summary).reduce((a, b) => a + b, 0) : 0;
  const onDuty = d?.summary.ON_DUTY ?? 0;

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Drivers are counted against their assigned shift, not 08:00"
        title="Attendance"
        kpis={d ? [{ value: `${total ? Math.round((onDuty / total) * 100) : 0}%`, label: 'On duty' }, { value: d.summary.ON_LEAVE ?? 0, label: 'On leave' }, { value: (d.summary.UNEXPLAINED ?? 0) + (d.summary.ABSENT ?? 0), label: 'Absent / unexplained' }] : undefined}
        actions={<>
          <input className="field" style={{ maxWidth: 170 }} type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
          <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport(`/attendance?date=${date}&export=csv`, 'attendance.csv')}>CSV</button>
        </>}
      />
      <div className="card">
        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 16 }}>
          {['all', 'ON_DUTY', 'ON_LEAVE', 'UNEXPLAINED'].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{ border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14, padding: '9px 16px', borderRadius: 999, background: status === s ? 'var(--color-ink)' : 'rgba(28,27,24,.06)', color: status === s ? 'var(--color-cream)' : 'var(--color-muted-2)' }}>{s === 'all' ? 'All' : label(s)}</button>
          ))}
        </div>
        {q.isLoading ? <SkeletonRows rows={6} /> : q.isError ? <ErrorState message="Could not load attendance." onRetry={() => q.refetch()} /> : d && d.data.length === 0 ? (
          <EmptyState title="No attendance recorded" message="No records for this date and filter." />
        ) : (
          <div className="flex flex-col">
            {d?.data.map((r) => (
              <div key={r.id} className="flex items-center gap-3.5" style={{ padding: '13px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
                <Avatar initials={r.initials} />
                <span className="flex-1" style={{ minWidth: 180 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>{r.name}</span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{r.role}</span>
                </span>
                {r.checkIn && <span className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)' }}>in {r.checkIn}</span>}
                <Pill tone={STATUS_TONE[r.status] ?? 'neutral'}>{label(r.status)}</Pill>
              </div>
            ))}
          </div>
        )}
        {d && d.pagination.totalPages > 1 && <Pager page={d.pagination.page} totalPages={d.pagination.totalPages} onPage={setPage} />}
      </div>
    </div>
  );
}
