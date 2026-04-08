
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

const Reports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | ''>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const reportTypes = [
        { type: ReportType.EmployeeReport, icon: UserGroupIcon, color: 'bg-blue-100 text-blue-700' },
        { type: ReportType.PayrollReport, icon: DollarIcon, color: 'bg-green-100 text-green-700' },
        { type: ReportType.VehicleReport, icon: VehicleIcon, color: 'bg-purple-100 text-purple-700' },
        { type: ReportType.SalesReport, icon: UserGroupIcon, color: 'bg-orange-100 text-orange-700' },
    ];

    const handleGenerateReport = () => {
        if (!selectedReport || !dateRange.start || !dateRange.end) {
            alert('Please select a report type and date range');
            return;
        }
        alert(`Generating ${selectedReport} report from ${dateRange.start} to ${dateRange.end}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#0f3443]">Reports & Analytics</h2>
                <p className="text-gray-500">Generate comprehensive reports for business insights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportTypes.map(({ type, icon: Icon, color }) => (
                    <button
                        key={type}
                        onClick={() => setSelectedReport(type)}
                        className={`p-6 rounded-xl shadow-sm border-2 transition-all ${selectedReport === type
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-transparent bg-white hover:border-gray-200'
                            }`}
                    >
                        <div className={`${color} p-4 rounded-lg inline-block mb-3`}>
                            <Icon className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-[#0f3443]">{type}</h3>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#0f3443] mb-4">Report Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Report Type</label>
                        <select
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Select Report Type</option>
                            {Object.values(ReportType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Generate Report
                    </button>
                </div>
            </div>

            {selectedReport && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-[#0f3443] mb-4">Preview: {selectedReport}</h3>
                    <div className="text-center py-12 text-gray-500">
                        <ReportsIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p>Report preview will appear here after generation.</p>
                        <p className="text-sm mt-2">Select date range and click "Generate Report" to view data.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
