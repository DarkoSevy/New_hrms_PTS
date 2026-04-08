import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '../types';
import DependentsTab from './DependentsTab';
import DocumentsTab from './DocumentsTab';
import WarningsTab from './WarningsTab';

interface EmployeeDetailModalProps {
    employee: Employee;
    currentUserId: string;
    onClose: () => void;
    onUpdate?: (employee: Employee) => void;
}

type TabType = 'personal' | 'compensation' | 'family' | 'documents' | 'warnings';

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
    employee,
    currentUserId,
    onClose,
    onUpdate
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('personal');

    const tabs = [
        { id: 'personal' as TabType, label: 'Personal Info', icon: '👤' },
        { id: 'compensation' as TabType, label: 'Compensation', icon: '💰' },
        { id: 'family' as TabType, label: 'Family & Dependents', icon: '👨‍👩‍👧‍👦' },
        { id: 'documents' as TabType, label: 'Documents', icon: '📄' },
        { id: 'warnings' as TabType, label: 'Warnings', icon: '⚠️' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0f3443] to-cyan-900 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {employee.avatarUrl ? (
                                <img
                                    src={employee.avatarUrl}
                                    alt={employee.name}
                                    className="w-16 h-16 rounded-full border-4 border-white"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full border-4 border-white bg-cyan-600 flex items-center justify-center text-2xl">
                                    {employee.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">{employee.name}</h2>
                                <p className="text-cyan-100">{employee.role}</p>
                                <p className="text-sm text-cyan-200">{employee.employeeId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex space-x-1 px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 font-medium text-sm transition-all flex items-center space-x-2 ${activeTab === tab.id
                                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'personal' && (
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[#0f3443] mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="text-gray-900">{employee.name}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                    <div className="text-gray-900 font-mono">{employee.employeeId}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <div className="text-gray-900">{employee.department}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <div className="text-gray-900">{employee.role}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <div className="text-gray-900">{employee.location}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                    <div className="text-gray-900">{new Date(employee.hireDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${employee.status === EmployeeStatus.Active
                                            ? 'bg-green-100 text-green-800'
                                            : employee.status === EmployeeStatus.OnLeave
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {employee.status}
                                        </span>
                                    </div>
                                </div>
                                {employee.terminationDate && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Termination Date</label>
                                            <div className="text-gray-900">{new Date(employee.terminationDate).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Termination Reason</label>
                                            <div className="text-gray-900">{employee.terminationReason}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'compensation' && (
                        <div className="p-8 animate-fade-in">
                            <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Financial Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-card p-6 rounded-2xl border border-white/5">
                                    <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Base Matrix (Basic Salary)</label>
                                    <div className="text-xl font-black text-white tracking-tight">{employee.basic_salary?.toLocaleString() ?? '500,000'} <span className="text-[10px] text-slate-500 font-bold ml-1">RWF</span></div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-white/5">
                                    <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Mobility Credit (Transport)</label>
                                    <div className="text-xl font-black text-white tracking-tight">{employee.transport_allowance?.toLocaleString() ?? '50,000'} <span className="text-[10px] text-slate-500 font-bold ml-1">RWF</span></div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-white/5">
                                    <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Shelter Allocation (Housing)</label>
                                    <div className="text-xl font-black text-white tracking-tight">{employee.housing_allowance?.toLocaleString() ?? '0'} <span className="text-[10px] text-slate-500 font-bold ml-1">RWF</span></div>
                                </div>
                                <div className="glass-card p-6 rounded-2xl border border-white/5">
                                    <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">Supplemental Assets (Other)</label>
                                    <div className="text-xl font-black text-white tracking-tight">{employee.other_allowances?.toLocaleString() ?? '0'} <span className="text-[10px] text-slate-500 font-bold ml-1">RWF</span></div>
                                </div>
                            </div>
                            <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Total Monthly Gross Intel</span>
                                    <span className="text-2xl font-black text-white tracking-tighter">
                                        {((employee.basic_salary ?? 500000) + (employee.transport_allowance ?? 50000) + (employee.housing_allowance ?? 0) + (employee.other_allowances ?? 0)).toLocaleString()} <span className="text-xs text-slate-500">RWF</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'family' && (
                        <DependentsTab employeeId={employee.id} />
                    )}

                    {activeTab === 'documents' && (
                        <DocumentsTab employeeId={employee.id} />
                    )}

                    {activeTab === 'warnings' && (
                        <WarningsTab employeeId={employee.id} currentUserId={currentUserId} />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailModal;
