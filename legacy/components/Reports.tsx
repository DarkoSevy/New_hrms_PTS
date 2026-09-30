import React, { useState } from 'react';
import { ReportType } from '../types';
import {
    ReportsIcon,
    CalendarDaysIcon,
    DollarIcon,
    VehicleIcon,
    UserGroupIcon,
    CheckCircleIcon,
} from './icons';
import { TacticalButton } from './ui/TacticalButton';

const Reports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | ''>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const reportTypes = [
        { type: ReportType.EmployeeReport, icon: UserGroupIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', activeBg: 'bg-blue-500/20' },
        { type: ReportType.PayrollReport, icon: DollarIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', activeBg: 'bg-emerald-500/20' },
        { type: ReportType.VehicleReport, icon: VehicleIcon, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', activeBg: 'bg-purple-500/20' },
        { type: ReportType.SalesReport, icon: UserGroupIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', activeBg: 'bg-amber-500/20' },
    ];

    const handleGenerateReport = () => {
        if (!selectedReport || !dateRange.start || !dateRange.end) {
            alert('Please select a report type and date range');
            return;
        }
        alert(`Generating ${selectedReport} report from ${dateRange.start} to ${dateRange.end}`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Reports & Analytics</h2>
                 <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Generate comprehensive reports for business insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportTypes.map(({ type, icon: Icon, color, bg, border, activeBg }) => {
                    const isActive = selectedReport === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setSelectedReport(type)}
                            className={`p-8 rounded-3xl transition-all border text-left group overflow-hidden relative ${isActive
                                ? `border-cyan-500 ${bg} shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-[1.02]`
                                : `border-white/5 bg-white/5 hover:border-cyan-500/30 hover:bg-white/10`
                                }`}
                        >
                            <div className={`${bg} ${border} border p-4 rounded-xl inline-block mb-4 transition-colors ${isActive ? activeBg : ''}`}>
                                <Icon className={`w-8 h-8 ${color}`} />
                            </div>
                            <h3 className={`font-black uppercase tracking-tight text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{type}</h3>
                        </button>
                    );
                })}
            </div>

            <div className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Report Configuration</h3>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Report Module</label>
                            <select
                                value={selectedReport}
                                onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-widest cursor-pointer"
                            >
                                <option value="" className="bg-[#0f172a]">Select Module</option>
                                {Object.values(ReportType).map(type => (
                                    <option key={type} value={type} className="bg-[#0f172a]">{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Temporal Start</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Temporal End</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end">
                    <TacticalButton variant="primary" onClick={handleGenerateReport} icon={<CheckCircleIcon className="w-5 h-5"/>}>
                        Compile Report
                    </TacticalButton>
                </div>
            </div>

            {selectedReport && (
                <div className="glass-card shadow-2xl rounded-[2rem] border border-white/5 p-12 animate-fade-in relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="text-center py-16 text-slate-500 relative z-10">
                        <ReportsIcon className="w-20 h-20 mx-auto text-cyan-500/20 mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Awaiting Parameters</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select date range and execute "Compile Report" to generate metrics for sequence:</p>
                        <p className="mt-4 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-cyan-400 font-black text-xs uppercase tracking-widest">{selectedReport}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
