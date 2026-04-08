import React, { useState, useEffect } from 'react';
import { UserIcon, CheckCircleIcon, PlusIcon, SettingsIcon, DocumentTextIcon } from './icons';
import api from '../services/api';

interface TrainingProgram {
    id: string;
    title: string;
    description: string;
    instructor: string;
    duration: string;
    startDate: string;
    endDate: string;
    status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Active' | 'Scheduled';
    enrolledCount: number;
    maxCapacity: number;
    category: 'Technical' | 'Soft Skills' | 'Leadership' | 'Compliance';
}

interface Certification {
    id: string;
    employeeId: string;
    employeeName: string;
    certificationName: string;
    issuedDate: string;
    expiryDate: string;
    status: 'Active' | 'Expired' | 'Expiring Soon';
}

const TrainingDevelopment: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'programs' | 'certifications'>('programs');
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (selectedTab === 'programs') {
                const response = await api.get('/training/programs');
                setPrograms(response.data);
            } else {
                const response = await api.get('/training/certifications');
                setCertifications(response.data);
            }
        } catch (error) {
            console.error('Error fetching training data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, { bg: string; text: string; border: string }> = {
        Upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
        Ongoing: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
        Completed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' },
        Active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
        Scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
    };

    const certStatusColors: Record<string, { bg: string; text: string }> = {
        Active: { bg: 'bg-green-100', text: 'text-green-800' },
        'Expiring Soon': { bg: 'bg-orange-100', text: 'text-orange-800' },
        Expired: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const categoryColors: Record<string, string> = {
        Technical: 'bg-blue-500',
        'Soft Skills': 'bg-purple-500',
        Leadership: 'bg-orange-500',
        Compliance: 'bg-red-500',
    };

    const stats = {
        totalPrograms: Array.isArray(programs) ? programs.length : 0,
        ongoingPrograms: Array.isArray(programs) ? programs.filter(p => p?.status === 'Ongoing' || p?.status === 'Active').length : 0,
        activeCertifications: Array.isArray(certifications) ? certifications.filter(c => c?.status === 'Active').length : 0,
        expiringCertifications: Array.isArray(certifications) ? certifications.filter(c => c?.status === 'Expiring Soon').length : 0,
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443] mb-2">Training & Development</h2>
                <p className="text-gray-600">Manage training programs and employee certifications</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                            <p className="text-3xl font-bold text-cyan-600">{stats.totalPrograms}</p>
                        </div>
                        <SettingsIcon className="w-12 h-12 text-cyan-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Ongoing Programs</p>
                            <p className="text-3xl font-bold text-green-600">{stats.ongoingPrograms}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Certifications</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.activeCertifications}</p>
                        </div>
                        <DocumentTextIcon className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.expiringCertifications}</p>
                        </div>
                        <UserIcon className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedTab('programs')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedTab === 'programs'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Training Programs
                        </button>
                        <button
                            onClick={() => setSelectedTab('certifications')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedTab === 'certifications'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Certifications
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        {selectedTab === 'programs' ? 'New Program' : 'Add Certification'}
                    </button>
                </div>
            </div>

            {/* Programs Tab */}
            {selectedTab === 'programs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {programs.map((program) => (
                        <div key={program.id} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${statusColors[program.status]?.border || 'border-gray-300'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${program.category ? categoryColors[program.category] : 'bg-gray-500'}`}>
                                            {program.category || 'Other'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[program.status]?.bg || 'bg-gray-100'} ${statusColors[program.status]?.text || 'text-gray-800'}`}>
                                            {program.status}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <UserIcon className="w-4 h-4" />
                                    <span>Instructor: <strong>{program.instructor}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <SettingsIcon className="w-4 h-4" />
                                    <span>Duration: <strong>{program.duration}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <DocumentTextIcon className="w-4 h-4" />
                                    <span>{program.startDate} to {program.endDate}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Enrollment</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {program.enrolledCount} / {program.maxCapacity}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${(program.enrolledCount / program.maxCapacity) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Certifications Tab */}
            {selectedTab === 'certifications' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-[#0f3443] to-cyan-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Certification</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Issued Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Expiry Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {certifications.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                    {cert.employeeName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{cert.employeeName}</p>
                                                    <p className="text-sm text-gray-500">{cert.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{cert.certificationName}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{cert.issuedDate}</td>
                                        <td className="px-6 py-4 text-gray-700">{cert.expiryDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${certStatusColors[cert.status]?.bg || 'bg-gray-100'} ${certStatusColors[cert.status]?.text || 'text-gray-800'}`}>
                                                {cert.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingDevelopment;
