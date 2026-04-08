import React, { useState, useEffect } from 'react';
import { UserIcon, FinanceIcon, CalendarDaysIcon, DownloadIcon } from './icons';
import { exportToPDF, exportToExcel } from '../utils/exportHelpers';
import api from '../services/api';

interface AttendanceRecord {
    id: string;
    employee_id: string;
    employeeName?: string; // from join
    date: string;
    status: 'Present' | 'Absent' | 'Late' | 'Half-day';
    clock_in?: string;
    clock_out?: string;
    overtime_hours?: number;
    notes?: string;
}

interface Employee {
    id: string;
    name: string;
}

const AttendanceTracking: React.FC = () => {
    const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attRes, empRes] = await Promise.all([
                api.get('/attendance'),
                api.get('/employees')
            ]);
            setAttendanceRecords(attRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        clock_in: '',
        clock_out: '',
        notes: ''
    });

    const statusColors = {
        Present: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        Absent: { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
        Late: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
        'Half-day': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    };

    const stats = {
        present: attendanceRecords.filter(r => r.status === 'Present').length,
        absent: attendanceRecords.filter(r => r.status === 'Absent').length,
        late: attendanceRecords.filter(r => r.status === 'Late').length,
        halfDay: attendanceRecords.filter(r => r.status === 'Half-day').length,
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Employee', dataKey: 'employeeName' },
            { header: 'Date', dataKey: 'date' },
            { header: 'Status', dataKey: 'status' },
            { header: 'Clock In', dataKey: 'clock_in' },
            { header: 'Clock Out', dataKey: 'clock_out' },
            { header: 'Overtime (hrs)', dataKey: 'overtime_hours' },
        ];
        exportToPDF(attendanceRecords, columns, 'attendance-report', 'Attendance Report');
    };

    const handleExportExcel = () => {
        exportToExcel(attendanceRecords, 'attendance-report', 'Attendance');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employee_id) {
            alert('Please select an employee');
            return;
        }

        try {
            await api.post('/attendance', {
                employeeId: formData.employee_id,
                date: formData.date,
                status: formData.status,
                clockIn: formData.clock_in,
                clockOut: formData.clock_out,
                notes: formData.notes,
                overtime: 0 // logic to calculate based on clock times could be added
            });

            await fetchData(); // Refresh list
            setIsAddModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                status: 'Present',
                clock_in: '',
                clock_out: '',
                notes: ''
            });
        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Failed to save attendance record");
        }
    };

    // Simple calendar grid for December 2024
    const renderCalendar = () => {
        const daysInMonth = 31;
        const firstDay = 0; // Sunday
        const days = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `2024-12-${day.toString().padStart(2, '0')}`;
            const dayRecords = attendanceRecords.filter(r => r.date === dateStr);

            days.push(
                <div key={day} className="border border-white/5 p-3 min-h-[110px] hover:bg-white/5 transition-colors group">
                    <div className="font-black text-slate-500 group-hover:text-cyan-400 transition-colors text-sm mb-2">{day}</div>
                    <div className="space-y-1.5">
                        {dayRecords.map(record => (
                            <div key={record.id} className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-lg ${statusColors[record.status].bg} ${statusColors[record.status].text} border border-white/5 truncate`}>
                                {(record.employeeName || 'Unknown').split(' ')[0]}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Presence Architecture</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 tracking-widest uppercase">Intelligent Time & Flow Metrics</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center gap-3"
                >
                    <span className="text-lg">+</span> Log Attendance
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-green-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operational Flow</p>
                            <p className="text-3xl font-black text-green-400">{stats.present}</p>
                        </div>
                        <UserIcon className="w-10 h-10 text-green-500/20 group-hover:text-green-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-red-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Departures</p>
                            <p className="text-3xl font-black text-red-400">{stats.absent}</p>
                        </div>
                        <UserIcon className="w-10 h-10 text-red-500/20 group-hover:text-red-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-orange-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency Alerts</p>
                            <p className="text-3xl font-black text-orange-400">{stats.late}</p>
                        </div>
                        <FinanceIcon className="w-10 h-10 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" />
                    </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl group hover:border-blue-500/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Flexible Cycles</p>
                            <p className="text-3xl font-black text-blue-400">{stats.halfDay}</p>
                        </div>
                        <FinanceIcon className="w-10 h-10 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                    </div>
                </div>
            </div>

            {/* View Toggle and Export Buttons */}
            <div className="glass-card rounded-2xl border border-white/5 p-4 mb-8 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                        <button
                            onClick={() => setSelectedView('list')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedView === 'list'
                                ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            Log Timeline
                        </button>
                        <button
                            onClick={() => setSelectedView('calendar')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedView === 'calendar'
                                ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                                : 'text-slate-500 hover:text-white'
                                }`}
                        >
                            Spectral Calendar
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            INTEL PDF
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            INTEL EXCEL
                        </button>
                    </div>
                </div>
            </div>

            {/* List View */}
            {selectedView === 'list' && (
                <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full">
                        <thead className="bg-white/5 text-slate-400 border-b border-white/5 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5 text-left">Identity</th>
                                <th className="px-6 py-5 text-left">Timestamp</th>
                                <th className="px-6 py-5 text-left">Protocol Status</th>
                                <th className="px-6 py-5 text-left text-center">InGRESS</th>
                                <th className="px-6 py-5 text-left text-center">EGRESS</th>
                                <th className="px-6 py-5 text-left">Velocity</th>
                                <th className="px-6 py-5 text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {attendanceRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 flex items-center justify-center text-xs font-black text-cyan-400">
                                                {(record.employeeName || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-xs uppercase tracking-tight">{record.employeeName || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-600 font-medium">#{record.employee_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-300 font-mono text-[11px] whitespace-nowrap">{record.date}</td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[record.status].bg} ${statusColors[record.status].text} border border-white/5`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[record.status].dot}`}></span>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{record.clock_in || '-'}</td>
                                    <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{record.clock_out || '-'}</td>
                                    <td className="px-6 py-5">
                                        {record.overtime_hours ? (
                                            <span className="text-emerald-400 font-black text-xs">+{record.overtime_hours}h</span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 text-[10px] font-medium italic min-w-[150px] leading-relaxed">
                                        {record.notes ? `"${record.notes}"` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Calendar View */}
            {selectedView === 'calendar' && (
                <div className="glass-card rounded-2xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase">December 2024</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Operational Heatmap</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-4 text-center text-[10px] font-black text-slate-500 bg-white/5 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                        {renderCalendar()}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Metrics</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.3)]"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absence Threshold</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.3)]"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency Markers</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flex Cycles</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Attendance Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass-card rounded-[2.5rem] border border-white/10 p-10 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                        
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Log Attendance</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manual Pulse Entry</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                            >
                                <span className="text-xl">×</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee ID</label>
                                    <select
                                        name="employee_id"
                                        value={formData.employee_id || ''}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium appearance-none"
                                        required
                                    >
                                        <option value="" className="bg-[#020617]">Select Node</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id} className="bg-[#020617]">{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cycle Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Flow Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium appearance-none"
                                >
                                    <option value="Present" className="bg-[#020617]">Present</option>
                                    <option value="Absent" className="bg-[#020617]">Absent</option>
                                    <option value="Late" className="bg-[#020617]">Late</option>
                                    <option value="Half-day" className="bg-[#020617]">Half-day</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">InGRESS Time</label>
                                    <input
                                        type="time"
                                        name="clock_in"
                                        value={formData.clock_in}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">EGRESS Time</label>
                                    <input
                                        type="time"
                                        name="clock_out"
                                        value={formData.clock_out}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transmission Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all font-medium resize-none"
                                    placeholder="Optional data packets..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-8 py-3 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className="executive-gradient text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                >
                                    Transmit Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTracking;
