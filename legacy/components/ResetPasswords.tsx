import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SystemUser } from '../types';
import {
    UserIcon,
    EnvelopeIcon,
    LockClosedIcon,
    KeyIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    EyeIcon,
    EyeSlashIcon,
    SearchIcon,
} from './icons';
import { TacticalButton } from './ui/TacticalButton';

interface ResetPasswordsProps {
    users: SystemUser[];
}

const SearchableUserDropdown: React.FC<{
    users: SystemUser[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ users, value, onChange, placeholder = "Select a node..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedUser = users.find(u => u.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative animate-fade-in" ref={dropdownRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center p-3 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-cyan-500/30 hover:bg-white/10 transition-all font-bold group"
            >
                {selectedUser ? (
                    <>
                        <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-6 h-6 rounded-lg mr-3 border border-white/10 object-cover" />
                        <span className="flex-grow font-black text-white uppercase tracking-tight text-sm">{selectedUser.name}</span>
                    </>
                ) : (
                    <span className="flex-grow text-slate-500 text-[10px] uppercase font-black tracking-widest">{placeholder}</span>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-white'}`} />
            </button>
            
            {isOpen && (
                <div className="absolute z-50 top-full mt-2 w-full glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in-down overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-black/20">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                            <input
                                type="text"
                                placeholder="Locate user signifier..."
                                className="w-full p-2.5 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/50 outline-none text-xs font-black uppercase tracking-widest transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <li
                                key={user.id}
                                className="p-3 flex items-center hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                onClick={() => {
                                    onChange(user.id);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-xl object-cover mr-3 border border-white/10" />
                                <div>
                                    <p className="font-black text-white text-xs uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500">{user.email}</p>
                                </div>
                            </li>
                        )) : (
                            <li className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">No active nodes match criteria</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ResetPasswords: React.FC<ResetPasswordsProps> = ({ users }) => {
    const initialFormState = {
        selectedUserId: '',
        newPassword: '',
        confirmPassword: '',
        forceChangeOnLogin: true,
        sendEmail: true,
    };
    
    const [formData, setFormData] = useState(initialFormState);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success'>('idle');
    const [submittedUserName, setSubmittedUserName] = useState('');

    const selectedUser = useMemo(() => {
        return users.find(u => u.id === formData.selectedUserId);
    }, [formData.selectedUserId, users]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleGeneratePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        let newPassword = '';
        for (let i = 0; i < 16; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({
            ...prev,
            newPassword: newPassword,
            confirmPassword: newPassword,
        }));
    };
    
    const resetForm = () => {
        setFormData(initialFormState);
        setPasswordVisible(false);
        setConfirmPasswordVisible(false);
        setSubmissionStatus('idle');
        setSubmittedUserName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || formData.newPassword !== formData.confirmPassword || !formData.newPassword) {
            return;
        }
        console.log("Password reset for:", selectedUser.name, { ...formData });
        setSubmittedUserName(selectedUser.name);
        setSubmissionStatus('success');
    };

    useEffect(() => {
        let timer: number;
        if (submissionStatus === 'success') {
            timer = window.setTimeout(resetForm, 4000);
        }
        return () => clearTimeout(timer);
    }, [submissionStatus]);

    const passwordMismatch = formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword;
    const isFormValid = selectedUser && formData.newPassword && !passwordMismatch;

    // Tactical input classes
    const inputClassesWithIcon = "w-full bg-white/5 border border-white/10 text-white pl-12 pr-12 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold";
    const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2";

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
            <div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Reset Security Protocols</h2>
                 <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Force regeneration of user authentication credentials</p>
            </div>
            
            <form onSubmit={handleSubmit} className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden">
                {submissionStatus === 'success' && (
                    <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/20 animate-fade-in" role="alert">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-2 rounded-xl">
                                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Protocol Reset Accepted</p>
                                <p className="text-xs font-bold text-emerald-500/70 mt-1">New cryptography injected for node: {submittedUserName}.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 lg:p-12 space-y-8">
                    <div>
                        <label className={`${labelClasses} flex items-center gap-2`}>
                            <UserIcon className="w-4 h-4 text-cyan-500"/>
                            Target Node Signifier
                        </label>
                        <SearchableUserDropdown 
                            users={users} 
                            value={formData.selectedUserId} 
                            onChange={(userId) => setFormData(prev => ({...prev, selectedUserId: userId}))}
                        />
                    </div>

                    {selectedUser && (
                         <div className="p-5 bg-white/5 rounded-2xl border border-white/10 grid grid-cols-2 gap-4 animate-fade-in shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full translate-x-1/3 -translate-y-1/2"></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Alias</p>
                                <p className="text-cyan-400 font-mono text-sm font-bold mt-1">{selectedUser.username}</p>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comm Link</p>
                                <p className="text-white text-sm font-bold mt-1 truncate">{selectedUser.email}</p>
                            </div>
                        </div>
                    )}

                    <div className={`transition-all duration-500 ease-in-out ${selectedUser ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none -translate-y-4'}`}>
                        <div className="pt-8 border-t border-white/10">
                             <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                 <KeyIcon className="w-5 h-5 text-cyan-500" /> 
                                 New Cipher Sequence
                             </h3>
                             
                             <div className="space-y-6">
                                <div>
                                    <label htmlFor="newPassword" className={labelClasses}>Inject New Password</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-grow">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"><LockClosedIcon className="w-5 h-5 text-white/30" /></span>
                                            <input 
                                                type={passwordVisible ? 'text' : 'password'} 
                                                name="newPassword" 
                                                id="newPassword" 
                                                value={formData.newPassword} 
                                                onChange={handleChange} 
                                                className={`${inputClassesWithIcon} font-mono text-cyan-50`} 
                                                required 
                                            />
                                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/30 hover:text-cyan-400 transition-colors" aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
                                                {passwordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button type="button" onClick={handleGeneratePassword} className="px-5 bg-white/5 text-cyan-400 border border-white/10 rounded-2xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all font-black text-[10px] uppercase tracking-widest">
                                            Auto-Gen
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="confirmPassword" className={labelClasses}>Verify Cipher</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"><LockClosedIcon className={`w-5 h-5 ${passwordMismatch ? 'text-rose-500/50' : 'text-white/30'}`} /></span>
                                        <input 
                                            type={confirmPasswordVisible ? 'text' : 'password'} 
                                            name="confirmPassword" 
                                            id="confirmPassword" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            className={`w-full bg-white/5 border text-white pl-12 pr-12 py-3 rounded-2xl font-mono focus:outline-none transition-all ${passwordMismatch ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)] focus:border-rose-500' : 'border-white/10 focus:ring-2 focus:ring-cyan-500/50'}`} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/30 hover:text-cyan-400 transition-colors" aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}>
                                            {confirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordMismatch && <p className="text-[10px] text-rose-400 font-bold tracking-widest uppercase mt-2">Ciphers do not match</p>}
                                </div>
                             </div>
                        </div>

                         <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                            <div className="relative flex items-center group">
                                <input id="forceChangeOnLogin" name="forceChangeOnLogin" type="checkbox" checked={formData.forceChangeOnLogin} onChange={handleChange} className="w-5 h-5 bg-white/5 border border-white/10 rounded cursor-pointer checked:bg-cyan-500 checked:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:ring-offset-0 appearance-none transition-colors" />
                                <CheckCircleIcon className="w-3.5 h-3.5 text-black absolute left-[3px] pointer-events-none opacity-0 data-[checked=true]:opacity-100" data-checked={formData.forceChangeOnLogin} />
                                <label htmlFor="forceChangeOnLogin" className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group-hover:text-white transition-colors">Enforce forced regeneration via next nodal entry</label>
                            </div>
                            <div className="relative flex items-center group">
                                <input id="sendEmail" name="sendEmail" type="checkbox" checked={formData.sendEmail} onChange={handleChange} className="w-5 h-5 bg-white/5 border border-white/10 rounded cursor-pointer checked:bg-cyan-500 checked:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:ring-offset-0 appearance-none transition-colors" />
                                <CheckCircleIcon className="w-3.5 h-3.5 text-black absolute left-[3px] pointer-events-none opacity-0 data-[checked=true]:opacity-100" data-checked={formData.sendEmail} />
                                <label htmlFor="sendEmail" className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group-hover:text-white transition-colors">Dispatch new sequence via comm channel</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-black/20 flex flex-col sm:flex-row justify-end gap-4 border-t border-white/5">
                    <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto">Clear Data</button>
                    {/* Native button for disabled functionality, styled like TacticalButton primary */}
                    <button 
                        type="submit" 
                        disabled={!isFormValid} 
                        className={`executive-gradient text-black px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full sm:w-auto ${
                            isFormValid 
                                ? 'hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                                : 'opacity-50 cursor-not-allowed grayscale'
                        }`}
                    >
                        Execute Reset
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResetPasswords;
