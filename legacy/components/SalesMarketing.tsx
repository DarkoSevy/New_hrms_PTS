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
import { StatusBadge } from './ui/StatusBadge';
import { TacticalButton } from './ui/TacticalButton';

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

    const totalPipelineValue = useMemo(() => leads.reduce((sum, lead) => sum + lead.value, 0), [leads]);
    const wonCount = useMemo(() => leads.filter(l => l.status === LeadStatus.Won).length, [leads]);
    const activeCount = useMemo(() => leads.filter(l => l.status !== LeadStatus.Won && l.status !== LeadStatus.Lost).length, [leads]);

    return (
        <div className="space-y-6 h-full flex flex-col pt-2 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center glass-card p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sales & Marketing</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Track leads, manage campaigns, and monitor pipeline</p>
                </div>
                <TacticalButton variant="primary" onClick={() => handleOpenModal()} icon={<PlusIcon className="w-5 h-5" />} className="relative z-10">
                    Add Lead
                </TacticalButton>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-[2rem] border border-white/5 border-l-4 border-l-cyan-500 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest relative z-10">Total Pipeline Value</p>
                    <p className="text-4xl font-black text-white mt-3 relative z-10">${totalPipelineValue.toLocaleString()}</p>
                </div>
                <div className="glass-card p-8 rounded-[2rem] border border-white/5 border-l-4 border-l-emerald-500 shadow-xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest relative z-10">Won Leads (This Month)</p>
                    <p className="text-4xl font-black text-emerald-400 mt-3 relative z-10">{wonCount}</p>
                </div>
                <div className="glass-card p-8 rounded-[2rem] border border-white/5 border-l-4 border-l-blue-500 shadow-xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest relative z-10">Active Leads</p>
                    <p className="text-4xl font-black text-white mt-3 relative z-10">{activeCount}</p>
                </div>
            </div>

            {/* Pipeline Table */}
            <div className="glass-card rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Lead Pipeline</h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company / Contact</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.map(lead => {
                                const assigned = employees.find(e => e.id === lead.assignedTo);
                                return (
                                    <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-white uppercase tracking-tight text-sm mb-1">{lead.companyName}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <UserIcon className="w-3 h-3" /> {lead.contactPerson}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <StatusBadge status={lead.status} />
                                        </td>
                                        <td className="p-6 font-mono font-bold text-cyan-400">${lead.value.toLocaleString()}</td>
                                        <td className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</td>
                                        <td className="p-6">
                                            {assigned ? (
                                                <div className="flex items-center gap-3">
                                                    <img src={assigned.avatarUrl} alt={assigned.name} className="w-8 h-8 rounded-xl object-cover border border-white/10" />
                                                    <span className="font-black text-white text-xs uppercase tracking-tight">{assigned.name}</span>
                                                </div>
                                            ) : <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Unassigned</span>}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenModal(lead)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-all border border-transparent hover:border-cyan-500/20"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteLead(lead.id)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all border border-transparent hover:border-rose-500/20"><TrashIcon className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-2xl font-black text-white tracking-tight">{lead ? 'Update Lead' : 'Initialize Lead'}</h3>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Commercial Pipeline Specs</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Person</label>
                            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Comm Link (Email)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Signal Line (Phone)</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer font-bold">
                                {Object.values(LeadStatus).map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estimated Value ($)</label>
                            <input type="number" name="value" value={formData.value} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-mono font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source Vector</label>
                            <input type="text" name="source" value={formData.source} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold" placeholder="e.g. Website, Referral" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Node</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer font-bold">
                                <option value="" className="bg-[#0f172a]">Unassigned</option>
                                {employees.map(e => <option key={e.id} value={e.id} className="bg-[#0f172a]">{e.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Field Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-medium resize-none"></textarea>
                        </div>
                    </div>
                    <div className="p-8 bg-black/20 flex justify-end gap-5">
                        <TacticalButton variant="ghost" type="button" onClick={onClose}>Dismiss</TacticalButton>
                        <TacticalButton variant="primary" type="submit">{lead ? 'Confirm Specs' : 'Execute Deploy'}</TacticalButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesMarketing;
