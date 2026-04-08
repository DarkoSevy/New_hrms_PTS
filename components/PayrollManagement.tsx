import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DownloadIcon, CheckCircleIcon, XCircleIcon, DollarIcon, ChevronDownIcon, PlusIcon, ClockIcon } from './icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollRun {
    id: string;
    month: number;
    year: number;
    status: 'Draft' | 'Review' | 'Approved' | 'Finalized';
    total_gross: number;
    total_net: number;
    total_paye: number;
    total_rssb_employer: number;
    total_maternity_employer: number;
    created_at: string;
}

interface PayrollRecord {
    id: string;
    employeeName: string;
    employeeId: string;
    department: string;
    role: string;
    basic_salary: number;
    gross_salary: number;
    paye_tax: number;
    rssb_employee: number;
    maternity_employee: number;
    net_salary: number;
}

const PayrollManagement: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const runId = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
            const response = await api.get(`/payroll/${runId}`);
            setCurrentRun(response.data.run);
            setRecords(response.data.records);
        } catch (error) {
            console.log('No payroll found for this month');
            setCurrentRun(null);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [selectedMonth, selectedYear]);

    const handleGenerate = async () => {
        try {
            await api.post('/payroll/generate', {
                month: selectedMonth,
                year: selectedYear,
                createdBy: 'Admin' // In real app, get from auth context
            });
            fetchPayroll();
        } catch (error) {
            alert('Failed to generate payroll');
        }
    };

    const handleApprove = async (stage: 'HR' | 'Finance' | 'MD') => {
        if (!currentRun) return;
        try {
            await api.post('/payroll/approve', {
                runId: currentRun.id,
                stage,
                approverId: 'Admin' // In real app, get from auth context
            });
            fetchPayroll();
        } catch (error) {
            alert('Failed to approve payroll');
        }
    };

    const generatePayslip = (record: PayrollRecord) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('PAYSLIP', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Premier Transport & Tour Services LTD', 105, 30, { align: 'center' });
        doc.text(`Period: ${selectedMonth}/${selectedYear}`, 105, 37, { align: 'center' });

        // Employee Info
        autoTable(doc, {
            startY: 45,
            head: [['Employee Details', '']],
            body: [
                ['Name', record.employeeName],
                ['ID', record.employeeId],
                ['Department', record.department],
                ['Position', record.role],
            ],
            theme: 'plain',
        });

        // Earnings & Deductions
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Description', 'Amount (RWF)']],
            body: [
                ['Basic Salary', record.basic_salary.toLocaleString()],
                ['Gross Salary', record.gross_salary.toLocaleString()],
                ['', ''],
                ['DEDUCTIONS', ''],
                ['PAYE Tax', record.paye_tax.toLocaleString()],
                ['RSSB (Pension 3%)', record.rssb_employee.toLocaleString()],
                ['Maternity (0.3%)', record.maternity_employee.toLocaleString()],
                ['', ''],
                ['NET SALARY', { content: record.net_salary.toLocaleString(), styles: { fontStyle: 'bold' } }],
            ],
        });

        doc.save(`payslip_${record.employeeId}_${selectedMonth}_${selectedYear}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Controls */}
            <div className="glass-card bg-[#0a0f14]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Spectrum</h2>
                    <p className="text-xs text-cyan-400 font-black uppercase tracking-[0.3em] mt-1">Payroll Management Cycle</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="appearance-none bg-white/5 border border-white/10 text-white text-sm font-bold py-3 pl-6 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all hover:bg-white/10 cursor-pointer uppercase tracking-widest"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1} className="bg-[#0a0f14] text-white">
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                            <ChevronDownIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="relative group">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="appearance-none bg-white/5 border border-white/10 text-white text-sm font-bold py-3 pl-6 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all hover:bg-white/10 cursor-pointer uppercase tracking-widest"
                        >
                            <option value={2024} className="bg-[#0a0f14] text-white">2024</option>
                            <option value={2025} className="bg-[#0a0f14] text-white">2025</option>
                            <option value={2026} className="bg-[#0a0f14] text-white">2026</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                            <ChevronDownIcon className="w-5 h-5" />
                        </div>
                    </div>

                    {!currentRun && (
                        <button
                            onClick={handleGenerate}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Initialize Cycle
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            {currentRun && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card bg-cyan-500/5 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/10 group hover:bg-cyan-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-4">Total Gross</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-white italic">{currentRun.total_gross.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">RWF</p>
                        </div>
                    </div>

                    <div className="glass-card bg-rose-500/5 backdrop-blur-xl p-8 rounded-3xl border border-rose-500/10 group hover:bg-rose-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                        <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] mb-4">Total PAYE Tax</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-white italic">{currentRun.total_paye.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">RWF</p>
                        </div>
                    </div>

                    <div className="glass-card bg-emerald-500/5 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mb-4">Total Net Pay</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-white italic">{currentRun.total_net.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">RWF</p>
                        </div>
                    </div>

                    <div className="glass-card bg-violet-500/5 backdrop-blur-xl p-8 rounded-3xl border border-violet-500/10 group hover:bg-violet-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                        <p className="text-[10px] text-violet-400 font-black uppercase tracking-[0.3em] mb-4">Employer RSSB</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-white italic">{currentRun.total_rssb_employer.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">RWF</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Status */}
            {currentRun && (
                <div className="glass-card bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white/5">
                            <ClockIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Lifecycle Status</p>
                            <span className={`text-sm font-black uppercase tracking-widest ${
                                currentRun.status === 'Finalized' ? 'text-emerald-400' :
                                currentRun.status === 'Draft' ? 'text-cyan-400' : 'text-violet-400'
                            }`}>
                                {currentRun.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        {currentRun.status === 'Draft' && (
                            <button onClick={() => handleApprove('HR')} className="bg-white/5 hover:bg-cyan-500 text-white hover:text-black border border-white/10 hover:border-cyan-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                Submit for HR Review
                            </button>
                        )}
                        {currentRun.status === 'Review' && (
                            <button onClick={() => handleApprove('Finance')} className="bg-white/5 hover:bg-violet-500 text-white hover:text-black border border-white/10 hover:border-violet-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                Finance Apprival
                            </button>
                        )}
                        {currentRun.status === 'Approved' && (
                            <button onClick={() => handleApprove('MD')} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                                Finalize Cycle (MD)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Payroll Table */}
            {currentRun ? (
                <div className="glass-card bg-[#0a0f14]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Employee Intelligence</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Base Matrix</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gross Yield</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">PAYE</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RSSB (3%)</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Net Liquidity</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {records.map(record => (
                                    <tr key={record.id} className="group hover:bg-white/[0.02] transition-all duration-300">
                                        <td className="p-6">
                                            <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{record.employeeName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{record.role}</p>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-slate-300 font-mono">{record.basic_salary.toLocaleString()}</td>
                                        <td className="p-6 text-sm font-bold text-slate-300 font-mono">{record.gross_salary.toLocaleString()}</td>
                                        <td className="p-6 text-sm font-black text-rose-500 font-mono italic">-{record.paye_tax.toLocaleString()}</td>
                                        <td className="p-6 text-sm font-black text-rose-500 font-mono italic">-{record.rssb_employee.toLocaleString()}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-emerald-400 font-mono italic">{record.net_salary.toLocaleString()}</span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">RWF</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => generatePayslip(record)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all group/btn"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" /> 
                                                Export
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card bg-[#0a0f14]/60 backdrop-blur-xl p-20 rounded-[3rem] border border-white/5 border-dashed flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                        <DollarIcon className="w-12 h-12 text-cyan-500 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Cycle Inactive</h3>
                    <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed uppercase tracking-widest">
                        The financial engine for <span className="text-cyan-400 font-black">{new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</span> is currently dormant. 
                        Initialize the cycle to begin calculations.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="mt-10 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95"
                    >
                        Awaken Engine
                    </button>
                </div>
            )}
        </div>
    );
};

export default PayrollManagement;
