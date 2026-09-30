import React, { useState, useEffect } from 'react';
import { UserIcon, CheckCircleIcon, PlusIcon, EditIcon, ReportsIcon } from './icons';
import api from '../services/api';

interface PerformanceReview {
    id: string;
    employeeId: string;
    employeeName: string;
    reviewerId: string;
    reviewerName: string;
    period: string;
    rating: number;
    status: 'Draft' | 'Submitted' | 'Completed';
    strengths: string;
    improvements: string;
    goals: Goal[];
}

interface Goal {
    id: string;
    title: string;
    description: string;
    progress: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    dueDate: string;
}

const PerformanceManagement: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'reviews' | 'goals'>('reviews');
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await api.get('/performance/reviews');
            setReviews(response.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // Fallback to empty array on error
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const allGoals: Goal[] = reviews.flatMap(r => r.goals);

    const ratingColors = (rating: number) => {
        if (rating >= 4.5) return 'text-emerald-400';
        if (rating >= 3.5) return 'text-cyan-400';
        if (rating >= 2.5) return 'text-amber-400';
        return 'text-rose-400';
    };

    const statusColors = {
        Draft: { bg: 'bg-white/5', text: 'text-slate-500' },
        Submitted: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
        Completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    };

    const goalStatusColors = {
        'Not Started': { bg: 'bg-white/5', text: 'text-slate-500' },
        'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
        'Completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    };

    const renderStars = (rating: number) => {
        const safeRating = rating || 0;
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${star <= safeRating ? 'text-cyan-400 fill-current' : 'text-white/10'}`}
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                <span className={`ml-2 font-bold ${ratingColors(safeRating)}`}>{safeRating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Performance Architecture</h2>
                <p className="text-slate-500 text-sm font-medium mt-1 tracking-widest uppercase">Intelligent Growth & KPI Tracking</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cycle Completions</p>
                            <p className="text-3xl font-black text-emerald-400">
                                {reviews.filter(r => r.status === 'Completed').length}
                            </p>
                        </div>
                        <CheckCircleIcon className="w-10 h-10 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-cyan-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Calibration</p>
                            <p className="text-3xl font-black text-cyan-400">
                                {reviews.filter(r => r.status !== 'Completed').length}
                            </p>
                        </div>
                        <ReportsIcon className="w-10 h-10 text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-blue-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operational Goals</p>
                            <p className="text-3xl font-black text-blue-400">
                                {allGoals.filter(g => g.status === 'In Progress').length}
                            </p>
                        </div>
                        <UserIcon className="w-10 h-10 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-violet-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Meta Rating</p>
                            <p className="text-3xl font-black text-violet-400">
                                {reviews.length > 0
                                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                    : '0.0'}
                            </p>
                        </div>
                        <ReportsIcon className="w-10 h-10 text-violet-500/20 group-hover:text-violet-500/40 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-2xl border border-white/5 p-4 mb-8 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                        <button
                            onClick={() => setSelectedTab('reviews')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedTab === 'reviews'
                                ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            Performance Intelligence
                        </button>
                        <button
                            onClick={() => setSelectedTab('goals')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedTab === 'goals'
                                ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            OKR Engine
                        </button>
                    </div>
                    <button className="flex items-center gap-2 executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        <PlusIcon className="w-4 h-4" />
                        Init {selectedTab === 'reviews' ? 'Review' : 'Goal'}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="glass-card rounded-3xl border border-white/5 p-24 text-center animate-fade-in">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synchronizing Performance Matrix...</p>
                    </div>
                </div>
            )}

            {/* Reviews Tab */}
            {!loading && selectedTab === 'reviews' && reviews.length === 0 && (
                <div className="glass-card rounded-3xl border border-white/5 p-24 text-center animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <ReportsIcon className="w-20 h-20 mx-auto text-slate-700/50 mb-6" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">No Active Calibrations</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No performance review cycles are currently registered in the system.</p>
                </div>
            )}

            {!loading && selectedTab === 'reviews' && reviews.length > 0 && (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="glass-card rounded-2xl border border-white/5 p-8 shadow-2xl hover:border-white/10 transition-all">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-2xl shadow-inner">
                                        {review.employeeName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{review.employeeName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calibration by {review.reviewerName}</p>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{review.period}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[review.status].bg} ${statusColors[review.status].text} border border-white/5`}>
                                        {review.status}
                                    </span>
                                    <button className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Aggregate Metrics</p>
                                {renderStars(review.rating)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> High Impact Areas
                                    </p>
                                    <p className="text-sm text-slate-300 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl font-medium leading-relaxed italic">"{review.strengths || 'Calibration in progress...'}"</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-orange-400" /> Optimization Path
                                    </p>
                                    <p className="text-sm text-slate-300 bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl font-medium leading-relaxed italic">"{review.improvements || 'Growth mapping pending...'}"</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)] animate-pulse" /> Attached OKRs <span className="text-slate-700">/</span> {review.goals.length}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {review.goals.map((goal) => (
                                        <div key={goal.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl group hover:border-white/20 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-xs font-black text-white uppercase tracking-tight">{goal.title}</p>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${goalStatusColors[goal.status].bg} ${goalStatusColors[goal.status].text} border border-white/5`}>
                                                    {goal.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="executive-gradient h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${goal.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-black text-white/80">{goal.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goals Tab */}
            {!loading && selectedTab === 'goals' && (
                <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 text-slate-400 border-b border-white/5 font-black uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-5 text-left">Goal Objective</th>
                                    <th className="px-6 py-5 text-left">Owner</th>
                                    <th className="px-6 py-5 text-left">Velocity</th>
                                    <th className="px-6 py-5 text-left text-center">Protocol Status</th>
                                    <th className="px-6 py-5 text-left">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reviews.map((review) =>
                                    review.goals.map((goal) => (
                                    <tr key={goal.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="px-6 py-5">
                                                <p className="font-black text-white text-xs uppercase tracking-tight">{goal.title}</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">{goal.description}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-cyan-400">
                                                        {review.employeeName.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-200">{review.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="executive-gradient h-full rounded-full"
                                                            style={{ width: `${goal.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-white/80">{goal.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${goalStatusColors[goal.status].bg} ${goalStatusColors[goal.status].text} border border-white/5`}>
                                                    {goal.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-mono text-slate-400">{goal.dueDate}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceManagement;
