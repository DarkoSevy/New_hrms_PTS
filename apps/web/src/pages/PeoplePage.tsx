import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, downloadExport, ApiError } from '@/lib/api';
import { useAuth } from '@/auth/AuthContext';
import type { Paged } from '@/lib/types';
import { Avatar, EmptyState, ErrorState, Pill, RestrictedState, SkeletonLine, SkeletonRows, Spinner } from '@/components/ui/primitives';

interface EmployeeRow {
  id: string;
  employeeCode: string;
  fullName: string;
  initials: string;
  isOperational: boolean;
  department: { id: string; name: string };
  position: { id: string; title: string };
  status: { id: string; name: string };
  rosterEligibility?: { isRosterable: boolean; reasons: string[] } | null;
}

const SECTIONS = ['Employment', 'Personal', 'Professional', 'Medical insurance', 'Documents', 'Compensation'] as const;
type Section = (typeof SECTIONS)[number];

export function PeoplePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [section, setSection] = useState<Section>('Employment');

  const reference = useQuery({ queryKey: ['reference'], queryFn: () => api.get<{ departments: { id: string; name: string }[] }>('/reference') });

  const list = useQuery({
    queryKey: ['employees', q, deptFilter],
    queryFn: () => api.get<Paged<EmployeeRow> & { facets: unknown }>(`/employees?pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ''}${deptFilter !== 'all' ? `&departmentId=${deptFilter}` : ''}`),
  });

  const rows = list.data?.data ?? [];
  const selectedId = id ?? rows[0]?.id;

  // Keep the URL in sync with the first row when none is selected.
  useEffect(() => {
    if (!id && rows[0]?.id) navigate(`/people/${rows[0].id}`, { replace: true });
  }, [id, rows, navigate]);

  return (
    <div className="flex items-start gap-4 flex-wrap" style={{ paddingTop: 14 }}>
      {/* Directory */}
      <div className="card" style={{ flex: '1 1 300px', maxWidth: 360, minWidth: 280, padding: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)' }}>People</div>
          <div className="flex gap-1.5">
            <button title="Export CSV" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => downloadExport(`/employees?export=csv${deptFilter !== 'all' ? `&departmentId=${deptFilter}` : ''}`, 'employees.csv')}>CSV</button>
            <button title="Export PDF" className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => downloadExport(`/employees?export=pdf${deptFilter !== 'all' ? `&departmentId=${deptFilter}` : ''}`, 'employees.pdf')}>PDF</button>
          </div>
        </div>

        <input className="field" placeholder="Search name, ID, department…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />

        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 14 }}>
          <FilterChip active={deptFilter === 'all'} onClick={() => setDeptFilter('all')} label={`All ${list.data?.pagination.total ?? ''}`} />
          {reference.data?.departments.slice(0, 4).map((d) => (
            <FilterChip key={d.id} active={deptFilter === d.id} onClick={() => setDeptFilter(d.id)} label={d.name} />
          ))}
        </div>

        <div className="flex flex-col gap-1" style={{ maxHeight: 560, overflowY: 'auto' }}>
          {list.isLoading ? (
            <SkeletonRows rows={6} />
          ) : list.isError ? (
            <ErrorState message="Could not load the directory." onRetry={() => list.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState title="No matching people" message="Try a different search term or clear the department filter." />
          ) : (
            rows.map((e) => {
              const active = e.id === selectedId;
              return (
                <button
                  key={e.id}
                  onClick={() => navigate(`/people/${e.id}`)}
                  className="flex items-center gap-3 text-left w-full"
                  style={{ padding: '12px 14px', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', background: active ? 'var(--color-ink)' : 'transparent', color: active ? 'var(--color-cream)' : 'var(--color-ink)' }}
                >
                  <Avatar initials={e.initials} tone={active ? 'accent' : 'muted'} size={38} />
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span style={{ fontSize: 15, fontWeight: 500 }} className="truncate">{e.fullName}</span>
                    <span style={{ fontSize: 13, opacity: 0.6 }} className="truncate">{e.position.title} · {e.department.name}</span>
                  </span>
                  {e.isOperational && e.rosterEligibility && !e.rosterEligibility.isRosterable && (
                    <span title="Not rosterable" style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: 999, background: 'var(--color-critical)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Master record */}
      <div className="flex flex-col gap-4" style={{ flex: '999 1 480px', minWidth: 0 }}>
        {selectedId ? (
          <EmployeeRecord
            key={selectedId}
            id={selectedId}
            section={section}
            setSection={setSection}
            canViewCompensation={!!user?.canViewCompensation}
          />
        ) : (
          !list.isLoading && <div className="card"><EmptyState title="No one selected" message="Select an employee from the directory to view their record." /></div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 13, background: active ? 'var(--color-ink)' : 'rgba(28,27,24,.07)', color: active ? 'var(--color-cream)' : 'var(--color-muted-2)' }}>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Employee master record
// ---------------------------------------------------------------------------
interface EmployeeDetail {
  id: string;
  employeeCode: string;
  fullName: string;
  initials: string;
  isOperational: boolean;
  workLocation: string | null;
  hireDate: string;
  dateOfBirth: string | null;
  nationalId: string | null;
  nationality: string | null;
  phone: string | null;
  address: string | null;
  gender: string | null;
  operationalSupervisor: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  department: { name: string };
  position: { title: string; grade: string | null };
  status: { name: string };
  employmentType: { name: string };
  directManager: { fullName: string } | null;
  contracts: { id: string; kind: string; startDate: string; endDate: string | null; signedCopyOnFile: boolean; version: number }[];
  dependents: { id: string; name: string; relation: string; dateOfBirth: string | null; memberId: string | null; status: string }[];
  nextOfKin: { id: string; name: string; relation: string; phone: string | null; note: string | null }[];
  medicalEnrollment: { memberNumber: string | null; coverDescription: string | null; cardIssued: string | null; cardValidTo: string | null; enrolledSince: string | null; topUp: string | null; scheme: { name: string; employeeContribPct: number; employerContribPct: number } } | null;
  documents: { id: string; name: string; category: string; expiryDate: string | null; issueDate: string | null; version: number; isSensitive: boolean; restricted: boolean }[];
  rosterEligibility: { isRosterable: boolean; reasons: string[] } | null;
}

function fmt(dt: string | null | undefined) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EmployeeRecord({ id, section, setSection, canViewCompensation }: { id: string; section: Section; setSection: (s: Section) => void; canViewCompensation: boolean }) {
  const { data: emp, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get<EmployeeDetail>(`/employees/${id}`),
  });

  if (isLoading) {
    return (
      <>
        <div className="card-ink" style={{ padding: 28 }}><SkeletonLine w="40%" h={30} /></div>
        <div className="card"><SkeletonRows rows={5} /></div>
      </>
    );
  }
  if (isError) {
    const denied = error instanceof ApiError && error.status === 403;
    return <div className="card">{denied ? <RestrictedState title="Not permitted" message="You cannot view this employee record." /> : <ErrorState message="Could not load this record." onRetry={() => refetch()} />}</div>;
  }
  if (!emp) return null;

  const activeContract = emp.contracts[0];
  const notRosterable = emp.isOperational && emp.rosterEligibility && !emp.rosterEligibility.isRosterable;

  return (
    <>
      {/* Header */}
      <div className="card-ink flex items-center gap-6 flex-wrap" style={{ padding: 28 }}>
        <Avatar initials={emp.initials} tone="accent" size={84} />
        <div className="flex-1" style={{ minWidth: 220 }}>
          <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-.01em' }}>{emp.fullName}</div>
          <div style={{ fontSize: 16, color: 'rgba(247,243,230,.82)', marginTop: 4 }}>{emp.position.title} · {emp.department.name} · {emp.employeeCode}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="inline-flex items-center whitespace-nowrap"
            style={{
              borderRadius: 999,
              padding: '7px 16px',
              fontSize: 14,
              background: emp.status.name === 'On probation' ? 'var(--color-accent)' : 'rgba(247,243,230,.16)',
              color: emp.status.name === 'On probation' ? 'var(--color-ink)' : 'var(--color-cream)',
            }}
          >
            {emp.status.name}
          </span>
          {notRosterable && <Pill tone="critical">Not rosterable</Pill>}
        </div>
      </div>

      {notRosterable && (
        <div style={{ background: 'rgba(180,85,63,.1)', border: '1px solid rgba(180,85,63,.25)', borderRadius: 18, padding: '14px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-critical-ink)' }}>Should not be rostered — Operations notified</div>
          <div style={{ fontSize: 14, color: 'var(--color-muted-2)', marginTop: 4 }}>{emp.rosterEligibility?.reasons.join(' · ')}</div>
        </div>
      )}

      {/* Section tabs + content */}
      <div className="card">
        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 24 }}>
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)} style={{ border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 14, padding: '9px 16px', borderRadius: 999, whiteSpace: 'nowrap', background: section === s ? 'var(--color-ink)' : 'rgba(28,27,24,.06)', color: section === s ? 'var(--color-cream)' : 'var(--color-muted-2)' }}>
              {s}
            </button>
          ))}
        </div>

        {section === 'Employment' && (
          <FieldGrid fields={[
            ['Employee ID', emp.employeeCode], ['Department', emp.department.name], ['Job title', emp.position.title],
            ['Employment type', emp.employmentType.name], ['Status', emp.status.name], ['Work location', emp.workLocation],
            ['Direct manager', emp.directManager?.fullName], ['Operational supervisor', emp.operationalSupervisor],
            ['Hire date', fmt(emp.hireDate)], ['Contract period', activeContract ? `${fmt(activeContract.startDate)} – ${activeContract.endDate ? fmt(activeContract.endDate) : 'Open-ended'}` : '—'],
          ]} />
        )}

        {section === 'Personal' && (
          <FieldGrid fields={[
            ['Date of birth', fmt(emp.dateOfBirth)], ['National ID', emp.nationalId], ['Mobile', emp.phone],
            ['Nationality', emp.nationality], ['Address', emp.address],
            ['Emergency contact', emp.emergencyContactName ? `${emp.emergencyContactName} (${emp.emergencyContactRelation ?? '—'}) · ${emp.emergencyContactPhone ?? ''}` : '—'],
          ]} />
        )}

        {section === 'Professional' && <ProfessionalSection emp={emp} />}

        {section === 'Medical insurance' && <MedicalSection emp={emp} />}

        {section === 'Documents' && <DocumentsSection docs={emp.documents} />}

        {section === 'Compensation' && (
          canViewCompensation ? <CompensationSection id={id} /> : (
            <RestrictedState title="Compensation is restricted" message="Your role cannot view salary data. Requests for compensation records are logged in the audit trail and approved by the HR Administrator." />
          )
        )}
      </div>
    </>
  );
}

function FieldGrid({ fields }: { fields: [string, string | null | undefined][] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '22px 32px' }}>
      {fields.map(([label, value], i) => (
        <div key={i} style={{ borderBottom: '1px dashed rgba(28,27,24,.16)', paddingBottom: 12 }}>
          <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-muted-4)', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 17, color: 'var(--color-ink)' }}>{value || '—'}</div>
        </div>
      ))}
    </div>
  );
}

function ProfessionalSection({ emp }: { emp: EmployeeDetail }) {
  // Professional facts are drawn from the compliance documents & training the
  // employee holds (licence, medical fitness), matching the design.
  const licence = emp.documents.find((d) => d.name === 'Driving licence');
  const medical = emp.documents.find((d) => d.name === 'Medical fitness certificate');
  const defensive = emp.documents.find((d) => d.name === 'Defensive driving certificate');
  if (emp.isOperational) {
    return (
      <FieldGrid fields={[
        ['Driving licence', licence ? `Valid to ${fmt(licence.expiryDate)}` : 'Not on file'],
        ['Medical fitness', medical ? `Valid to ${fmt(medical.expiryDate)}` : 'Not on file'],
        ['Defensive driving', defensive ? `Valid to ${fmt(defensive.expiryDate)}` : 'Not on file'],
        ['Operational supervisor', emp.operationalSupervisor],
        ['Rosterable', emp.rosterEligibility?.isRosterable ? 'Yes' : 'No — see compliance flags'],
        ['Grade', emp.position.grade],
      ]} />
    );
  }
  return <FieldGrid fields={[['Grade', emp.position.grade], ['Employment type', emp.employmentType.name], ['Department', emp.department.name]]} />;
}

function MedicalSection({ emp }: { emp: EmployeeDetail }) {
  const ins = emp.medicalEnrollment;
  return (
    <div className="flex flex-col gap-6">
      <FieldGrid fields={[
        ['Scheme', ins?.scheme.name], ['Member number', ins?.memberNumber], ['Cover', ins?.coverDescription],
        ['Contribution', ins ? `Employee ${ins.scheme.employeeContribPct}% · Employer ${ins.scheme.employerContribPct}%` : '—'],
        ['Member card', ins?.cardIssued], ['Enrolled since', ins?.enrolledSince], ['Top-up cover', ins?.topUp],
      ]} />

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)' }}>Dependents covered</span>
          <span className="tnum" style={{ fontSize: 14, color: 'var(--color-muted)' }}>{emp.dependents.length} registered</span>
        </div>
        {emp.dependents.length === 0 ? (
          <EmptyState title="No dependents registered" message="Dependents can be added once medical scheme registration is confirmed." />
        ) : (
          <div style={{ background: 'rgba(28,27,24,.04)', borderRadius: 22, padding: '8px 18px' }}>
            {emp.dependents.map((d) => (
              <div key={d.id} className="flex items-center gap-3.5 flex-wrap" style={{ padding: '14px 0', borderBottom: '1px dashed rgba(28,27,24,.12)' }}>
                <Avatar initials={d.name.split(' ').map((w) => w[0]).join('').slice(0, 2)} tone="accent" size={36} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 16, color: 'var(--color-ink)' }}>{d.name} <span style={{ color: 'var(--color-muted)' }}>· {d.relation}</span></div>
                  <div className="tnum" style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>Born {fmt(d.dateOfBirth)} · {d.memberId ?? '—'}</div>
                </div>
                <Pill tone={d.status === 'Active' ? 'muted' : 'accent'}>{d.status}</Pill>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 12 }}>Next of kin</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {emp.nextOfKin.map((k) => (
            <div key={k.id} className="card-ink" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(247,243,230,.78)', marginBottom: 8 }}>{k.relation}</div>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{k.name}</div>
              <div className="tnum" style={{ fontSize: 15, color: 'rgba(247,243,230,.7)', marginTop: 6 }}>{k.phone ?? '—'}</div>
              {k.note && <div style={{ fontSize: 14, color: 'rgba(247,243,230,.78)', marginTop: 2 }}>{k.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsSection({ docs }: { docs: EmployeeDetail['documents'] }) {
  if (docs.length === 0) return <EmptyState title="No documents on file" message="Uploaded documents — contracts, licences, certificates — will be listed here with their expiry status." />;
  const now = Date.now();
  return (
    <div className="flex flex-col">
      {docs.map((d) => {
        const expiring = d.expiryDate && new Date(d.expiryDate).getTime() - now < 60 * 86400000 && new Date(d.expiryDate).getTime() > now;
        const expired = d.expiryDate && new Date(d.expiryDate).getTime() < now;
        const tone = d.restricted ? 'ink' : expired ? 'critical' : expiring ? 'accent' : 'muted';
        const state = d.restricted ? 'Restricted' : expired ? 'Expired' : expiring ? 'Expiring' : 'Valid';
        return (
          <div key={d.id} className="flex items-center gap-4" style={{ padding: '15px 0', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
            <div style={{ width: 34, height: 42, borderRadius: 6, background: 'rgba(28,27,24,.1)', flexShrink: 0 }} />
            <div className="flex-1">
              <div style={{ fontSize: 17, color: 'var(--color-ink)' }}>{d.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>
                {d.category} · v{d.version}{d.expiryDate ? ` · expires ${fmt(d.expiryDate)}` : ''}
              </div>
            </div>
            <Pill tone={tone}>{state}</Pill>
            {!d.restricted && <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>Preview · Download</span>}
          </div>
        );
      })}
    </div>
  );
}

function CompensationSection({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['compensation', id],
    queryFn: () => api.get<{ compensation: { basicSalary: string; currency: string; grade: string | null; effectiveFrom: string | null; lastRevision: string | null; payrollStatus: string | null } | null; allowances: { id: string; name: string; amount: string; currency: string }[] }>(`/employees/${id}/compensation`),
  });
  if (isLoading) return <div className="flex items-center gap-2" style={{ color: 'var(--color-muted)' }}><Spinner size={16} /> Loading compensation…</div>;
  if (isError) {
    if (error instanceof ApiError && error.status === 403) return <RestrictedState title="Compensation is restricted" message="Your role cannot view salary data." />;
    return <ErrorState message="Could not load compensation." onRetry={() => refetch()} />;
  }
  const c = data?.compensation;
  const money = (v: string, cur = 'RWF') => `${cur} ${Number(v).toLocaleString('en-US')}`;
  return (
    <FieldGrid fields={[
      ['Basic salary', c ? money(c.basicSalary, c.currency) : 'Not set'],
      ['Allowances', data && data.allowances.length ? data.allowances.map((a) => `${a.name} ${money(a.amount, a.currency)}`).join(' · ') : '—'],
      ['Grade', c?.grade], ['Effective from', fmt(c?.effectiveFrom)], ['Last revision', c?.lastRevision], ['Payroll status', c?.payrollStatus],
    ]} />
  );
}
