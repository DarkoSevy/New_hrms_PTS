import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, SkeletonRows } from '@/components/ui/primitives';

interface SchedResponse {
  date: string;
  shifts: { id: string; name: string; startTime: string; endTime: string }[];
  assignments: { id: string; shiftId: string; shiftName: string; employee: { id: string; name: string; initials: string; isOperational: boolean }; rosterable: boolean; reasons: string[] }[];
}

export function SchedulesPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['schedules', date], queryFn: () => api.get<SchedResponse>(`/schedules?date=${date}`) });

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="Shift rosters · not-rosterable staff cannot be assigned"
        title="Work schedules"
        actions={<input className="field" style={{ maxWidth: 170 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
      />
      {isLoading ? <div className="card"><SkeletonRows rows={5} /></div> : isError ? <div className="card"><ErrorState message="Could not load schedules." onRetry={() => refetch()} /></div> : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {data?.shifts.map((s) => {
            const assigned = data.assignments.filter((a) => a.shiftId === s.id);
            return (
              <div key={s.id} className="card">
                <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>{s.name}</span>
                  <span className="tnum" style={{ fontSize: 14, color: 'var(--color-muted)' }}>{s.startTime}–{s.endTime}</span>
                </div>
                {assigned.length === 0 ? (
                  <EmptyState title="No one assigned" message="Assign rosterable staff to this shift for the selected day." />
                ) : (
                  <div className="flex flex-col">
                    {assigned.map((a) => (
                      <div key={a.id} className="flex items-center gap-3" style={{ padding: '11px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
                        <Avatar initials={a.employee.initials} size={34} />
                        <span className="flex-1" style={{ fontSize: 15, color: 'var(--color-ink)' }}>{a.employee.name}</span>
                        {a.employee.isOperational && !a.rosterable && <Pill tone="critical">Not rosterable</Pill>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
