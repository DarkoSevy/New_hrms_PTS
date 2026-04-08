import React, { useState, useEffect } from 'react';
import { UserIcon, XCircleIcon, PlusIcon, ShieldCheckIcon, DocumentTextIcon } from './icons';
import api from '../services/api';

interface DisciplinaryCase {
    id: string;
    employeeId: string;
    employeeName: string;
    type: 'Verbal Warning' | 'Written Warning' | 'Final Warning' | 'Suspension' | 'Grievance';
    date: string;
    reason: string;
    actionTaken: string;
    status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
    reportedBy: string;
    notes?: string;
}

const DisciplinaryGrievance: React.FC = () => {
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'disciplinary' | 'grievance'>('all');
    const [cases, setCases] = useState<DisciplinaryCase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const response = await api.get('/disciplinary/cases');
            // Map backend data to frontend format
            const mappedCases = response.data.map((c: any) => ({
                ...c,
                type: c.case_type,
                employeeName: c.employeeName || 'Unknown',
                actionTaken: c.action_taken || '',
                reportedBy: c.reported_by || 'Unknown'
            }));
            setCases(mappedCases);
        } catch (error) {
            console.error('Error fetching cases:', error);
            setCases([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCases = cases.filter(c => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'disciplinary') return c.type !== 'Grievance';
        if (selectedFilter === 'grievance') return c.type === 'Grievance';
        return true;
    });

    const typeColors = {
        'Verbal Warning': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        'Written Warning': { bg: 'bg-orange-100', text: 'text-orange-800' },
        'Final Warning': { bg: 'bg-red-100', text: 'text-red-800' },
        'Suspension': { bg: 'bg-purple-100', text: 'text-purple-800' },
        'Grievance': { bg: 'bg-blue-100', text: 'text-blue-800' },
    };

    const statusColors = {
        Open: { bg: 'bg-blue-100', text: 'text-blue-800' },
        'Under Investigation': { bg: 'bg-orange-100', text: 'text-orange-800' },
        Resolved: { bg: 'bg-green-100', text: 'text-green-800' },
        Closed: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const stats = {
        totalCases: cases.length,
        openCases: cases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length,
        disciplinary: cases.filter(c => c.type !== 'Grievance').length,
        grievances: cases.filter(c => c.type === 'Grievance').length,
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443] mb-2">Disciplinary & Grievance</h2>
                <p className="text-gray-600">Manage disciplinary actions and employee grievances</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Cases</p>
                            <p className="text-3xl font-bold text-cyan-600">{stats.totalCases}</p>
                        </div>
                        <DocumentTextIcon className="w-12 h-12 text-cyan-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Open Cases</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.openCases}</p>
                        </div>
                        <XCircleIcon className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Disciplinary Actions</p>
                            <p className="text-3xl font-bold text-red-600">{stats.disciplinary}</p>
                        </div>
                        <ShieldCheckIcon className="w-12 h-12 text-red-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Grievances</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.grievances}</p>
                        </div>
                        <UserIcon className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedFilter === 'all'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All Cases
                        </button>
                        <button
                            onClick={() => setSelectedFilter('disciplinary')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedFilter === 'disciplinary'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Disciplinary
                        </button>
                        <button
                            onClick={() => setSelectedFilter('grievance')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedFilter === 'grievance'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Grievances
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        New Case
                    </button>
                </div>
            </div>

            {/* Cases List */}
            <div className="space-y-4">
                {filteredCases.map((caseItem) => (
                    <div key={caseItem.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                    {caseItem.employeeName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{caseItem.employeeName}</h3>
                                    <p className="text-sm text-gray-500">{caseItem.employeeId}</p>
                                    <p className="text-sm text-gray-500">Reported by: {caseItem.reportedBy}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[caseItem.type].bg} ${typeColors[caseItem.type].text}`}>
                                    {caseItem.type}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[caseItem.status].bg} ${statusColors[caseItem.status].text}`}>
                                    {caseItem.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Date</p>
                                <p className="text-sm text-gray-600">{caseItem.date}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Case ID</p>
                                <p className="text-sm text-gray-600">{caseItem.id}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Reason</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{caseItem.reason}</p>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Action Taken</p>
                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{caseItem.actionTaken}</p>
                        </div>

                        {caseItem.notes && (
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
                                <p className="text-sm text-gray-600 italic">{caseItem.notes}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredCases.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <ShieldCheckIcon className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Cases Found</h3>
                    <p className="text-gray-500">No {selectedFilter === 'all' ? '' : selectedFilter} cases to display</p>
                </div>
            )}
        </div>
    );
};

export default DisciplinaryGrievance;
