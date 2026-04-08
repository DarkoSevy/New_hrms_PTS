
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

interface ResetPasswordsProps {
    users: SystemUser[];
}

const SearchableUserDropdown: React.FC<{
    users: SystemUser[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ users, value, onChange, placeholder = "Select a user" }) => {
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
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center p-2.5 border border-gray-300 rounded-md bg-white text-left">
                {selectedUser ? (
                    <>
                        <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-6 h-6 rounded-full mr-2" />
                        <span className="flex-grow font-medium text-[#0f3443]">{selectedUser.name}</span>
                    </>
                ) : (
                    <span className="flex-grow text-gray-500">{placeholder}</span>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg animate-fade-in-down">
                    <div className="p-2 border-b">
                        <div className="relative">
                             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full p-2 pl-10 border border-gray-200 rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <li
                                key={user.id}
                                className="p-2.5 flex items-center hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    onChange(user.id);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                                <div>
                                    <p className="font-semibold text-sm text-[#0f3443]">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </li>
                        )) : <li className="p-4 text-center text-sm text-gray-500">No users found.</li>}
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

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                 <h2 className="text-2xl font-bold text-[#0f3443]">Reset User Password</h2>
                 <p className="text-gray-500">Select a user to generate or manually enter a new password.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm">
                {submissionStatus === 'success' && (
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-t-xl animate-fade-in-down" role="alert">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Password Reset Successful</p>
                                <p className="text-sm text-green-700">The password for {submittedUserName} has been successfully updated.</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#0f3443]/90 mb-1.5 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-400"/>
                            Select User Account
                        </label>
                        <SearchableUserDropdown 
                            users={users} 
                            value={formData.selectedUserId} 
                            onChange={(userId) => setFormData(prev => ({...prev, selectedUserId: userId}))}
                        />
                    </div>

                    {selectedUser && (
                         <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-4 text-sm animate-fade-in-down">
                            <div>
                                <p className="font-semibold text-gray-500">Username</p>
                                <p className="text-[#0f3443] font-mono">{selectedUser.username}</p>
                            </div>
                             <div>
                                <p className="font-semibold text-gray-500">Email Address</p>
                                <p className="text-[#0f3443]">{selectedUser.email}</p>
                            </div>
                        </div>
                    )}

                    <div className={`transition-opacity duration-300 ${selectedUser ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="pt-4 border-t">
                             <h3 className="text-md font-semibold text-[#0f3443] mb-4 flex items-center gap-2"><KeyIcon className="w-5 h-5" />New Credentials</h3>
                             <div className="space-y-4">
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-[#0f3443]/90 mb-1">New Password</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockClosedIcon className="w-5 h-5 text-gray-400" /></span>
                                            <input type={passwordVisible ? 'text' : 'password'} name="newPassword" id="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full pl-10 p-2 border border-gray-300 rounded-md" required />
                                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700" aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                                        </div>
                                        <button type="button" onClick={handleGeneratePassword} className="px-3 py-2 text-sm font-semibold text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100">Generate</button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0f3443]/90 mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockClosedIcon className="w-5 h-5 text-gray-400" /></span>
                                        <input type={confirmPasswordVisible ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`w-full pl-10 p-2 border rounded-md ${passwordMismatch ? 'border-red-500' : 'border-gray-300'}`} required />
                                        <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700" aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}>{confirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                                    </div>
                                    {passwordMismatch && <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>}
                                </div>
                             </div>
                        </div>

                         <div className="pt-6 mt-6 border-t space-y-3">
                            <div className="relative flex items-start">
                                <div className="flex items-center h-5"><input id="forceChangeOnLogin" name="forceChangeOnLogin" type="checkbox" checked={formData.forceChangeOnLogin} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300 rounded" /></div>
                                <div className="ml-3 text-sm"><label htmlFor="forceChangeOnLogin" className="font-medium text-gray-700">Require user to change password on next login</label></div>
                            </div>
                            <div className="relative flex items-start">
                                <div className="flex items-center h-5"><input id="sendEmail" name="sendEmail" type="checkbox" checked={formData.sendEmail} onChange={handleChange} className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300 rounded" /></div>
                                <div className="ml-3 text-sm"><label htmlFor="sendEmail" className="font-medium text-gray-700">Send new password to the user's email</label></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-200 text-[#0f3443] rounded-lg hover:bg-gray-300 font-semibold transition-colors">Clear</button>
                    <button type="submit" disabled={!isFormValid} className="px-5 py-2.5 bg-[#0f3443] text-white rounded-lg hover:bg-[#1a5a73] font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Reset Password</button>
                </div>
            </form>
        </div>
    );
};

export default ResetPasswords;
