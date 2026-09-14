import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, Pill, SkeletonRows, Spinner } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';

type Tab = 'settings' | 'policies' | 'reference' | 'users';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('settings');
  return (
    <div style={{ paddingTop: 14 }}>
      <PageHeader eyebrow="Everything below is configurable — no policy is hard-coded" title="Admin & configuration" />
      <div className="flex gap-1.5 flex-wrap" style={{ padding: '0 4px 18px' }}>
        {([['settings', 'System settings'], ['policies', 'Leave, SLAs & reminders'], ['reference', 'Reference data'], ['users', 'Users & access']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14, padding: '9px 18px', borderRadius: 999, background: tab === t ? 'var(--color-ink)' : 'rgba(28,27,24,.06)', color: tab === t ? 'var(--color-cream)' : 'var(--color-muted-2)' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'settings' && <SystemSettings />}
      {tab === 'policies' && <PolicySettings />}
      {tab === 'reference' && <ReferenceData />}
      {tab === 'users' && <UsersAdmin />}
    </div>
  );
}

interface Setting { id: string; key: string; value: string; valueType: string; label: string; description: string | null; category: string }

function SystemSettings() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['settings-system'], queryFn: () => api.get<{ data: Setting[] }>('/settings/system') });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => api.put(`/settings/system/${key}`, { value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-system'] }); setEdits({}); },
  });

  if (isLoading) return <div className="card"><SkeletonRows rows={5} /></div>;
  if (isError) return <div className="card"><ErrorState message="Could not load settings." onRetry={() => refetch()} /></div>;

  const byCat = groupBy(data!.data, (s) => s.category);
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat} className="card">
          <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 16 }}>{cat}</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 18 }}>
            {items.map((s) => {
              const val = edits[s.key] ?? s.value;
              const dirty = edits[s.key] !== undefined && edits[s.key] !== s.value;
              return (
                <div key={s.key} style={{ borderBottom: '1px dashed rgba(28,27,24,.16)', paddingBottom: 14 }}>
                  <label className="field-label">{s.label}</label>
                  <div className="flex gap-2">
                    <input className="field" value={val} type={s.valueType === 'number' ? 'number' : 'text'} onChange={(e) => setEdits((p) => ({ ...p, [s.key]: e.target.value }))} />
                    {dirty && (
                      <button className="btn-accent" style={{ padding: '0 16px', fontSize: 14 }} disabled={save.isPending} onClick={() => save.mutate({ key: s.key, value: val })}>Save</button>
                    )}
                  </div>
                  {s.description && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 6 }}>{s.description}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PolicySettings() {
  return (
    <div className="flex flex-col gap-4">
      <CollectionEditor title="Leave types & entitlements" path="leave-types" columns={[{ key: 'name', label: 'Type' }, { key: 'entitlementLabel', label: 'Entitlement', editable: true }, { key: 'carryForwardMaxDays', label: 'Carry-forward', editable: true, type: 'number' }, { key: 'requiresCertificateAfterDays', label: 'Cert. after (days)', editable: true, type: 'number' }]} />
      <CollectionEditor title="Request types & SLAs" path="request-types" columns={[{ key: 'name', label: 'Request' }, { key: 'slaDays', label: 'SLA (days)', editable: true, type: 'number' }]} />
      <CollectionEditor title="Contract reminder windows" path="reminder-rules" columns={[{ key: 'kind', label: 'Kind' }, { key: 'offsetDays', label: 'Days before', editable: true, type: 'number' }, { key: 'action', label: 'Action', editable: true }]} />
      <CollectionEditor title="Training programmes & cycles" path="training-programmes" columns={[{ key: 'name', label: 'Programme' }, { key: 'category', label: 'Category' }, { key: 'cycleMonths', label: 'Cycle (months)', editable: true, type: 'number' }]} />
      <CollectionEditor title="Medical schemes & contribution split" path="medical-schemes" columns={[{ key: 'name', label: 'Scheme' }, { key: 'employeeContribPct', label: 'Employee %', editable: true, type: 'number' }, { key: 'employerContribPct', label: 'Employer %', editable: true, type: 'number' }]} />
    </div>
  );
}

function ReferenceData() {
  return (
    <div className="flex flex-col gap-4">
      <CollectionEditor title="Employment types" path="employment-types" columns={[{ key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }]} />
      <CollectionEditor title="Employee statuses" path="employee-statuses" columns={[{ key: 'name', label: 'Name' }, { key: 'countsAsActive', label: 'Counts active' }]} />
      <CollectionEditor title="Document types" path="document-types" columns={[{ key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'hasExpiry', label: 'Has expiry' }, { key: 'blocksRosterIfExpired', label: 'Blocks roster' }]} />
      <CollectionEditor title="Shifts" path="shifts" columns={[{ key: 'name', label: 'Name' }, { key: 'startTime', label: 'Start', editable: true }, { key: 'endTime', label: 'End', editable: true }]} />
    </div>
  );
}

interface Col { key: string; label: string; editable?: boolean; type?: 'text' | 'number' }
function CollectionEditor({ title, path, columns }: { title: string; path: string; columns: Col[] }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['collection', path], queryFn: () => api.get<{ data: Record<string, unknown>[] }>(`/settings/${path}`) });
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const save = useMutation({
    mutationFn: (row: Record<string, unknown>) => api.put(`/settings/${path}/${row.id}`, row),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collection', path] }); setEditing(null); },
  });

  return (
    <div className="card">
      <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 14 }}>{title}</div>
      {isLoading ? <SkeletonRows rows={3} /> : isError ? <ErrorState message="Could not load." onRetry={() => refetch()} /> : (
        <div className="flex flex-col">
          {data!.data.map((row) => (
            <div key={String(row.id)} className="flex items-center gap-4 flex-wrap" style={{ padding: '12px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
              {columns.map((c) => (
                <span key={c.key} className="flex flex-col" style={{ minWidth: 120 }}>
                  <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-muted-4)' }}>{c.label}</span>
                  <span style={{ fontSize: 15, color: 'var(--color-ink)' }}>{renderCell(row[c.key])}</span>
                </span>
              ))}
              <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
                {row.isActive === false && <Pill tone="muted">Inactive</Pill>}
                <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setEditing({ ...row })}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${title.toLowerCase()}`}>
        {editing && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => { e.preventDefault(); const payload: Record<string, unknown> = { id: editing.id }; for (const c of columns) if (c.editable) payload[c.key] = c.type === 'number' ? (editing[c.key] === '' || editing[c.key] === null ? null : Number(editing[c.key])) : editing[c.key]; save.mutate(payload); }}
          >
            {columns.filter((c) => c.editable).map((c) => (
              <div key={c.key}>
                <label className="field-label">{c.label}</label>
                <input className="field" type={c.type === 'number' ? 'number' : 'text'} value={String(editing[c.key] ?? '')} onChange={(e) => setEditing((p) => ({ ...p!, [c.key]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-accent inline-flex items-center justify-center gap-2" style={{ padding: '12px 22px', fontSize: 15 }} disabled={save.isPending}>
              {save.isPending && <Spinner size={15} />} Save changes
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

interface UserRow { id: string; email: string; role: string; fullName: string; isActive: boolean; lastLoginAt: string | null; employee?: { employeeCode: string; department: { name: string } } | null }
function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['users', q], queryFn: () => api.get<Paged<UserRow>>(`/users?pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ''}`) });
  const [resetFor, setResetFor] = useState<UserRow | null>(null);
  const [newPw, setNewPw] = useState('');
  const reset = useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => api.post(`/users/${id}/reset-password`, { password }), onSuccess: () => { setResetFor(null); setNewPw(''); } });
  const toggle = useMutation({ mutationFn: (u: UserRow) => api.put(`/users/${u.id}`, { isActive: !u.isActive }), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });

  return (
    <div className="card">
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 500 }}>User accounts</div>
        <input className="field" style={{ maxWidth: 280 }} placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? <SkeletonRows rows={5} /> : isError ? <ErrorState message="Could not load users." onRetry={() => refetch()} /> : data!.data.length === 0 ? <EmptyState title="No users found" message="Adjust your search." /> : (
        <div className="flex flex-col">
          {data!.data.map((u) => (
            <div key={u.id} className="flex items-center gap-4 flex-wrap" style={{ padding: '13px 0', borderBottom: '1px dashed rgba(28,27,24,.14)' }}>
              <span className="flex-1" style={{ minWidth: 200 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>{u.fullName}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--color-muted)' }}>{u.email}{u.employee ? ` · ${u.employee.employeeCode}` : ''}</span>
              </span>
              <Pill tone="neutral">{u.role.replace('_', ' ').toLowerCase()}</Pill>
              <Pill tone={u.isActive ? 'success' : 'critical'}>{u.isActive ? 'Active' : 'Disabled'}</Pill>
              <div className="flex gap-2">
                <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setResetFor(u)}>Reset password</button>
                <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => toggle.mutate(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title="Reset password" subtitle={resetFor?.email}>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (resetFor) reset.mutate({ id: resetFor.id, password: newPw }); }}>
          <div>
            <label className="field-label">New password (min 8 characters)</label>
            <input className="field" type="text" minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>The user's active sessions will be signed out.</div>
          <button className="btn-accent inline-flex items-center justify-center gap-2" style={{ padding: '12px 22px', fontSize: 15 }} disabled={reset.isPending || newPw.length < 8}>
            {reset.isPending && <Spinner size={15} />} Reset password
          </button>
        </form>
      </Modal>
    </div>
  );
}

function renderCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}
function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => { const k = key(item); (acc[k] ??= []).push(item); return acc; }, {} as Record<string, T[]>);
}
