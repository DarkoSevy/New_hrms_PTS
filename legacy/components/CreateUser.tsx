import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { SystemRole } from '../types';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    KeyIcon,
    SparklesIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    ChevronDownIcon,
} from './icons';
import { TacticalButton } from './ui/TacticalButton';

interface SystemRoleDefinition {
    id: string;
    name: string;
}

interface CreateUserProps {
    roles: SystemRoleDefinition[];
    onUserCreate: (newUser: any) => void;
}

const CreateUser: React.FC<CreateUserProps> = ({ roles, onUserCreate }) => {
    const initialFormData = {
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: roles.find(r => r.name === 'Employee')?.id || '',
        status: 'Active' as 'Active' | 'Inactive',
        sendWelcomeEmail: true,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarFileRef = useRef<File | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            avatarFileRef.current = file;
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGeneratePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let newPassword = '';
        for (let i = 0; i < 14; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({
            ...prev,
            password: newPassword,
            confirmPassword: newPassword,
        }));
    };

    const handleSuggestUsername = async () => {
        if (!formData.fullName) {
            alert('Please enter a full name first.');
            return;
        }
        setIsGeneratingUsername(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on the full name "${formData.fullName}", suggest one professional and unique username. The username should be lowercase, alphanumeric, and between 6 to 12 characters. Return only the username text, with no extra formatting or explanation.`,
            });
            const suggestedUsername = response.text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (suggestedUsername) {
                setFormData(prev => ({ ...prev, username: suggestedUsername }));
            }
        } catch (error) {
            console.error('Error suggesting username:', error);
            alert('Could not suggest a username at this time.');
        } finally {
            setIsGeneratingUsername(false);
        }
    };

    const handleReset = () => {
        setFormData(initialFormData);
        setAvatarPreview(null);
        avatarFileRef.current = null;
        setSubmissionStatus('idle');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        onUserCreate({ ...formData, avatar: avatarFileRef.current });
        setSubmissionStatus('success');
    };

    useEffect(() => {
        let timer: number;
        if (submissionStatus === 'success') {
            timer = window.setTimeout(() => {
                handleReset();
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [submissionStatus]);

    const passwordMismatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

    // Tactical input classes
    const inputClasses = "w-full bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold";
    const inputClassesWithIcon = "w-full bg-white/5 border border-white/10 text-white pl-12 pr-5 py-3 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-700 font-bold";
    const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2";

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Create System Node</h2>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Initialize new personnel access clearance</p>
            </div>
            
            <form onSubmit={handleSubmit} className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden">
                {submissionStatus === 'success' && (
                    <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/20 animate-fade-in" role="alert">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-2 rounded-xl">
                                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Node Compiled Successfully</p>
                                <p className="text-xs font-bold text-emerald-500/70 mt-1">Access credentials generated for {formData.fullName}.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 lg:p-12 border-b border-white/5">
                    {/* Identity Matrix */}
                    <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-cyan-500" /> 
                        Identity Matrix
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center text-center lg:col-span-1">
                            <label className={labelClasses}>Avatar Visual</label>
                            <div className="relative group rounded-[2rem] p-1 border border-white/10 bg-white/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                                <div className="h-40 w-40 rounded-[1.8rem] overflow-hidden bg-black/50 shadow-inner relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <UserIcon className="h-16 w-16 text-slate-600 group-hover:text-cyan-400/50 transition-colors" />
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-upload" className="absolute -bottom-4 bg-[#0f172a] border border-white/10 text-white text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-lg cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all shadow-xl">
                                    Capture Image
                                    <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>

                        {/* Name & Username */}
                        <div className="lg:col-span-3 space-y-6 lg:pl-4 mt-8 lg:mt-0">
                            <div>
                                <label htmlFor="fullName" className={labelClasses}>Legal Designation</label>
                                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label htmlFor="username" className={labelClasses}>System Alias</label>
                                <div className="flex gap-3">
                                    <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className={`${inputClasses} font-mono text-cyan-50`} required />
                                    <button 
                                        type="button" 
                                        onClick={handleSuggestUsername} 
                                        disabled={isGeneratingUsername || !formData.fullName} 
                                        title="Suggest with AI" 
                                        className="flex items-center gap-2 px-5 bg-white/5 text-cyan-400 border border-white/10 rounded-2xl hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-[10px] uppercase tracking-widest"
                                    >
                                        {isGeneratingUsername ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                        <span className="hidden sm:inline">AI Compute</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Access Layer */}
                    <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest border-t border-white/5 pt-10 mb-8 mt-10 flex items-center gap-3">
                        <LockClosedIcon className="w-5 h-5 text-cyan-500" /> 
                        Clearance Matrix
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label htmlFor="email" className={labelClasses}>Comm Link (Email)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <EnvelopeIcon className="w-5 h-5 text-white/30" />
                                </span>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClassesWithIcon} required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelClasses}>Signal Line (Phone) <span className="text-white/20 ml-2">Optional</span></label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <PhoneIcon className="w-5 h-5 text-white/30" />
                                </span>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputClassesWithIcon} />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password-field" className={labelClasses}>Cipher Encryption (Pass)</label>
                            <div className="flex gap-3">
                                <div className="relative flex-grow">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <LockClosedIcon className="w-5 h-5 text-white/30" />
                                    </span>
                                    <input 
                                        type={passwordVisible ? 'text' : 'password'} 
                                        name="password" 
                                        id="password-field" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className={`${inputClassesWithIcon} font-mono`} 
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
                            <label htmlFor="confirmPassword" className={labelClasses}>Verify Encryption</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <LockClosedIcon className={`w-5 h-5 ${passwordMismatch ? 'text-rose-500/50' : 'text-white/30'}`} />
                                </span>
                                <input 
                                    type={confirmPasswordVisible ? 'text' : 'password'} 
                                    name="confirmPassword" 
                                    id="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    className={`w-full bg-white/5 border text-white pl-12 pr-5 py-3 rounded-2xl font-mono focus:outline-none transition-all ${passwordMismatch ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)] focus:border-rose-500' : 'border-white/10 focus:ring-2 focus:ring-cyan-500/50'}`} 
                                    required 
                                />
                                <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/30 hover:text-cyan-400 transition-colors" aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}>
                                    {confirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {passwordMismatch && <p className="text-[10px] text-rose-400 font-bold tracking-widest uppercase mt-2">Ciphers do not match</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="role" className={labelClasses}>Operational Role Level</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <KeyIcon className="w-5 h-5 text-white/30" />
                                </span>
                                <select name="role" id="role" value={formData.role} onChange={handleChange} className={`${inputClassesWithIcon} appearance-none cursor-pointer`} required>
                                    {roles.map(r => <option key={r.id} value={r.id} className="bg-[#0f172a]">{r.name}</option>)}
                                </select>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <ChevronDownIcon className="w-5 h-5 text-white/30" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-black/20 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-6">
                    <div className="flex flex-col gap-5">
                        <div>
                            <label htmlFor="status-toggle" className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" id="status-toggle" className="sr-only" checked={formData.status === 'Active'} onChange={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))} />
                                    <div className="block bg-white/5 border border-white/10 w-14 h-7 rounded-full shadow-inner transition-colors"></div>
                                    <div className={`dot absolute left-[3px] top-[3px] bg-slate-400 w-5 h-5 rounded-full transition-transform ${formData.status === 'Active' ? 'transform translate-x-7 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : ''}`}></div>
                                </div>
                                <div className="ml-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-slate-500">Node Status:</span>
                                    <span className={formData.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'}>{formData.status}</span>
                                </div>
                            </label>
                        </div>
                        <div className="relative flex items-center group">
                            <input id="sendWelcomeEmail" name="sendWelcomeEmail" type="checkbox" checked={formData.sendWelcomeEmail} onChange={handleChange} className="w-5 h-5 bg-white/5 border border-white/10 rounded cursor-pointer checked:bg-cyan-500 checked:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:ring-offset-0 appearance-none transition-colors" />
                            <CheckCircleIcon className="w-3.5 h-3.5 text-black absolute left-[3px] pointer-events-none opacity-0 data-[checked=true]:opacity-100" data-checked={formData.sendWelcomeEmail} />
                            <label htmlFor="sendWelcomeEmail" className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group-hover:text-white transition-colors">Dispatch auto-manifest via encrypted channels</label>
                        </div>
                    </div>
                    <div className="flex gap-4 self-end sm:self-center">
                        <TacticalButton variant="ghost" type="button" onClick={handleReset}>Abort</TacticalButton>
                        <TacticalButton variant="primary" type="submit">Compile Node</TacticalButton>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;