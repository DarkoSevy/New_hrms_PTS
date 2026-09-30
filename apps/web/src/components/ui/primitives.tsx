import type { ReactNode } from 'react';

type Tone = 'ink' | 'accent' | 'neutral' | 'success' | 'critical' | 'warn' | 'muted';

const toneStyles: Record<Tone, { bg: string; color: string }> = {
  ink: { bg: 'var(--color-ink)', color: 'var(--color-cream)' },
  accent: { bg: 'var(--color-accent)', color: 'var(--color-ink)' },
  neutral: { bg: 'rgba(28,27,24,.1)', color: 'var(--color-muted-2)' },
  success: { bg: 'var(--color-success)', color: '#fff' },
  critical: { bg: 'var(--color-critical)', color: '#fff' },
  warn: { bg: 'rgba(239,201,76,.28)', color: 'var(--color-warn-ink)' },
  muted: { bg: 'rgba(28,27,24,.08)', color: 'var(--color-muted-2)' },
};

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const s = toneStyles[tone];
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      style={{ background: s.bg, color: s.color, borderRadius: 999, padding: '7px 14px', fontSize: 13 }}
    >
      {children}
    </span>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        border: '2.5px solid rgba(28,27,24,.15)',
        borderTopColor: 'var(--color-ink)',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

export function SkeletonLine({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return <div className="skeleton" style={{ width: w, height: h }} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999 }} />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonLine w="45%" />
            <SkeletonLine w="30%" h={11} />
          </div>
          <SkeletonLine w={80} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="text-center"
      style={{ background: 'rgba(28,27,24,.04)', borderRadius: 22, padding: 40 }}
    >
      <div style={{ fontSize: 18, color: 'var(--color-ink)', marginBottom: 6, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 15, color: 'var(--color-muted-3)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
        {message}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="text-center"
      style={{ background: 'rgba(180,85,63,.08)', border: '1px solid rgba(180,85,63,.25)', borderRadius: 22, padding: 32 }}
    >
      <div style={{ fontSize: 16, color: 'var(--color-critical-ink)', marginBottom: 6, fontWeight: 500 }}>
        Something went wrong
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-muted-2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
        {message}
      </div>
      {onRetry && (
        <button className="btn-ghost mt-4" style={{ padding: '9px 18px', fontSize: 14 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function RestrictedState({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center" style={{ background: 'rgba(28,27,24,.05)', borderRadius: 22, padding: 44 }}>
      <div style={{ fontSize: 22, color: 'var(--color-ink)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 15, color: 'var(--color-muted-3)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
        {message}
      </div>
    </div>
  );
}

export function Avatar({ initials, tone = 'muted', size = 40 }: { initials: string; tone?: 'muted' | 'accent' | 'dark'; size?: number }) {
  const map = {
    muted: { bg: 'rgba(28,27,24,.09)', color: 'var(--color-ink)' },
    accent: { bg: 'var(--color-accent)', color: 'var(--color-ink)' },
    dark: { bg: 'var(--color-ink)', color: 'var(--color-cream-2)' },
  } as const;
  const s = map[tone];
  return (
    <span
      className="grid place-items-center shrink-0 font-semibold"
      style={{ width: size, height: size, borderRadius: 999, background: s.bg, color: s.color, fontSize: size * 0.32 }}
    >
      {initials}
    </span>
  );
}
