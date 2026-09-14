import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, downloadExport, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, EmptyState, ErrorState, Pill, RestrictedState, SkeletonRows, Spinner } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/Modal';

interface PayInput { id: string; name: string; initials: string; role: string; item: string; basis: string; state: string; amount: string; isDeduction: boolean }
interface PayrollResponse {
  period: { id: string; label: string; status: string; cutoffDate: string } | null;
  inputs: PayInput[];
  kpis: { employeesOnRun: number; pending: number; cutoff: string };
  handover: { label: string; value: string }[];
}
const STATE_TONE: Record<string, 'success' | 'accent' | 'critical' | 'ink' | 'neutral'> = {
  APPROVED: 'success', PENDING_HR: 'accent', BLOCKED: 'critical', LOCKED: 'ink',
};
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function PayrollPage() {
  const qc = useQueryClient();
  const [confirmLock, setConfirmLock] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['payroll'], queryFn: () => api.get<PayrollResponse>('/payroll') });

  const approve = useMutation({ mutationFn: (id: string) => api.post(`/payroll/inputs/${id}/approve`), onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }) });
  const lock = useMutation({ mutationFn: (id: string) => api.post(`/payroll/periods/${id}/lock`), onSuccess: () => { setConfirmLock(false); qc.invalidateQueries({ queryKey: ['payroll'] }); } });

  if (isError && error instanceof ApiError && error.status === 403) {
    return (
      <div style={{ paddingTop: 14 }}>
        <PageHeader eyebrow="Restricted module" title="Payroll inputs" />
        <RestrictedState title="Compensation data is restricted" message="Payroll inputs are limited to the HR Administrator and Finance. Access requests are recorded in the audit trail with the requesting user, time and record affected." />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader
        eyebrow="HR approves the inputs · Finance runs the payroll"
        title="Payroll inputs"
        kpis={data?.period ? [{ value: data.kpis.employeesOnRun, label: 'Employees on run' }, { value: data.kpis.pending, label: 'Inputs pending approval' }, { value: new Date(data.kpis.cutoff).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), label: 'Cut-off to Finance' }] : undefined}
        actions={data?.period && <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => downloadExport('/payroll?export=csv', 'payroll-inputs.csv')}>CSV</button>}
      />

      {isError ? <ErrorState message="Could not load payroll." onRetry={() => refetch()} /> : !data?.period && !isLoading ? (
        <EmptyState title="No open payroll period" message="Create a payroll period to begin recording approved inputs for the month." />
      ) : (
        <>
          <div className="card">
            <div className="flex items-baseline justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>{data?.period?.label} inputs{data?.period?.status === 'LOCKED' ? ' · locked' : ''}</span>
              <span style={{ fontSize: 14, color: 'var(--color-muted-3)' }}>Restricted — HR Administrator and Finance only</span>
            </div>
            {isLoading ? <SkeletonRows rows={6} /> : data && data.inputs.length === 0 ? (
              <EmptyState title="No inputs yet" message="Approved allowances, overtime, unpaid days and deductions will be listed here." />
            ) : (
              <div className="flex flex-col">
                {data?.inputs.map((i) => (
                  <div key={i.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
                    <Avatar initials={i.initials} />
                    <span className="flex-1" style={{ minWidth: 200 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--color-ink)' }}>{i.item}</span>
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>{i.name} · {i.basis}</span>
                    </span>
                    <span className="tnum" style={{ fontSize: 15, fontWeight: 500, minWidth: 130, textAlign: 'right', color: i.isDeduction ? 'var(--color-critical-ink)' : 'var(--color-ink)' }}>{i.amount}</span>
                    <Pill tone={STATE_TONE[i.state] ?? 'neutral'}>{label(i.state)}</Pill>
                    {i.state === 'PENDING_HR' && data?.period?.status !== 'LOCKED' && (
                      <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} disabled={approve.isPending} onClick={() => approve.mutate(i.id)}>Approve</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-4 flex-wrap" style={{ marginTop: 18 }}>
            <div className="card-ink" style={{ flex: '1 1 340px', minWidth: 300, padding: 26 }}>
              <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 14 }}>Handover to Finance</div>
              <div className="flex flex-col">
                {data?.handover.map((h, idx) => (
                  <div key={idx} className="flex justify-between gap-3" style={{ padding: '12px 0', borderTop: '1px solid rgba(247,243,230,.16)', fontSize: 15 }}>
                    <span style={{ color: 'rgba(247,243,230,.88)' }}>{h.label}</span><span className="tnum">{h.value}</span>
                  </div>
                ))}
              </div>
              {data?.period?.status === 'LOCKED' ? (
                <Pill tone="accent">Locked &amp; sent to Finance</Pill>
              ) : (
                <button className="btn-accent" style={{ width: '100%', marginTop: 20, padding: '14px 22px', fontSize: 16 }} onClick={() => setConfirmLock(true)}>Lock and send to Finance</button>
              )}
              <div style={{ fontSize: 13, color: 'rgba(247,243,230,.78)', marginTop: 12, lineHeight: 1.5 }}>Locking writes an immutable audit entry. Changes after cut-off carry to the next run.</div>
            </div>
            <div className="card" style={{ flex: '1 1 380px', minWidth: 300 }}>
              <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 8 }}>What this module is not</div>
              <div style={{ fontSize: 15, color: 'var(--color-muted-2)', lineHeight: 1.65 }}>This is the HR input layer, not a payroll engine. It records what HR has approved — allowances, overtime, unpaid days, deductions and effective dates — and hands Finance a clean, signed-off set of figures. Tax, RSSB contributions and payslip generation stay in the Finance system.</div>
              <div style={{ fontSize: 15, color: 'var(--color-muted-2)', lineHeight: 1.65, marginTop: 14, paddingTop: 14, borderTop: '1px dashed rgba(28,27,24,.16)' }}>Every row here traces back to an approved record: a leave decision, an HR request, or a contract change.</div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmLock}
        title="Lock payroll and send to Finance?"
        message={<>This locks <strong>{data?.period?.label}</strong> payroll inputs and writes an immutable audit entry. Approved inputs can no longer be edited. This cannot be undone.</>}
        confirmLabel="Lock and send"
        tone="accent"
        busy={lock.isPending}
        onConfirm={() => data?.period && lock.mutate(data.period.id)}
        onCancel={() => setConfirmLock(false)}
      />
    </div>
  );
}
