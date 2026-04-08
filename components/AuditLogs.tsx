import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auditAPI } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
    id: number;
    user_id: string;
    username: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    changes?: string;
    ip_address?: string;
    severity: 'info' | 'warning' | 'critical';
    description?: string;
    timestamp: string;
}

interface AuditStats {
    actionCounts: { action: string; count: number }[];
    severityCounts: { severity: string; count: number }[];
    topUsers: { username: string; count: number }[];
    summary: {
        total: number;
        critical: number;
        warning: number;
        unique_users: number;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    UPDATE: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    DELETE: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    LOGIN: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    LOGOUT: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    APPROVE: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
    REJECT: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    EXPORT: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    VIEW: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

const SEVERITY_DOT: Record<string, string> = {
    info: 'bg-blue-400',
    warning: 'bg-amber-400',
    critical: 'bg-red-500 animate-pulse',
};

const ROW_HOVER: Record<string, string> = {
    critical: 'hover:bg-red-50/60',
    warning: 'hover:bg-amber-50/60',
    info: 'hover:bg-slate-50/60',
};

const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleString('en-ZA', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
};

const formatChanges = (raw?: string): React.ReactNode => {
    if (!raw) return <span className="text-gray-400 italic text-xs">No change data</span>;
    try {
        const obj = JSON.parse(raw);
        return (
            <pre className="bg-gray-900 text-green-300 rounded-lg p-3 text-xs overflow-auto max-h-48 font-mono leading-relaxed">
                {JSON.stringify(obj, null, 2)}
            </pre>
        );
    } catch {
        return <span className="text-gray-600 text-xs">{raw}</span>;
    }
};

const downloadCSV = (logs: AuditLog[]) => {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Severity', 'IP Address', 'Description'];
    const rows = logs.map(l => [
        l.id,
        l.timestamp,
        l.username,
        l.action,
        l.entity_type,
        l.entity_id || '',
        l.severity,
        l.ip_address || '',
        (l.description || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color: string; icon: string }> =
    ({ label, value, sub, color, icon }) => (
        <div className={`flex items-center gap-4 p-5 rounded-2xl glass-card border border-white/5 shadow-xl hover:border-white/20 transition-all duration-300`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color} bg-white/5 shadow-inner`}>{icon}</div>
            <div>
                <p className="text-2xl font-bold text-white tracking-tight">{value.toLocaleString()}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                {sub && <p className="text-[10px] text-cyan-400/60 mt-0.5">{sub}</p>}
            </div>
        </div>
    );

// ─── Main Component ───────────────────────────────────────────────────────────

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 25;

    // Filters
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const searchDebounce = useRef<NodeJS.Timeout | null>(null);

    const fetchLogs = useCallback(async (currentPage = 0) => {
        setLoading(true);
        try {
            const res = await auditAPI.getLogs({
                search: search || undefined,
                action: filterAction || undefined,
                entity_type: filterEntity || undefined,
                severity: filterSeverity || undefined,
                from: filterFrom || undefined,
                to: filterTo || undefined,
                limit: PAGE_SIZE,
                offset: currentPage * PAGE_SIZE,
            });
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    }, [search, filterAction, filterEntity, filterSeverity, filterFrom, filterTo]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await auditAPI.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch audit stats', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(0);
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => {
            fetchLogs(0);
        }, 300);
        return () => clearTimeout(searchDebounce.current);
    }, [search, filterAction, filterEntity, filterSeverity, filterFrom, filterTo]);

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchLogs(page);
            fetchStats();
        }, 30_000);
        return () => clearInterval(interval);
    }, [autoRefresh, page, fetchLogs, fetchStats]);

    const clearFilters = () => {
        setSearch('');
        setFilterAction('');
        setFilterEntity('');
        setFilterSeverity('');
        setFilterFrom('');
        setFilterTo('');
        setPage(0);
    };

    const hasFilters = search || filterAction || filterEntity || filterSeverity || filterFrom || filterTo;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const uniqueActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'VIEW'];
    const uniqueEntities = [...new Set(logs.map(l => l.entity_type))].sort();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">🔍</span> Audit Logs
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Complete activity trail — every action tracked and searchable</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            autoRefresh
                                ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {autoRefresh ? 'Live' : 'Paused'}
                    </button>
                    {/* Refresh */}
                    <button
                        onClick={() => { fetchLogs(page); fetchStats(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    {/* Export */}
                    <button
                        onClick={() => downloadCSV(logs)}
                        disabled={logs.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            {!statsLoading && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Events (30d)"
                        value={stats.summary?.total || 0}
                        color="bg-blue-50"
                        icon="📋"
                    />
                    <StatCard
                        label="Unique Users"
                        value={stats.summary?.unique_users || 0}
                        sub="active in last 30 days"
                        color="bg-cyan-50"
                        icon="👥"
                    />
                    <StatCard
                        label="Critical Events"
                        value={stats.summary?.critical || 0}
                        sub="require review"
                        color="bg-red-50"
                        icon="🚨"
                    />
                    <StatCard
                        label="Warnings"
                        value={stats.summary?.warning || 0}
                        sub="in last 30 days"
                        color="bg-amber-50"
                        icon="⚠️"
                    />
                </div>
            )}

            {/* Filters */}
            <div className="glass-card rounded-2xl border border-white/5 p-5 space-y-4 shadow-2xl">
                {/* Search */}
                <div className="relative group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="audit-search"
                        name="audit-search"
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search system activity records..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all placeholder:text-slate-600"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">✕</button>
                    )}
                </div>

                {/* Filter row */}
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        id="filter-action"
                        name="filter-action"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                    >
                        <option value="" className="bg-[#020617]">All Actions</option>
                        {uniqueActions.map(a => <option key={a} value={a} className="bg-[#020617]">{a}</option>)}
                    </select>

                    <select
                        id="filter-severity"
                        name="filter-severity"
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                    >
                        <option value="" className="bg-[#020617]">All Severities</option>
                        <option value="info" className="bg-[#020617]">Info</option>
                        <option value="warning" className="bg-[#020617]">Warning</option>
                        <option value="critical" className="bg-[#020617]">Critical</option>
                    </select>

                    <select
                        id="filter-entity"
                        name="filter-entity"
                        value={filterEntity}
                        onChange={e => setFilterEntity(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                    >
                        <option value="" className="bg-[#020617]">All Entities</option>
                        {uniqueEntities.map(e => <option key={e} value={e} className="bg-[#020617]">{e}</option>)}
                    </select>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">From:</label>
                        <input
                            id="filter-from"
                            name="filter-from"
                            type="date"
                            value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-[#0f3443] focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">To:</label>
                        <input
                            id="filter-to"
                            name="filter-to"
                            type="date"
                            value={filterTo}
                            onChange={e => setFilterTo(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-[#0f3443] focus:border-transparent"
                        />
                    </div>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                        >
                            ✕ Clear Filters
                        </button>
                    )}

                    <span className="ml-auto text-xs text-gray-500">
                        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">Loading audit logs…</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                        <span className="text-5xl opacity-20">🔍</span>
                        <p className="text-base font-medium">No audit logs found</p>
                        <p className="text-sm">Try adjusting your filters or date range</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-white/5 text-slate-300 border-b border-white/10 uppercase tracking-widest font-black text-[10px]">
                                        <th className="text-left px-5 py-5 font-black">Timestamp</th>
                                        <th className="text-left px-4 py-5 font-black">User</th>
                                        <th className="text-left px-4 py-5 font-black">Action</th>
                                        <th className="text-left px-4 py-5 font-black">Entity</th>
                                        <th className="text-left px-4 py-5 font-black">Severity</th>
                                        <th className="text-left px-4 py-5 font-black">IP Address</th>
                                        <th className="text-left px-4 py-5 font-black">Description</th>
                                        <th className="text-center px-4 py-5 font-black">Changes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => {
                                        const isExpanded = expandedRow === log.id;
                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr
                                                    className={`transition-all duration-300 cursor-pointer border-b border-white/5 ${ROW_HOVER[log.severity] || 'hover:bg-white/5'} ${isExpanded ? 'bg-white/10' : ''}`}
                                                    onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                                >
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className="text-slate-200 text-xs font-mono">{formatTimestamp(log.timestamp)}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 text-xs font-black shadow-sm">
                                                                {(log.username || 'S').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-slate-200 truncate max-w-32 text-xs font-medium">{log.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight ${ACTION_COLORS[log.action] || 'bg-white/10 text-slate-400'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-100">{log.entity_type}</span>
                                                            {log.entity_id && (
                                                                <span className="text-slate-500 ml-1.5 font-mono">#{log.entity_id.substring(0, 6)}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[log.severity] || 'bg-slate-500'}`} />
                                                            <span className="capitalize text-[10px] font-black text-slate-400 tracking-wide">{log.severity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-xs text-slate-500 font-mono italic">{log.ip_address || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-4 max-w-xs text-xs text-slate-400">
                                                        <span className="truncate block font-medium">{log.description || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {log.changes ? (
                                                            <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-all ${isExpanded ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                                {isExpanded ? 'Close' : 'View Changes'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-700 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-black/20">
                                                        <td colSpan={8} className="px-8 py-6">
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                                    Change Details Profile
                                                                </p>
                                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                                    {formatChanges(log.changes)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-5 border-t border-white/5 bg-black/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Displaying {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} <span className="text-slate-700 mx-1">/</span> {total.toLocaleString()} records
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-20 transition-all"
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-9 h-9 text-[10px] font-black rounded-xl border transition-all ${
                                                    pageNum === page
                                                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                                        : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-20 transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
