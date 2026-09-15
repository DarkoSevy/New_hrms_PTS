
import React, { useState, useMemo } from 'react';
import { schedulesAPI } from '../services/api';
import { Employee, Vehicle, DriverSchedule } from '../types';
import {
    OperationsIcon,
    PlusIcon,
    CalendarDaysIcon,
    MapPinIcon,
    UserIcon,
    VehicleIcon,
    CheckCircleIcon,
    XCircleIcon,
    EditIcon,
    TrashIcon,
} from './icons';

interface OperationsProps {
    employees: Employee[];
    vehicles: Vehicle[];
}

const Operations: React.FC<OperationsProps> = ({ employees, vehicles }) => {
    const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<DriverSchedule | null>(null);

    React.useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await schedulesAPI.getAll();
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const drivers = employees.filter(e => e.role.includes('Driver') || e.department === 'Operations'); // Simplified driver filter

    const handleOpenModal = (schedule: DriverSchedule | null = null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
    };

    const handleSaveSchedule = async (data: Omit<DriverSchedule, 'id'> & { id?: string }) => {
        try {
            if (data.id) {
                await schedulesAPI.update(data.id, data);
            } else {
                await schedulesAPI.create(data);
            }
            fetchSchedules();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule');
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) {
            try {
                await schedulesAPI.delete(id);
                fetchSchedules();
            } catch (error) {
                console.error('Error deleting schedule:', error);
                alert('Failed to delete schedule');
            }
        }
    };

    const statusColors = {
        Scheduled: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        Completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        Cancelled: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Operations Management</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Driver Schedules & Fleet Activity</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 executive-gradient text-black font-black py-3 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    <PlusIcon className="w-5 h-5" />
                    New Schedule
                </button>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Active Driver Schedules</h3>
                    <div className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">{schedules.length} ENTRIES</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 border-b border-white/5 uppercase tracking-tighter text-[11px] font-black">
                            <tr>
                                <th className="p-5">Driver</th>
                                <th className="p-4">Vehicle</th>
                                <th className="p-4">Date & Shift</th>
                                <th className="p-4">Route</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map(schedule => {
                                const driver = employees.find(e => e.id === schedule.driverId);
                                const vehicle = vehicles.find(v => v.id === schedule.vehicleId);
                                return (
                                    <tr key={schedule.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-5 flex items-center gap-4">
                                            {driver ? (
                                                <>
                                                    <img src={driver.avatarUrl} alt={driver.name} className="w-10 h-10 rounded-xl border border-white/10 shadow-sm" />
                                                    <span className="font-bold text-white text-sm">{driver.name}</span>
                                                </>
                                            ) : <span className="text-rose-500 font-bold text-sm">Unknown Driver</span>}
                                        </td>
                                        <td className="p-4">
                                            {vehicle ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-200 text-sm">{vehicle.make} {vehicle.model}</span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{vehicle.registration}</span>
                                                </div>
                                            ) : <span className="text-rose-500 font-bold text-sm">Unknown Vehicle</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-200 text-sm">{schedule.date}</span>
                                                <span className="text-[10px] font-black text-cyan-400/70 uppercase tracking-tighter">{schedule.shift}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm font-medium">{schedule.route}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${statusColors[schedule.status]}`}>
                                                {schedule.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => handleOpenModal(schedule)} className="p-2 bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-all"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-2 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"><TrashIcon className="w-4 h-4" /></button>
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
                <ScheduleModal
                    schedule={editingSchedule}
                    drivers={drivers}
                    vehicles={vehicles}
                    onSave={handleSaveSchedule}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

const ScheduleModal: React.FC<{
    schedule: DriverSchedule | null;
    drivers: Employee[];
    vehicles: Vehicle[];
    onSave: (data: Omit<DriverSchedule, 'id'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ schedule, drivers, vehicles, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: schedule?.id,
        driverId: schedule?.driverId || '',
        vehicleId: schedule?.vehicleId || '',
        date: schedule?.date || new Date().toISOString().split('T')[0],
        shift: schedule?.shift || 'Morning',
        route: schedule?.route || '',
        status: schedule?.status || 'Scheduled',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as any);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="glass-card border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-2xl font-black text-white tracking-tight">{schedule ? 'Update Schedule' : 'Create New Schedule'}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Assign driver and fleet assets</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-8 grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign Driver</label>
                            <select name="driverId" value={formData.driverId} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer" required>
                                <option value="" className="bg-[#0f172a]">Select Driver</option>
                                {drivers.map(d => <option key={d.id} value={d.id} className="bg-[#0f172a]">{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Vehicle</label>
                            <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer" required>
                                <option value="" className="bg-[#0f172a]">Select Vehicle</option>
                                {vehicles.map(v => <option key={v.id} value={v.id} className="bg-[#0f172a]">{v.make} {v.model} ({v.registration})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assignment Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shift Period</label>
                                <select name="shift" value={formData.shift} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer">
                                    <option value="Morning" className="bg-[#0f172a]">Morning</option>
                                    <option value="Afternoon" className="bg-[#0f172a]">Afternoon</option>
                                    <option value="Night" className="bg-[#0f172a]">Night</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Designated Route</label>
                            <input type="text" name="route" value={formData.route} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700" required placeholder="e.g. City Center Loop" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operational Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer">
                                <option value="Scheduled" className="bg-[#0f172a]">Scheduled</option>
                                <option value="Completed" className="bg-[#0f172a]">Completed</option>
                                <option value="Cancelled" className="bg-[#0f172a]">Cancelled</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-8 bg-black/20 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-all font-bold text-sm">Dismiss</button>
                        <button type="submit" className="px-6 py-3 executive-gradient text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]">Publish Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Operations;
