

import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: Changed import from 'import type' to a regular import for enums to be used as values.
import { Vacancy, Candidate, Employee, VacancyStatus, CandidateStage } from '../types';
import { 
    BriefcaseIcon, 
    PlusIcon, 
    UserGroupIcon, 
    PaperClipIcon, 
    SearchIcon,
    MapPinIcon,
    CalendarDaysIcon,
    ChevronDownIcon,
    EditIcon,
    TrashIcon,
    XCircleIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon
} from './icons';

interface RecruitmentProps {
    vacancies: Vacancy[];
    candidates: Candidate[];
    employees: Employee[];
    // FIX: Added onUpdateVacancies to allow updating vacancies from this component
    onUpdateVacancies: (vacancies: Vacancy[]) => void;
    onUpdateCandidates: (candidates: Candidate[]) => void;
}

const statusMap: { [key in VacancyStatus]: { text: string; bg: string; dot: string } } = {
    [VacancyStatus.Open]: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
    [VacancyStatus.OnHold]: { text: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
    [VacancyStatus.Closed]: { text: 'text-slate-400', bg: 'bg-white/10', dot: 'bg-slate-400' },
};

const stageColors: { [key in CandidateStage]: { bg: string, border: string } } = {
    [CandidateStage.Sourced]: { bg: 'bg-blue-500/5', border: 'border-blue-500/50' },
    [CandidateStage.Screening]: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/50' },
    [CandidateStage.Interview]: { bg: 'bg-purple-500/5', border: 'border-purple-500/50' },
    [CandidateStage.Offer]: { bg: 'bg-amber-500/5', border: 'border-amber-500/50' },
    [CandidateStage.Hired]: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/50' },
    [CandidateStage.Rejected]: { bg: 'bg-rose-500/5', border: 'border-rose-500/50' },
};

const KANBAN_STAGES: CandidateStage[] = [
    CandidateStage.Sourced,
    CandidateStage.Screening,
    CandidateStage.Interview,
    CandidateStage.Offer,
];

const KANBAN_END_STAGES: CandidateStage[] = [
    CandidateStage.Hired,
    CandidateStage.Rejected
];


const SearchableEmployeeDropdown: React.FC<{
    employees: Employee[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ employees, value, onChange, placeholder = "Select an employee" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedEmployee = employees.find(e => e.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center p-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-500">
                {selectedEmployee ? (
                    <>
                        <img src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="w-6 h-6 rounded-full mr-2" />
                        <span className="flex-grow">{selectedEmployee.name}</span>
                    </>
                ) : (
                    <span className="flex-grow text-gray-500">{placeholder}</span>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg animate-fade-in-down">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full p-2 border border-gray-200 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredEmployees.map(employee => (
                            <li
                                key={employee.id}
                                className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    onChange(employee.id);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                <img src={employee.avatarUrl} alt={employee.name} className="w-6 h-6 rounded-full mr-2" />
                                <span>{employee.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const VacancyModal: React.FC<{
    vacancy: Vacancy | null;
    employees: Employee[];
    onSave: (data: Omit<Vacancy, 'id'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ vacancy, employees, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: vacancy?.id || undefined,
        title: vacancy?.title || '',
        department: vacancy?.department || '',
        location: vacancy?.location || '',
        employmentType: vacancy?.employmentType || 'Full-time',
        description: vacancy?.description || '',
        hiringManagerId: vacancy?.hiringManagerId || '',
        status: vacancy?.status || VacancyStatus.Open,
        postedDate: vacancy?.postedDate || new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.hiringManagerId) {
            alert("Please select a hiring manager.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold text-[#0f3443]">{vacancy ? 'Edit Vacancy' : 'Create New Vacancy'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-2">
                        <label htmlFor="password" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Cipher</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Department</label>
                            <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Location</label>
                            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="employmentType" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Employment Type</label>
                            <select name="employmentType" id="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="hiringManagerId" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Hiring Manager</label>
                            <SearchableEmployeeDropdown employees={employees} value={formData.hiringManagerId} onChange={(val) => setFormData(p => ({...p, hiringManagerId: val}))}/>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Job Description</label>
                            <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required></textarea>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required>
                                {Object.values(VacancyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-[#0f3443] rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#0f3443] text-white rounded-md hover:bg-[#1a5a73] font-semibold">{vacancy ? 'Save Changes' : 'Create Vacancy'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CandidateModal: React.FC<{
    candidate: Candidate | null;
    vacancyId: string;
    onSave: (data: Omit<Candidate, 'id' | 'avatarUrl'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ candidate, vacancyId, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: candidate?.id || undefined,
        vacancyId: candidate?.vacancyId || vacancyId,
        name: candidate?.name || '',
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        stage: candidate?.stage || CandidateStage.Sourced,
        appliedDate: candidate?.appliedDate || new Date().toISOString().split('T')[0],
        resumeUrl: candidate?.resumeUrl || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold text-[#0f3443]">{candidate ? 'Edit Candidate' : 'Add New Candidate'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-[#0f3443]/90 mb-1 flex items-center gap-2"><UserIcon className="w-4 h-4 text-gray-400"/> Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#0f3443]/90 mb-1 flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-gray-400"/> Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[#0f3443]/90 mb-1 flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-gray-400"/> Phone</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="resumeUrl" className="block text-sm font-medium text-[#0f3443]/90 mb-1 flex items-center gap-2"><PaperClipIcon className="w-4 h-4 text-gray-400"/> Resume URL / File</label>
                            <input type="text" name="resumeUrl" id="resumeUrl" value={formData.resumeUrl} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="https://linkedin.com/in/... or upload"/>
                        </div>
                    </div>
                     <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-[#0f3443] rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#0f3443] text-white rounded-md hover:bg-[#1a5a73] font-semibold">{candidate ? 'Save Changes' : 'Add Candidate'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CandidateCard: React.FC<{ 
    candidate: Candidate; 
    onDragStart: (e: React.DragEvent<HTMLDivElement>, candidateId: string) => void;
    onEdit: (candidate: Candidate) => void;
    onDelete: (candidateId: string) => void;
}> = ({ candidate, onDragStart, onEdit, onDelete }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, candidate.id)}
        className="glass-card p-4 rounded-2xl border border-white/5 border-t-white/10 shadow-xl mb-4 cursor-grab active:cursor-grabbing group transition-all hover:scale-[1.02] hover:border-cyan-400/20"
    >
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <img src={candidate.avatarUrl} alt={candidate.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-inner" />
                <div>
                    <p className="font-black text-xs text-white uppercase tracking-tight">{candidate.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{candidate.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(candidate)} className="p-1 text-gray-400 hover:text-cyan-600"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => onDelete(candidate.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
            </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-3.5 h-3.5 opacity-50"/>
                <span>{candidate.appliedDate}</span>
            </div>
            {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline"><PaperClipIcon className="w-3 h-3 inline -mt-0.5"/> Resume</a>}
        </div>
    </div>
);

const KanbanColumn: React.FC<{ 
    stage: CandidateStage; 
    candidates: Candidate[]; 
    onDragStart: (e: React.DragEvent<HTMLDivElement>, candidateId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, stage: CandidateStage) => void;
    onEditCandidate: (candidate: Candidate) => void;
    onDeleteCandidate: (candidateId: string) => void;
}> = ({ stage, candidates, onDragStart, onDrop, onEditCandidate, onDeleteCandidate }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    return (
        <div 
            className="flex-1 min-w-[280px]"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { onDrop(e, stage); setIsDragOver(false); }}
        >
            <div className={`p-4 rounded-3xl h-full transition-all border border-transparent ${isDragOver ? 'bg-cyan-500/10 border-cyan-500/20 scale-[1.01]' : 'bg-white/5'}`}>
                <div className={`flex items-center justify-between px-3 py-2 mb-6 border-l-4 ${stageColors[stage].border} relative`}>
                    <h3 className="font-black text-[11px] text-white uppercase tracking-widest">{stage}</h3>
                    <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-lg border border-white/10 ${stageColors[stage].border.replace('border-', 'bg-').split('/')[0] + '/20'}`}>{candidates.length}</span>
                </div>
                <div>
                    {candidates.map(candidate => (
                        <CandidateCard key={candidate.id} candidate={candidate} onDragStart={onDragStart} onEdit={onEditCandidate} onDelete={onDeleteCandidate} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const Recruitment: React.FC<RecruitmentProps> = ({ vacancies, candidates, employees, onUpdateVacancies, onUpdateCandidates }) => {
    const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(vacancies.find(v => v.status === 'Open')?.id || vacancies[0]?.id || null);
    const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
    const [vacancySearchTerm, setVacancySearchTerm] = useState('');
    const [modalState, setModalState] = useState<{ type: 'vacancy' | 'candidate' | null; data: Vacancy | Candidate | null }>({ type: null, data: null });

    const filteredVacancies = useMemo(() => {
        return vacancies.filter(v => v.title.toLowerCase().includes(vacancySearchTerm.toLowerCase()));
    }, [vacancies, vacancySearchTerm]);
    
    const selectedVacancy = useMemo(() => {
        return vacancies.find(v => v.id === selectedVacancyId);
    }, [selectedVacancyId, vacancies]);
    
    const candidatesForSelectedVacancy = useMemo(() => {
        return candidates.filter(c => c.vacancyId === selectedVacancyId);
    }, [selectedVacancyId, candidates]);

    const candidatesByStage = useMemo(() => {
        const pipelineStages = KANBAN_STAGES.reduce((acc, stage) => {
            acc[stage] = candidatesForSelectedVacancy.filter(c => c.stage === stage);
            return acc;
        }, {} as Record<CandidateStage, Candidate[]>);

        const endStages = KANBAN_END_STAGES.reduce((acc, stage) => {
            acc[stage] = candidatesForSelectedVacancy.filter(c => c.stage === stage);
            return acc;
        }, {} as Record<CandidateStage, Candidate[]>);

        return { pipeline: pipelineStages, end: endStages };
    }, [candidatesForSelectedVacancy]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, candidateId: string) => {
        setDraggedCandidateId(candidateId);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: CandidateStage) => {
        if (!draggedCandidateId) return;
        const updatedCandidates = candidates.map(c => 
            c.id === draggedCandidateId ? { ...c, stage: newStage } : c
        );
        onUpdateCandidates(updatedCandidates);
        setDraggedCandidateId(null);
    };

    const handleOpenModal = (type: 'vacancy' | 'candidate', data: Vacancy | Candidate | null = null) => {
        setModalState({ type, data });
    };

    const handleCloseModal = () => {
        setModalState({ type: null, data: null });
    };

    const handleSaveVacancy = (data: Omit<Vacancy, 'id'> & { id?: string }) => {
        if (data.id) { // Editing
            onUpdateVacancies(vacancies.map(v => v.id === data.id ? { ...v, ...data } as Vacancy : v));
        } else { // Adding
            const newVacancy: Vacancy = { ...data, id: crypto.randomUUID() };
            onUpdateVacancies([newVacancy, ...vacancies]);
        }
        handleCloseModal();
    };

    const handleDeleteVacancy = (vacancyId: string) => {
        if (window.confirm("Are you sure you want to delete this vacancy and all its candidates?")) {
            onUpdateVacancies(vacancies.filter(v => v.id !== vacancyId));
            onUpdateCandidates(candidates.filter(c => c.vacancyId !== vacancyId));
            if (selectedVacancyId === vacancyId) {
                setSelectedVacancyId(vacancies[0]?.id || null);
            }
        }
    };

    const handleSaveCandidate = (data: Omit<Candidate, 'id' | 'avatarUrl'> & { id?: string }) => {
        if (data.id) { // Editing
            onUpdateCandidates(candidates.map(c => c.id === data.id ? { ...c, ...data } as Candidate : c));
        } else { // Adding
            const newCandidate: Candidate = { 
                ...data, 
                id: crypto.randomUUID(),
                avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`
            };
            onUpdateCandidates([newCandidate, ...candidates]);
        }
        handleCloseModal();
    };
    
    const handleDeleteCandidate = (candidateId: string) => {
        onUpdateCandidates(candidates.filter(c => c.id !== candidateId));
    };


    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {modalState.type === 'vacancy' && <VacancyModal vacancy={modalState.data as Vacancy} employees={employees} onSave={handleSaveVacancy} onClose={handleCloseModal} />}
            {modalState.type === 'candidate' && selectedVacancyId && <CandidateModal candidate={modalState.data as Candidate} vacancyId={selectedVacancyId} onSave={handleSaveCandidate} onClose={handleCloseModal} />}

            {/* Left Panel: Vacancies List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 h-full">
                <div className="glass-card rounded-[2rem] border border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Openings</h2>
                            <button onClick={() => handleOpenModal('vacancy')} className="executive-gradient text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                + New
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                            <input type="text" placeholder="Filter Intel..." value={vacancySearchTerm} onChange={(e) => setVacancySearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"/>
                        </div>
                    </div>
                    <div className="overflow-y-auto">
                        {filteredVacancies.map(vacancy => {
                            const candidateCount = candidates.filter(c => c.vacancyId === vacancy.id).length;
                            const manager = employees.find(e => e.id === vacancy.hiringManagerId);
                            return (
                                <button key={vacancy.id} onClick={() => setSelectedVacancyId(vacancy.id)} className={`w-full text-left p-6 border-l-4 transition-all group ${selectedVacancyId === vacancy.id ? 'bg-cyan-500/5 border-cyan-400' : 'border-transparent hover:bg-white/5'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-white text-xs uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{vacancy.title}</h3>
                                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusMap[vacancy.status].bg} ${statusMap[vacancy.status].text} border border-white/5`}>
                                            <span className={`w-1 h-1 rounded-full ${statusMap[vacancy.status].dot}`}></span>
                                            {vacancy.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vacancy.department}</p>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2 opacity-60"><MapPinIcon className="w-3 h-3"/><span>{vacancy.location}</span></div>
                                        <div className="flex items-center gap-2 opacity-60"><UserGroupIcon className="w-3 h-3"/><span>{candidateCount} Nodes</span></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel: Kanban Board */}
            <div className="flex-1 flex flex-col min-h-0">
                {selectedVacancy ? (
                     <div className="glass-card rounded-3xl border border-white/5 p-8 mb-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{selectedVacancy.title}</h2>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">{selectedVacancy.department} &middot; {selectedVacancy.location}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleOpenModal('vacancy', selectedVacancy)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"><EditIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteVacancy(selectedVacancy.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"><TrashIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleOpenModal('candidate')} className="executive-gradient text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] ml-2">
                                    + Add Candidate
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-sm text-center text-gray-500">
                        <div>
                            <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <h3 className="mt-2 text-lg font-semibold">Select a Job Opening</h3>
                            <p>Choose a position from the left to view the candidate pipeline.</p>
                        </div>
                    </div>
                )}
                {selectedVacancy && (
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4 min-h-full">
                            {KANBAN_STAGES.map(stage => (
                                <KanbanColumn key={stage} stage={stage} candidates={candidatesByStage.pipeline[stage] || []} onDragStart={handleDragStart} onDrop={handleDrop} onEditCandidate={(c) => handleOpenModal('candidate', c)} onDeleteCandidate={handleDeleteCandidate}/>
                            ))}
                            <div className="flex-1 min-w-[280px] space-y-4">
                                {KANBAN_END_STAGES.map(stage => (
                                    <KanbanColumn key={stage} stage={stage} candidates={candidatesByStage.end[stage] || []} onDragStart={handleDragStart} onDrop={handleDrop} onEditCandidate={(c) => handleOpenModal('candidate', c)} onDeleteCandidate={handleDeleteCandidate}/>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recruitment;