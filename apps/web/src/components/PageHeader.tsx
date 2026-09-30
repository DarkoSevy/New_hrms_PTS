import type { ReactNode } from 'react';

export interface Kpi {
  value: ReactNode;
  label: string;
}

export function PageHeader({
  eyebrow,
  title,
  titleSize = 44,
  kpis,
  actions,
}: {
  eyebrow?: string;
  title: string;
  titleSize?: number;
  kpis?: Kpi[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-6" style={{ padding: '14px 4px 22px' }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: titleSize, lineHeight: 1, fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
          {title}
        </h1>
      </div>
      {kpis && kpis.length > 0 && (
        <div className="flex flex-wrap items-end" style={{ gap: '20px 36px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ minWidth: 96 }}>
              <div className="tnum" style={{ fontSize: 32, lineHeight: 1, fontWeight: 500, color: 'var(--color-ink)' }}>{k.value}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: 'var(--color-muted-3)' }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
