import React, { useState } from 'react';
import {
    SettingsIcon,
    BellIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
} from './icons';
import { TacticalButton } from './ui/TacticalButton';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState({
        companyName: 'PTS - Premier Transport & Tour Services',
        email: 'admin@pts.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St, City, Country',
        emailNotifications: true,
        smsNotifications: false,
        leaveApprovalNotif: true,
        payrollNotif: true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        alert('Configuration committed to secure storage.');
    };

    const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-bold placeholder:text-slate-600";
    const labelClasses = "block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1";

    const renderToggle = (name: string, label: string, description: string, checked: boolean) => (
        <div className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
            <div>
                <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{label}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={handleChange}
                    className="sr-only peer"
                />
                <div className="w-12 h-6 bg-black/40 border border-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-400 after:border-white/10 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-cyan-500/20 peer-checked:border-cyan-500/50 peer-checked:after:bg-cyan-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
            </label>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
            <div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Configuration</h2>
                 <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Adjust core environmental variables and notification pipelines</p>
            </div>

            <div className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="p-8 border-b border-white/5 bg-black/20">
                    <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-3">
                        <BuildingOfficeIcon className="w-5 h-5" />
                        Organizational Master Record
                    </h3>
                </div>
                <div className="p-8 lg:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className={labelClasses}>Primary Entity Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={settings.companyName}
                                onChange={handleChange}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Master Comm Channel</label>
                            <input
                                type="email"
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Direct Comm Line</label>
                            <input
                                type="tel"
                                name="phone"
                                value={settings.phone}
                                onChange={handleChange}
                                className={`${inputClasses} font-mono`}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Physical Coordinates</label>
                            <input
                                type="text"
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden relative">
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                <div className="p-8 border-b border-white/5 bg-black/20">
                    <h3 className="text-[12px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-3">
                        <BellIcon className="w-5 h-5" />
                        Event Dispatch Matrix
                    </h3>
                </div>
                <div className="p-8 lg:p-10 space-y-4 relative z-10">
                    {renderToggle(
                        "emailNotifications", 
                        "Standard Email Protocol", 
                        "Dispatch events through traditional email relay", 
                        settings.emailNotifications
                    )}
                    {renderToggle(
                        "smsNotifications", 
                        "Tactical SMS Uplink", 
                        "Dispatch high-priority event bursts via SMS", 
                        settings.smsNotifications
                    )}
                    {renderToggle(
                        "leaveApprovalNotif", 
                        "Absence Triage Alerts", 
                        "Alert when node absence operations demand clearance", 
                        settings.leaveApprovalNotif
                    )}
                    {renderToggle(
                        "payrollNotif", 
                        "Economic Cycle Alerts", 
                        "Alert upon execution of asset distribution patterns", 
                        settings.payrollNotif
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <TacticalButton variant="primary" onClick={handleSave} icon={<CheckCircleIcon className="w-5 h-5" />}>
                    Compile Configuration
                </TacticalButton>
            </div>
        </div>
    );
};

export default Settings;
