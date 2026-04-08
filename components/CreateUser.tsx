import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { SystemRole } from '../types';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    KeyIcon,
    IdentificationIcon,
    SparklesIcon,
    ArrowPathIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    // FIX: Import ChevronDownIcon
    ChevronDownIcon,
} from './icons';

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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443]">Create New System User</h2>
                <p className="text-gray-500">Fill in the details below to create a new user account.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-sm">
                    {submissionStatus === 'success' && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-t-xl animate-fade-in-down" role="alert">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">User Created Successfully</p>
                                    <p className="text-sm text-green-700">The new user account for {formData.fullName} has been created.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-[#0f3443] border-b pb-2 mb-6 flex items-center gap-2"><UserIcon className="w-5 h-5" /> User Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-sm font-medium text-[#0f3443]/90 mb-2">Profile Picture</label>
                                <div className="mt-1">
                                    <span className="inline-block h-28 w-28 rounded-full overflow-hidden bg-gray-100 shadow-inner">
                                        {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <UserIcon className="h-full w-full text-gray-300 p-5" />}
                                    </span>
                                    <label htmlFor="avatar-upload" className="mt-4 inline-block cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        <span>Upload Image</span>
                                        <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Full Name</label>
                                    <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500" required />
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Username</label>
                                    <div className="flex gap-2">
                                        <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500" required />
                                        <button type="button" onClick={handleSuggestUsername} disabled={isGeneratingUsername || !formData.fullName} title="Suggest with AI" className="flex items-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-md hover:bg-cyan-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                                            {isGeneratingUsername ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                            <span className="text-sm font-semibold">Suggest</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-[#0f3443] border-b pb-2 mb-6 mt-10 flex items-center gap-2"><LockClosedIcon className="w-5 h-5" /> Credentials & Access</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Email Address</label>
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><EnvelopeIcon className="w-5 h-5 text-gray-400" /></span><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full pl-10 p-2 border border-gray-300 rounded-md" required /></div>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Phone Number <span className="text-gray-400">(Optional)</span></label>
                                <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><PhoneIcon className="w-5 h-5 text-gray-400" /></span><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 p-2 border border-gray-300 rounded-md" /></div>
                            </div>
                            <div>
                                <label htmlFor="password-field" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Password</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockClosedIcon className="w-5 h-5 text-gray-400" /></span>
                                        <input type={passwordVisible ? 'text' : 'password'} name="password" id="password-field" value={formData.password} onChange={handleChange} className="w-full pl-10 p-2 border border-gray-300 rounded-md" required />
                                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700" aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                                    </div>
                                    <button type="button" onClick={handleGeneratePassword} className="px-3 py-2 text-sm font-semibold text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100">Generate</button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockClosedIcon className="w-5 h-5 text-gray-400" /></span>
                                    <input type={confirmPasswordVisible ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`w-full pl-10 p-2 border rounded-md ${passwordMismatch ? 'border-red-500' : 'border-gray-300'}`} required />
                                    <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700" aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}>{confirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                                </div>
                                {passwordMismatch && <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="role" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Assign Role</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><KeyIcon className="w-5 h-5 text-gray-400" /></span>
                                    <select name="role" id="role" value={formData.role} onChange={handleChange} className="w-full pl-10 p-2 border border-gray-300 rounded-md appearance-none" required>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDownIcon className="w-5 h-5 text-gray-400" /></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-b-xl flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="status-toggle" className="flex items-center cursor-pointer">
                                    <div className="relative"><input type="checkbox" id="status-toggle" className="sr-only" checked={formData.status === 'Active'} onChange={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))} /><div className="block bg-gray-300 w-12 h-6 rounded-full"></div><div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.status === 'Active' ? 'transform translate-x-6 bg-cyan-600' : ''}`}></div></div>
                                    <div className="ml-3 text-gray-700 font-medium">Account Status: {formData.status}</div>
                                </label>
                            </div>
                            <div className="relative flex items-start">
                                <div className="flex items-center h-5"><input id="sendWelcomeEmail" name="sendWelcomeEmail" type="checkbox" checked={formData.sendWelcomeEmail} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300 rounded" /></div>
                                <div className="ml-3 text-sm"><label htmlFor="sendWelcomeEmail" className="font-medium text-gray-700">Send welcome email with credentials</label></div>
                            </div>
                        </div>
                        <div className="flex gap-3 self-end sm:self-center">
                            <button type="button" onClick={handleReset} className="px-5 py-2.5 bg-gray-200 text-[#0f3443] rounded-lg hover:bg-gray-300 font-semibold transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-[#0f3443] text-white rounded-lg hover:bg-[#1a5a73] font-semibold transition-colors">Create User</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;