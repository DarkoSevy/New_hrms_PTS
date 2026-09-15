import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Notif { id: string; channel: string; title: string; body: string; isRead: boolean; createdAt: string }

export function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ data: Notif[]; unread: number }>('/notifications'),
    refetchInterval: 60_000,
  });
  const markAll = useMutation({ mutationFn: () => api.post('/notifications/read-all'), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const unread = data?.unread ?? 0;

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => setOpen((v) => !v)}
        style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer', position: 'relative' }}
      >
        <span style={{ position: 'relative', width: 8, height: 8, borderRadius: 999, background: unread ? 'var(--color-accent-strong)' : 'rgba(28,27,24,.35)', boxShadow: unread ? '0 0 0 6px rgba(232,185,35,.22)' : 'none' }} />
        {unread > 0 && (
          <span className="tnum" style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--color-critical)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{unread}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50" style={{ top: 52, right: 0, width: 340, maxHeight: 440, overflowY: 'auto', background: 'var(--color-canvas)', borderRadius: 18, boxShadow: '0 20px 50px -20px rgba(20,20,25,.5)', padding: 10 }}>
            <div className="flex items-center justify-between" style={{ padding: '6px 8px 10px' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Notifications</span>
              {unread > 0 && <button onClick={() => markAll.mutate()} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)', fontFamily: 'Outfit' }}>Mark all read</button>}
            </div>
            {!data || data.data.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 14, color: 'var(--color-muted)' }}>You're all caught up.</div>
            ) : (
              data.data.map((n) => (
                <div key={n.id} style={{ padding: '10px 12px', borderRadius: 12, background: n.isRead ? 'transparent' : 'rgba(239,201,76,.12)', marginBottom: 4 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-muted-4)' }}>{n.channel.toLowerCase()}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginTop: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted-2)', marginTop: 2, lineHeight: 1.45 }}>{n.body}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
