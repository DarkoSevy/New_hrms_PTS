import { useQuery } from '@tanstack/react-query';
import { api, downloadExport } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState, SkeletonRows } from '@/components/ui/primitives';

interface ReportsResponse {
  summary: { headcount: number; onLeave: number; contractsExpiring: number; overdueTraining: number; openRequests: number };
  reports: { key: string; name: string; description: string; module: string }[];
}

// Maps a report key to its export endpoint.
const EXPORT_PATH: Record<string, string> = {
  employees: '/employees',
  contracts: '/contracts',
  leave: '/leave?filter=All',
  attendance: '/attendance',
  requests: '/requests',
  audit: '/audit',
  payroll: '/payroll',
};

export function ReportsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['reports'], queryFn: () => api.get<ReportsResponse>('/reports') });

  function runExport(key: string, fmt: 'csv' | 'pdf') {
    const base = EXPORT_PATH[key];
    const sep = base.includes('?') ? '&' : '?';
    downloadExport(`${base}${sep}export=${fmt}`, `${key}.${fmt}`);
  }

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Every list exports to CSV and PDF"
        title="Reports"
        kpis={data ? [
          { value: data.summary.headcount, label: 'Active employees' },
          { value: data.summary.onLeave, label: 'On leave today' },
          { value: data.summary.contractsExpiring, label: 'Contracts expiring' },
          { value: data.summary.overdueTraining, label: 'Overdue training' },
        ] : undefined}
      />
      {isLoading ? <div className="card"><SkeletonRows rows={5} /></div> : isError ? <div className="card"><ErrorState message="Could not load reports." onRetry={() => refetch()} /></div> : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {data?.reports.map((r) => (
            <div key={r.key} className="card flex flex-col" style={{ minHeight: 160 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-ink)' }}>{r.name}</div>
              <div style={{ fontSize: 14, color: 'var(--color-muted-3)', marginTop: 6, lineHeight: 1.5, flex: 1 }}>{r.description}</div>
              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button className="btn-ghost" style={{ padding: '9px 18px', fontSize: 14 }} onClick={() => runExport(r.key, 'csv')}>Export CSV</button>
                <button className="btn-accent" style={{ padding: '9px 18px', fontSize: 14 }} onClick={() => runExport(r.key, 'pdf')}>Export PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
