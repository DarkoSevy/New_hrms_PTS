import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SparklesIcon, UserGroupIcon, ReportsIcon, XCircleIcon, DocumentTextIcon } from './icons';
import api from '../services/api';

// Sample data for charts
const employeeDistribution = [
    { name: 'Executive', value: 3 },
    { name: 'Operations', value: 7 },
    { name: 'Admin & Finance', value: 8 },
    { name: 'Commercial', value: 6 },
    { name: 'Support', value: 5 },
];

const attendanceTrends = [
    { month: 'Jul', present: 85, absent: 10, late: 5 },
    { month: 'Aug', present: 88, absent: 8, late: 4 },
    { month: 'Sep', present: 90, absent: 7, late: 3 },
    { month: 'Oct', present: 87, absent: 9, late: 4 },
    { month: 'Nov', present: 92, absent: 5, late: 3 },
    { month: 'Dec', present: 89, absent: 8, late: 3 },
];

const leaveRequestsData = [
    { type: 'Annual', count: 45 },
    { type: 'Sick', count: 28 },
    { type: 'Maternity', count: 8 },
    { type: 'Unpaid', count: 12 },
];

const performanceRatings = [
    { rating: '5 Stars', count: 12 },
    { rating: '4 Stars', count: 25 },
    { rating: '3 Stars', count: 15 },
    { rating: '2 Stars', count: 5 },
    { rating: '1 Star', count: 2 },
];

const COLORS = ['#22d3ee', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e'];

const DashboardCharts: React.FC = () => {
    const [aiData, setAiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAiInsights = async () => {
            try {
                const response = await api.get('/ai-reports/insights');
                setAiData(response.data);
            } catch (error) {
                console.error('Error fetching AI insights:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAiInsights();
    }, []);

    const kpiCards = [
        { title: 'Total Workforce', value: aiData?.metrics?.totalEmployees || '5', icon: UserGroupIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { title: 'Active Rate', value: aiData?.metrics?.activeRate || '80%', icon: ReportsIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { title: 'Active Warnings', value: aiData?.metrics?.activeDisciplinaryWarnings || '2', icon: XCircleIcon, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { title: 'Payroll Variance', value: '-2.4%', icon: DocumentTextIcon, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* AI Management Summary */}
            <div className="executive-gradient rounded-2xl shadow-2xl p-6 text-white overflow-hidden relative group border border-white/10">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <SparklesIcon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-4">
                        <SparklesIcon className="w-6 h-6 animate-pulse text-blue-200" />
                        <h2 className="text-xl font-bold tracking-tight text-white/90">AI Executive Summary</h2>
                    </div>
                    {loading ? (
                        <div className="flex space-x-2 items-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.3s]"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.5s]"></div>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <p className="text-blue-50 leading-relaxed italic opacity-90 mb-4 whitespace-pre-line">
                                {aiData?.aiSummary || "Smart insights are being generated based on your latest business transaction data. Check back in a moment."}
                            </p>
                            <div className="flex items-center space-x-4 text-xs font-medium text-blue-100/70">
                                <span>Updated: {new Date().toLocaleTimeString()}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white/10">Gemini 1.5 Powered</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, idx) => (
                    <div key={idx} className="glass-card rounded-2xl p-5 group cursor-default">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${kpi.bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <kpi.icon className={`${kpi.color} w-5 h-5`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{kpi.title}</span>
                        </div>
                        <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employee Distribution - Pie Chart */}
                <div className="glass-card rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Employee Distribution by Department</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={employeeDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {employeeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Trends - Line Chart */}
                <div className="glass-card rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Attendance Trends (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                            <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Leave Requests - Bar Chart */}
                <div className="glass-card rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Leave Requests by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={leaveRequestsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Performance Ratings - Bar Chart */}
                <div className="glass-card rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Performance Ratings Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceRatings}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="rating" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
