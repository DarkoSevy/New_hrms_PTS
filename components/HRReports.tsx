import React, { useState } from 'react';
import { ReportsIcon, UserIcon, DollarIcon, DocumentTextIcon, PlusIcon } from './icons';
import api from '../services/api';
import { exportToExcel, exportMultipleSheetsToExcel } from '../utils/exportHelpers';

interface ReportData {
    id: string;
    name: string;
    description: string;
    category: 'Employee' | 'Attendance' | 'Performance' | 'Payroll' | 'Training';
    lastGenerated?: string;
    endpoint: string;
}

const HRReports: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState<any>(null);
    const [activeReport, setActiveReport] = useState<ReportData | null>(null);

    const reports: ReportData[] = [
        {
            id: '1',
            name: 'Employee Demographics Report',
            description: 'Comprehensive overview of employee distribution by department, role, and location',
            category: 'Employee',
            lastGenerated: '2024-12-05',
            endpoint: '/reports/employee-demographics'
        },
        {
            id: '2',
            name: 'Attendance Summary',
            description: 'Monthly attendance statistics including absences, late arrivals, and overtime',
            category: 'Attendance',
            lastGenerated: '2024-12-04',
            endpoint: '/reports/attendance-summary'
        },
        {
            id: '3',
            name: 'Performance Review Analysis',
            description: 'Analysis of performance ratings, goals completion, and improvement trends',
            category: 'Performance',
            lastGenerated: '2024-11-30',
            endpoint: '/reports/performance-analysis'
        },
        {
            id: '4',
            name: 'Payroll Summary Report',
            description: 'Detailed payroll breakdown by department with salary statistics',
            category: 'Payroll',
            lastGenerated: '2024-12-01',
            endpoint: '/reports/payroll-summary'
        },
        {
            id: '5',
            name: 'Training Completion Report',
            description: 'Training program enrollment and completion rates by employee',
            category: 'Training',
            lastGenerated: '2024-12-03',
            endpoint: '/reports/training-completion'
        },
        {
            id: '6',
            name: 'Leave Balance Report',
            description: 'Employee leave balances and utilization trends',
            category: 'Employee',
            lastGenerated: '2024-11-15',
            endpoint: '/reports/leave-balance'
        },
        {
            id: '7',
            name: 'Turnover Analysis',
            description: 'Employee turnover rates and retention statistics',
            category: 'Employee',
            endpoint: '/reports/turnover-analysis'
        },
        {
            id: '8',
            name: 'Certification Expiry Report',
            description: 'Upcoming certification and license expiration tracking',
            category: 'Training',
            lastGenerated: '2024-12-05',
            endpoint: '/reports/certification-expiry'
        },
    ];

    const filteredReports = selectedCategory === 'all'
        ? reports
        : reports.filter(r => r.category.toLowerCase() === selectedCategory);

    // Handler for Generate button
    const handleGenerateReport = async (report: ReportData) => {
        setLoading(true);
        setActiveReport(report);
        setReportResult(null);
        try {
            const response = await api.get(report.endpoint, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });
            console.log('Report data:', response.data);
            setReportResult(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
            alert(`Failed to generate ${report.name}`);
        } finally {
            setLoading(false);
        }
    };

    // Handler for Export button  
    const handleExportReport = async (report: ReportData) => {
        setLoading(true);
        try {
            const response = await api.get(report.endpoint, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });

            const data = response.data;
            const sheets: { [key: string]: any[] } = {};

            // Identify arrays to export
            Object.keys(data).forEach(key => {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    sheets[key] = data[key];
                }
            });

            if (Object.keys(sheets).length > 0) {
                exportMultipleSheetsToExcel(sheets, `${report.name.replace(/\s+/g, '_')}`);
            } else {
                alert('No data found to export for this report period.');
            }

        } catch (error) {
            console.error('Error exporting report:', error);
            alert(`Failed to export ${report.name}`);
        } finally {
            setLoading(false);
        }
    };

    const categoryColors = {
        Employee: { bg: 'bg-blue-500/20', text: 'text-blue-400', light: 'bg-blue-500/10' },
        Attendance: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', light: 'bg-emerald-500/10' },
        Performance: { bg: 'bg-purple-500/20', text: 'text-purple-400', light: 'bg-purple-500/10' },
        Payroll: { bg: 'bg-amber-500/20', text: 'text-amber-400', light: 'bg-amber-500/10' },
        Training: { bg: 'bg-rose-500/20', text: 'text-rose-400', light: 'bg-rose-500/10' },
    };

    const stats = [
        { label: 'Total Archives', value: '8', icon: DocumentTextIcon, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        { label: 'Node Intel', value: '3', icon: UserIcon, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        { label: 'Presence Metrics', value: '1', icon: ReportsIcon, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        { label: 'Value Analysis', value: '1', icon: DollarIcon, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    ];

    // Helper to render report results
    const renderReportResults = () => {
        if (!reportResult || !activeReport) return null;

        return (
            <div className="mt-8 space-y-8 animate-fade-in">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{activeReport.name} - Results</h3>
                    <p className="text-sm text-gray-500 mb-6">Generated on: {new Date().toLocaleString()}</p>

                    {Object.keys(reportResult).map((key) => {
                        const data = reportResult[key];
                        if (key === 'generatedAt' || !Array.isArray(data) || data.length === 0) return null;

                        // Get headers from first item
                        const headers = Object.keys(data[0]);

                        return (
                            <div key={key} className="mb-8">
                                <h4 className="text-lg font-semibold text-gray-700 mb-3 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {headers.map(header => (
                                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {header.replace(/_/g, ' ')}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row: any, idx: number) => (
                                                <tr key={idx}>
                                                    {headers.map(header => (
                                                        <td key={`${idx}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {typeof row[header] === 'object' ? JSON.stringify(row[header]) : row[header]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                    {/* Handle Non-Array Data (Summaries) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.keys(reportResult).map(key => {
                            const value = reportResult[key];
                            if (key === 'generatedAt' || Array.isArray(value) || typeof value === 'object') return null;
                            return (
                                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                    <p className="text-xl font-bold text-gray-900">{value}</p>
                                </div>
                            )
                        })}
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-[2.5rem] border border-white/10 shadow-2xl p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-4xl font-black mb-3 tracking-tight uppercase">Intelligence & Analytics</h2>
                        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Synthetic Data Aggregation & Deep Insights</p>
                    </div>
                    <ReportsIcon className="w-24 h-24 opacity-20 text-cyan-400" />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl transition-transform hover:scale-[1.02]">
                        <div className="flex items-center gap-5">
                            <div className={`${stat.color} p-4 rounded-xl border flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest ml-1">Archive Segment</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-widest"
                        >
                            <option value="all">Full Spectrum</option>
                            <option value="employee">Nodes</option>
                            <option value="attendance">Presence</option>
                            <option value="performance">Output</option>
                            <option value="payroll">Economic</option>
                            <option value="training">Knowledge</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest ml-1">Temporal Start</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest ml-1">Temporal End</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredReports.map((report) => (
                    <div key={report.id} className="glass-card rounded-3xl border border-white/5 p-8 hover:border-cyan-400/30 transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-4 rounded-xl border border-white/5 ${categoryColors[report.category].light}`}>
                                <ReportsIcon className={`w-8 h-8 ${categoryColors[report.category].text}`} />
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border border-white/10 ${categoryColors[report.category].bg}`}>
                                {report.category}
                            </span>
                        </div>
 
                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{report.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed uppercase tracking-tight">{report.description}</p>
 
                        {report.lastGenerated && (
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-8">
                                Last Sync: {report.lastGenerated}
                            </p>
                        )}
 
                        <div className="flex gap-4 mt-auto">
                            <button
                                onClick={() => handleGenerateReport(report)}
                                disabled={loading}
                                className="flex-1 executive-gradient text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading && activeReport?.id === report.id ? 'Aggregating...' : 'Generate'}
                            </button>
                            <button
                                onClick={() => handleExportReport(report)}
                                disabled={loading}
                                className="px-5 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredReports.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <ReportsIcon className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Reports Found</h3>
                    <p className="text-gray-500">No reports match the selected category</p>
                </div>
            )}

            {/* Report Results Section */}
            {renderReportResults()}
        </div>
    );
};

export default HRReports;
