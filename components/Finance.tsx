
import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord } from '../types';
import { formatRWF, usdToRWF } from '../utils/currencyUtils';
import {
    FinanceIcon,
    PlusIcon,
    DollarIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    EditIcon,
    TrashIcon,
} from './icons';

interface FinanceProps {
    employees: Employee[];
}

const initialPayrollRecords: PayrollRecord[] = [
    { id: '1', employeeId: '1', employeeName: 'John Doe', month: '2024-07', basicSalary: 6500000, allowances: 650000, deductions: 390000, netSalary: 6760000, status: 'Paid', paymentDate: '2024-07-31' },
    { id: '2', employeeId: '2', employeeName: 'Jane Smith', month: '2024-07', basicSalary: 7800000, allowances: 780000, deductions: 520000, netSalary: 8060000, status: 'Paid', paymentDate: '2024-07-31' },
];

const Finance: React.FC<FinanceProps> = ({ employees }) => {
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(initialPayrollRecords);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);

    const activeEmployees = employees.filter(e => e.status === 'Active');

    const handleOpenModal = (record: PayrollRecord | null = null) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const handleSaveRecord = (data: Omit<PayrollRecord, 'id' | 'employeeName'> & { id?: string }) => {
        const employee = employees.find(e => e.id === data.employeeId);
        if (!employee) return;

        if (data.id) {
            setPayrollRecords(payrollRecords.map(r =>
                r.id === data.id ? { ...r, ...data, employeeName: employee.name } : r
            ));
        } else {
            const newRecord: PayrollRecord = {
                ...data,
                id: crypto.randomUUID(),
                employeeName: employee.name
            };
            setPayrollRecords([newRecord, ...payrollRecords]);
        }
        handleCloseModal();
    };

    const handleDeleteRecord = (id: string) => {
        setPayrollRecords(payrollRecords.filter(r => r.id !== id));
    };

    const statusColors = {
        Draft: 'bg-white/10 text-slate-400 border border-white/5',
        Processed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        Paid: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    };

    const totalPayroll = useMemo(() =>
        payrollRecords.reduce((sum, r) => sum + r.netSalary, 0),
        [payrollRecords]
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Economic Flow</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 tracking-widest uppercase">Payroll, Discretionary Spend & Asset Allocation</p>
                </div>
                <button onClick={() => handleOpenModal()} className="executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center gap-3">
                    <PlusIcon className="w-5 h-5" />
                    Initialize Payroll
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                            <DollarIcon className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Aggregate</p>
                            <p className="text-3xl font-black text-white tracking-tight">{formatRWF(totalPayroll)}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                            <CheckCircleIcon className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cycles Completed</p>
                            <p className="text-3xl font-black text-white tracking-tight">{payrollRecords.filter(r => r.status === 'Paid').length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-orange-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
                            <CalendarDaysIcon className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Awaiting Transmission</p>
                            <p className="text-3xl font-black text-white tracking-tight">{payrollRecords.filter(r => r.status !== 'Paid').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Ledger Audits</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5">Node Identity</th>
                                <th className="px-6 py-5">Fiscal Cycle</th>
                                <th className="px-6 py-5">Base Alloc</th>
                                <th className="px-6 py-5">Subsidies</th>
                                <th className="px-6 py-5">Levies</th>
                                <th className="px-6 py-5">Net Credit</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payrollRecords.map(record => {
                                const employee = employees.find(e => e.id === record.employeeId);
                                return (
                                    <tr key={record.id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-6 py-5">
                                            {employee ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 flex items-center justify-center text-xs font-black text-cyan-400">
                                                        {(record.employeeName || 'U').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-xs uppercase tracking-tight">{record.employeeName}</p>
                                                        <p className="text-[10px] text-slate-600 font-medium">#{record.employeeId}</p>
                                                    </div>
                                                </div>
                                            ) : <span className="text-red-500 font-black text-xs">ERR_NULL</span>}
                                        </td>
                                        <td className="px-6 py-5 text-slate-300 font-mono text-[11px] whitespace-nowrap">{record.month}</td>
                                        <td className="px-6 py-5 text-slate-400 font-mono text-xs">{formatRWF(record.basicSalary)}</td>
                                        <td className="px-6 py-5 text-emerald-400 font-mono text-xs">+{formatRWF(record.allowances)}</td>
                                        <td className="px-6 py-5 text-rose-400 font-mono text-xs">-{formatRWF(record.deductions)}</td>
                                        <td className="px-6 py-5">
                                            <span className="text-white font-black text-xs tracking-tight">{formatRWF(record.netSalary)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[record.status]}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleOpenModal(record)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteRecord(record.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <PayrollModal
                    record={editingRecord}
                    employees={activeEmployees}
                    onSave={handleSaveRecord}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

const PayrollModal: React.FC<{
    record: PayrollRecord | null;
    employees: Employee[];
    onSave: (data: Omit<PayrollRecord, 'id' | 'employeeName'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ record, employees, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: record?.id,
        employeeId: record?.employeeId || '',
        month: record?.month || new Date().toISOString().slice(0, 7),
        basicSalary: record?.basicSalary || 0,
        allowances: record?.allowances || 0,
        deductions: record?.deductions || 0,
        netSalary: record?.netSalary || 0,
        status: record?.status || 'Draft',
        paymentDate: record?.paymentDate || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-calculate net salary
            if (['basicSalary', 'allowances', 'deductions'].includes(name)) {
                const basic = name === 'basicSalary' ? Number(value) : prev.basicSalary;
                const allow = name === 'allowances' ? Number(value) : prev.allowances;
                const deduct = name === 'deductions' ? Number(value) : prev.deductions;
                updated.netSalary = basic + allow - deduct;
            }
            return updated;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as any);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold text-[#0f3443]">{record ? 'Edit Payroll' : 'Generate Payroll'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Employee</label>
                            <select name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required>
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Month</label>
                            <input type="month" name="month" value={formData.month} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Basic Salary (FRw)</label>
                            <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Allowances (FRw)</label>
                            <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Deductions (FRw)</label>
                            <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Net Salary</label>
                            <p className="text-2xl font-bold text-green-600">{formatRWF(formData.netSalary)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="Draft">Draft</option>
                                <option value="Processed">Processed</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        {formData.status === 'Paid' && (
                            <div>
                                <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Payment Date</label>
                                <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-[#0f3443] rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#0f3443] text-white rounded-md hover:bg-[#1a5a73] font-semibold">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Finance;
