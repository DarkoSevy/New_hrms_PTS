import { useEffect, type ReactNode } from 'react';
import { Spinner } from './primitives';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: 'rgba(20,20,25,.45)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full overflow-hidden"
        style={{ maxWidth: width, background: 'var(--color-canvas)', borderRadius: 28, boxShadow: '0 40px 80px -30px rgba(20,20,25,.55)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '22px 26px 14px', borderBottom: '1px dashed rgba(28,27,24,.16)' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 14, color: 'var(--color-muted-3)', marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{ padding: 26, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'critical',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'critical' | 'accent';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" style={{ background: 'rgba(20,20,25,.5)' }} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full"
        style={{ maxWidth: 440, background: 'var(--color-canvas)', borderRadius: 24, padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 15, color: 'var(--color-muted-2)', lineHeight: 1.6 }}>{message}</div>
        <div className="flex gap-2 mt-6 flex-wrap">
          <button
            className="btn-accent inline-flex items-center gap-2"
            style={{
              padding: '12px 22px',
              fontSize: 15,
              background: tone === 'critical' ? 'var(--color-critical)' : 'var(--color-accent)',
              color: tone === 'critical' ? '#fff' : 'var(--color-ink)',
            }}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy && <Spinner size={15} />}
            {confirmLabel}
          </button>
          <button className="btn-ghost" style={{ padding: '12px 22px', fontSize: 15 }} disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
