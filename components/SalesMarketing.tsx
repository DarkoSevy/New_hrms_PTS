
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Employee, Department } from '../types';
import {
    SalesMarketingIcon,
    PlusIcon,
    PhoneIcon,
    EnvelopeIcon,
    UserIcon,
    CalendarDaysIcon,
    EditIcon,
    TrashIcon,
    CheckCircleIcon,
} from './icons';

interface SalesMarketingProps {
    employees: Employee[];
}

const initialLeads: Lead[] = [
    { id: '1', companyName: 'Acme Corp', contactPerson: 'John Smith', email: 'john@acme.com', phone: '555-0101', status: LeadStatus.New, value: 50000, source: 'Website', createdAt: '2024-07-20' },
    { id: '2', companyName: 'Global Tech', contactPerson: 'Sarah Johnson', email: 'sarah@globaltech.com', phone: '555-0102', status: LeadStatus.Contacted, value: 120000, source: 'Referral', assignedTo: '7', createdAt: '2024-07-18' },
    { id: '3', companyName: 'Small Biz Inc', contactPerson: 'Mike Brown', email: 'mike@smallbiz.com', phone: '555-0103', status: LeadStatus.Proposal, value: 15000, source: 'Cold Call', assignedTo: '3', createdAt: '2024-07-15' },
];

const SalesMarketing: React.FC<SalesMarketingProps> = ({ employees }) => {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    const salesTeam = employees.filter(e => e.department === Department.Commercial);

    const handleOpenModal = (lead: Lead | null = null) => {
        setEditingLead(lead);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLead(null);
    };

    const handleSaveLead = (data: Omit<Lead, 'id'> & { id?: string }) => {
        if (data.id) {
            setLeads(leads.map(l => l.id === data.id ? { ...l, ...data } as Lead : l));
        } else {
            const newLead: Lead = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0] };
            setLeads([newLead, ...leads]);
        }
        handleCloseModal();
    };

    const handleDeleteLead = (id: string) => {
        setLeads(leads.filter(l => l.id !== id));
    };

    const statusColors = {
        [LeadStatus.New]: 'bg-blue-100 text-blue-800',
        [LeadStatus.Contacted]: 'bg-indigo-100 text-indigo-800',
        [LeadStatus.Qualified]: 'bg-purple-100 text-purple-800',
        [LeadStatus.Proposal]: 'bg-yellow-100 text-yellow-800',
        [LeadStatus.Won]: 'bg-green-100 text-green-800',
        [LeadStatus.Lost]: 'bg-red-100 text-red-800',
    };

    const totalPipelineValue = useMemo(() => leads.reduce((sum, lead) => sum + lead.value, 0), [leads]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#0f3443]">Sales & Marketing</h2>
                    <p className="text-gray-500">Track leads, manage campaigns, and monitor pipeline.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add Lead
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-cyan-500">
                    <p className="text-gray-500 text-sm font-medium">Total Pipeline Value</p>
                    <p className="text-3xl font-bold text-[#0f3443]">${totalPipelineValue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-medium">Won Leads (This Month)</p>
                    <p className="text-3xl font-bold text-[#0f3443]">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm font-medium">Active Leads</p>
                    <p className="text-3xl font-bold text-[#0f3443]">{leads.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-[#0f3443]">Lead Pipeline</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold">Company / Contact</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Value</th>
                                <th className="p-4 font-semibold">Source</th>
                                <th className="p-4 font-semibold">Assigned To</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const assigned = employees.find(e => e.id === lead.assignedTo);
                                return (
                                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-[#0f3443]">{lead.companyName}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <UserIcon className="w-3 h-3" /> {lead.contactPerson}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium">${lead.value.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-600">{lead.source}</td>
                                        <td className="p-4">
                                            {assigned ? (
                                                <div className="flex items-center gap-2">
                                                    <img src={assigned.avatarUrl} alt={assigned.name} className="w-6 h-6 rounded-full" />
                                                    <span className="text-sm">{assigned.name}</span>
                                                </div>
                                            ) : <span className="text-gray-400 text-sm italic">Unassigned</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenModal(lead)} className="text-gray-400 hover:text-[#0f3443]"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteLead(lead.id)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
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
                <LeadModal
                    lead={editingLead}
                    employees={salesTeam}
                    onSave={handleSaveLead}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

const LeadModal: React.FC<{
    lead: Lead | null;
    employees: Employee[];
    onSave: (data: Omit<Lead, 'id' | 'createdAt'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ lead, employees, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: lead?.id,
        companyName: lead?.companyName || '',
        contactPerson: lead?.contactPerson || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        status: lead?.status || LeadStatus.New,
        value: lead?.value || 0,
        source: lead?.source || '',
        assignedTo: lead?.assignedTo || '',
        notes: lead?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as any);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold text-[#0f3443]">{lead ? 'Edit Lead' : 'New Lead'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Contact Person</label>
                            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Estimated Value ($)</label>
                            <input type="number" name="value" value={formData.value} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Source</label>
                            <input type="text" name="source" value={formData.source} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g. Website, Referral" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Assigned To</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="">Unassigned</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#0f3443]/90 mb-1">Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                        </div>
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

export default SalesMarketing;
