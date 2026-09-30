
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { employeesAPI, leavesAPI, vehiclesAPI, vacanciesAPI, candidatesAPI, leaveEntitlementsAPI } from '../services/api';
import LeaveBalanceCard from './LeaveBalanceCard';
import { calculateLeaveDays, validateLeaveBalance } from '../utils/leaveUtils';
import { Page, Employee, EmployeeStatus, LeaveRequest, LeaveStatus, LeaveType, DocumentType, DocumentWorkflow, Vehicle, VehicleStatus, VehicleLog, SystemUser, SystemRole, Vacancy, VacancyStatus, Candidate, CandidateStage, Department } from '../types';
import * as XLSX from 'xlsx';
import {
    DashboardIcon,
    OperationsIcon,
    RecruitmentIcon,
    SalesMarketingIcon,
    FinanceIcon,
    ReportsIcon,
    SettingsIcon,
    LogoutIcon,
    BellIcon,
    SearchIcon,
    MenuIcon,
    CloseIcon,
    LogoIcon,
    VehicleIcon,
    DollarIcon,
    ChevronLeftIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    LeaveIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,
    UserGroupIcon,
    KeyIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    SparklesIcon,
    ShieldCheckIcon,
    DownloadIcon,
    ClockIcon,
    CalendarIcon,
    CloudArrowUpIcon,
    DocumentCheckIcon,
    DocumentDuplicateIcon,
    DocumentIcon,
    MoonIcon,
    SunIcon,
} from './icons';
import { StatusBadge } from './ui/StatusBadge';
import { TacticalButton } from './ui/TacticalButton';
import CreateUser from './CreateUser';
import ResetPasswords from './ResetPasswords';
import Recruitment from './Recruitment';
import Operations from './Operations';
import SalesMarketing from './SalesMarketing';
import Finance from './Finance';
import Reports from './Reports';
import Settings from './Settings';
import OrgChart from './OrgChart';
import AttendanceTracking from './AttendanceTracking';
import PerformanceManagement from './PerformanceManagement';
import TrainingDevelopment from './TrainingDevelopment';
import DisciplinaryGrievance from './DisciplinaryGrievance';
import HRReports from './HRReports';
import DashboardCharts from './DashboardCharts';
import PayrollManagement from './PayrollManagement';
import EmployeeDetailModal from './EmployeeDetailModal';
import AuditLogs from './AuditLogs';

const initialEmployees: Employee[] = [
    { id: '1', employeeId: 'EMP001', name: 'John Doe', department: Department.Operations, role: SystemRole.FleetManager, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', location: 'New York', hireDate: '2022-03-15' },
    { id: '2', employeeId: 'EMP002', name: 'Jane Smith', department: Department.Commercial, role: SystemRole.SalesMarketingManager, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', location: 'San Francisco', hireDate: '2021-07-01' },
    { id: '3', employeeId: 'EMP003', name: 'Peter Jones', department: Department.Commercial, role: SystemRole.SalesOfficer, status: EmployeeStatus.OnLeave, avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg', location: 'New York', hireDate: '2023-01-20' },
    { id: '4', employeeId: 'EMP004', name: 'Sarah Williams', department: Department.AdminFinance, role: SystemRole.HRManager, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg', location: 'Chicago', hireDate: '2020-11-10' },
    { id: '5', employeeId: 'EMP005', name: 'Michael Brown', department: Department.Operations, role: SystemRole.MaintenanceOfficer, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/men/5.jpg', location: 'Boston', hireDate: '2022-06-01' },
    { id: '6', employeeId: 'EMP006', name: 'Emily Davis', department: Department.AdminFinance, role: SystemRole.Accountant, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/women/6.jpg', location: 'New York', hireDate: '2021-09-15' },
    { id: '7', employeeId: 'EMP007', name: 'David Miller', department: Department.Commercial, role: SystemRole.TourOperationsOfficer, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/men/7.jpg', location: 'Los Angeles', hireDate: '2023-02-20' },
    { id: '8', employeeId: 'EMP008', name: 'Lisa Anderson', department: Department.Commercial, role: SystemRole.SalesAssistant, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/women/8.jpg', location: 'Miami', hireDate: '2022-08-05' },
    { id: '9', employeeId: 'EMP009', name: 'James Wilson', department: Department.Operations, role: SystemRole.GarageTechnician, status: EmployeeStatus.Active, avatarUrl: 'https://randomuser.me/api/portraits/men/9.jpg', location: 'Seattle', hireDate: '2021-12-01' },
];

const initialLeaveRequests: LeaveRequest[] = [
    { id: '1', employeeId: '2', employeeName: 'Jane Smith', employeeAvatar: 'https://randomuser.me/api/portraits/women/2.jpg', leaveType: LeaveType.Annual, startDate: '2024-08-01', endDate: '2024-08-05', reason: 'Family vacation', status: LeaveStatus.Approved },
    { id: '2', employeeId: '3', employeeName: 'Peter Jones', employeeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg', leaveType: LeaveType.Sick, startDate: '2024-07-20', endDate: '2024-07-21', reason: 'Flu', status: LeaveStatus.Approved, document: { name: 'doctors_note.pdf', content: '' } },
    { id: '3', employeeId: '1', employeeName: 'John Doe', employeeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg', leaveType: LeaveType.Annual, startDate: '2024-09-10', endDate: '2024-09-15', reason: 'Going to a conference', status: LeaveStatus.Pending },
    { id: '4', employeeId: '4', employeeName: 'Mary Williams', employeeAvatar: 'https://randomuser.me/api/portraits/women/4.jpg', leaveType: LeaveType.Unpaid, startDate: '2024-07-25', endDate: '2024-07-26', reason: 'Personal matters', status: LeaveStatus.Rejected },
];

const initialVehicles: Vehicle[] = [
    { id: 'v1', make: 'Toyota', model: 'Camry', year: 2022, registration: 'NYC-1234', insuranceExpiry: '2025-05-30', status: VehicleStatus.Available, lastMaintenance: '2024-04-15', nextMaintenance: '2024-10-15', avatarUrl: 'https://i.imgur.com/Qz2QzX3.png' },
    { id: 'v2', make: 'Ford', model: 'F-150', year: 2021, registration: 'SFO-5678', insuranceExpiry: '2025-08-20', status: VehicleStatus.InUse, assignedTo: '2', lastMaintenance: '2024-06-01', nextMaintenance: '2024-12-01', avatarUrl: 'https://i.imgur.com/H5f9T6b.png' },
    { id: 'v3', make: 'Honda', model: 'Civic', year: 2023, registration: 'CHI-9101', insuranceExpiry: '2026-01-10', status: VehicleStatus.Maintenance, assignedTo: '7', lastMaintenance: '2024-07-20', nextMaintenance: '2025-01-20', avatarUrl: 'https://i.imgur.com/g89BGvX.png' },
];

const initialVehicleLogs: VehicleLog[] = [
    { id: 'log1', vehicleId: 'v2', driverId: '2', startDate: '2024-07-18', endDate: '2024-07-18', startMileage: 15020, endMileage: 15095, purpose: 'Client Meeting in Oakland' },
    { id: 'log2', vehicleId: 'v2', driverId: '2', startDate: '2024-07-19', endDate: '2024-07-19', startMileage: 15095, endMileage: 15150, purpose: 'Supplier Visit' },
    { id: 'log3', vehicleId: 'v3', driverId: '7', startDate: '2024-07-15', endDate: '2024-07-16', startMileage: 5400, endMileage: 5650, purpose: 'Sales Roadshow' },
];

const initialSystemUsers: SystemUser[] = [
    { id: 'user1', name: 'Alice Johnson', username: 'alicej', email: 'alice.j@example.com', role: 'Administrator', department: Department.Executive, status: 'Active', avatarUrl: 'https://randomuser.me/api/portraits/women/10.jpg', lastLogin: '2024-07-22 10:30 AM' },
    { id: 'user2', name: 'Bob Williams', username: 'bobw', email: 'bob.w@example.com', role: 'HR Manager', department: Department.AdminFinance, status: 'Active', avatarUrl: 'https://randomuser.me/api/portraits/men/11.jpg', lastLogin: '2024-07-22 09:15 AM' },
    { id: 'user3', name: 'Charlie Brown', username: 'charlieb', email: 'charlie.b@example.com', role: 'Team Lead', department: Department.Operations, status: 'Inactive', avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg', lastLogin: '2024-07-15 03:45 PM' },
    { id: 'user4', name: 'Diana Miller', username: 'dianam', email: 'diana.m@example.com', role: 'Employee', department: Department.Commercial, status: 'Active', avatarUrl: 'https://randomuser.me/api/portraits/women/14.jpg', lastLogin: '2024-07-21 11:00 AM' },
    { id: 'user5', name: 'Ethan Davis', username: 'ethand', email: 'ethan.d@example.com', role: 'Employee', department: Department.Support, status: 'Inactive', avatarUrl: 'https://randomuser.me/api/portraits/men/15.jpg', lastLogin: '2024-06-30 08:00 AM' },
];

const ALL_PERMISSIONS = [
    {
        category: 'User Management',
        permissions: [
            { key: 'user:create', label: 'Create User' },
            { key: 'user:read', label: 'View User List' },
            { key: 'user:update', label: 'Edit User' },
            { key: 'user:delete', label: 'Delete User' },
            { key: 'user:resetpassword', label: 'Reset Passwords' },
        ],
    },
    {
        category: 'Role Management',
        permissions: [
            { key: 'role:create', label: 'Create Roles' },
            { key: 'role:read', label: 'View Roles' },
            { key: 'role:update', label: 'Edit Roles & Permissions' },
            { key: 'role:delete', label: 'Delete Roles' },
        ],
    },
    {
        category: 'Employee Management',
        permissions: [
            { key: 'employee:create', label: 'Add New Employee' },
            { key: 'employee:read', label: 'View Employee Data' },
            { key: 'employee:update', label: 'Edit Employee Data' },
            { key: 'employee:delete', label: 'Terminate Employee' },
        ],
    },
    {
        category: 'Leave Management',
        permissions: [
            { key: 'leave:request', label: 'Request Leave' },
            { key: 'leave:approve', label: 'Approve/Reject Leave' },
            { key: 'leave:read', label: 'View Leave History' },
        ],
    },
];

const allPermissionKeys = ALL_PERMISSIONS.flatMap(cat => cat.permissions.map(p => p.key));

interface SystemRoleDefinition {
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

const initialSystemRoles: SystemRoleDefinition[] = [
    { id: 'role1', name: 'Administrator', description: 'Has all permissions across the system.', permissions: allPermissionKeys },
    { id: 'role2', name: 'HR Manager', description: 'Manages employees, leave, and recruitment.', permissions: ['user:read', 'employee:create', 'employee:read', 'employee:update', 'employee:delete', 'leave:approve', 'leave:read'] },
    { id: 'role3', name: 'Team Lead', description: 'Approves leave for their team and views employee data.', permissions: ['employee:read', 'leave:approve', 'leave:read'] },
    { id: 'role4', name: 'Employee', description: 'Basic access to own profile and can request leave.', permissions: ['leave:request'] },
    { id: 'role5', name: 'Finance', description: 'Access to financial and payroll information.', permissions: [] },
    { id: 'role6', name: 'Operations', description: 'Manages operational aspects like vehicle logs.', permissions: [] },
];

interface DocumentTypeDefinition {
    id: string;
    name: string;
    description: string;
    requiredFor: LeaveType[];
    accessPermissions: string[];
    workflow: string;
}

const initialDocumentTypes: DocumentTypeDefinition[] = [
    {
        id: 'doc1',
        name: 'Medical Certificate',
        description: 'Official document from a medical professional verifying an employee\'s illness.',
        requiredFor: [LeaveType.Sick],
        accessPermissions: ['Administrator', 'HR Manager'],
        workflow: 'HRApproval',
    },
    {
        id: 'doc2',
        name: 'Travel Itinerary',
        description: 'Proof of travel plans, such as flight or hotel bookings.',
        requiredFor: [LeaveType.Annual],
        accessPermissions: ['Administrator', 'HR Manager', 'Team Lead'],
        workflow: 'ManagerAndHR',
    },
    {
        id: 'doc3',
        name: 'Invoice',
        description: 'Commercial document issued by a seller to a buyer, relating to a sale transaction.',
        requiredFor: [],
        accessPermissions: ['Administrator', 'Finance'],
        workflow: 'None',
    },
    {
        id: 'doc4',
        name: 'Vehicle Log Sheet',
        description: 'Record of vehicle usage, mileage, and purpose of trips.',
        requiredFor: [],
        accessPermissions: ['Administrator', 'Operations'],
        workflow: 'None',
    },
];

const initialVacancies: Vacancy[] = [
    { id: 'vac1', title: 'Senior Frontend Developer', department: 'Engineering', status: VacancyStatus.Open, postedDate: '2024-07-01', hiringManagerId: '1', description: 'Seeking an experienced Frontend Developer to build user-facing features.', location: 'New York, NY', employmentType: 'Full-time' },
    { id: 'vac2', title: 'Product Marketing Manager', department: 'Marketing', status: VacancyStatus.Open, postedDate: '2024-06-15', hiringManagerId: '2', description: 'Join our marketing team to lead product launch strategies.', location: 'San Francisco, CA', employmentType: 'Full-time' },
    { id: 'vac3', title: 'UX/UI Designer', department: 'Engineering', status: VacancyStatus.Closed, postedDate: '2024-05-20', hiringManagerId: '1', description: 'Designing intuitive and beautiful user interfaces.', location: 'Remote', employmentType: 'Contract' },
    { id: 'vac4', title: 'Sales Development Representative', department: 'Sales', status: VacancyStatus.OnHold, postedDate: '2024-07-10', hiringManagerId: '3', description: 'Energetic SDR to generate new business leads.', location: 'Chicago, IL', employmentType: 'Full-time' },
];

const initialCandidates: Candidate[] = [
    // Candidates for vac1
    { id: 'cand1', vacancyId: 'vac1', name: 'Michael Scott', email: 'm.scott@example.com', phone: '555-0101', avatarUrl: 'https://randomuser.me/api/portraits/men/20.jpg', stage: CandidateStage.Sourced, appliedDate: '2024-07-05', resumeUrl: '#' },
    { id: 'cand2', vacancyId: 'vac1', name: 'Dwight Schrute', email: 'd.schrute@example.com', phone: '555-0102', avatarUrl: 'https://randomuser.me/api/portraits/men/21.jpg', stage: CandidateStage.Screening, appliedDate: '2024-07-06' },
    { id: 'cand3', vacancyId: 'vac1', name: 'Jim Halpert', email: 'j.halpert@example.com', phone: '555-0103', avatarUrl: 'https://randomuser.me/api/portraits/men/22.jpg', stage: CandidateStage.Interview, appliedDate: '2024-07-08', resumeUrl: '#' },
    { id: 'cand4', vacancyId: 'vac1', name: 'Pam Beesly', email: 'p.beesly@example.com', phone: '555-0104', avatarUrl: 'https://randomuser.me/api/portraits/women/23.jpg', stage: CandidateStage.Offer, appliedDate: '2024-07-10', resumeUrl: '#' },
    { id: 'cand5', vacancyId: 'vac1', name: 'Andy Bernard', email: 'a.bernard@example.com', phone: '555-0105', avatarUrl: 'https://randomuser.me/api/portraits/men/24.jpg', stage: CandidateStage.Rejected, appliedDate: '2024-07-02' },
    // Candidates for vac2
    { id: 'cand6', vacancyId: 'vac2', name: 'Angela Martin', email: 'a.martin@example.com', phone: '555-0106', avatarUrl: 'https://randomuser.me/api/portraits/women/25.jpg', stage: CandidateStage.Screening, appliedDate: '2024-06-20', resumeUrl: '#' },
    { id: 'cand7', vacancyId: 'vac2', name: 'Kevin Malone', email: 'k.malone@example.com', phone: '555-0107', avatarUrl: 'https://randomuser.me/api/portraits/men/26.jpg', stage: CandidateStage.Interview, appliedDate: '2024-06-22' },
    { id: 'cand8', vacancyId: 'vac2', name: 'Oscar Martinez', email: 'o.martinez@example.com', phone: '555-0108', avatarUrl: 'https://randomuser.me/api/portraits/men/27.jpg', stage: CandidateStage.Sourced, appliedDate: '2024-06-18' },
    // Candidates for vac3 (Closed)
    { id: 'cand9', vacancyId: 'vac3', name: 'Phyllis Vance', email: 'p.vance@example.com', phone: '555-0109', avatarUrl: 'https://randomuser.me/api/portraits/women/28.jpg', stage: CandidateStage.Hired, appliedDate: '2024-06-01', resumeUrl: '#' },
];

const EmployeeManagement: React.FC<{
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}> = ({ employees, setEmployees }) => {
    const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'All'>('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredEmployees = useMemo(() => {
        if (statusFilter === 'All') return employees;
        return employees.filter(emp => emp.status === statusFilter);
    }, [employees, statusFilter]);

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleOpenDetailModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedEmployee(null);
    };

    const handleSaveEmployee = async (employeeData: Omit<Employee, 'id' | 'avatarUrl'> & { id?: string }) => {
        try {
            if (employeeData.id) { // Editing
                await employeesAPI.update(employeeData.id, employeeData);
                setEmployees(employees.map(emp => emp.id === employeeData.id ? { ...emp, ...employeeData } : emp));
            } else { // Adding
                const newEmployee = {
                    ...employeeData,
                    avatarUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
                };
                const response = await employeesAPI.create(newEmployee);
                setEmployees([response.data, ...employees]);
            }
            handleCloseAddModal();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Failed to save employee. Please try again.');
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                await employeesAPI.delete(id);
                setEmployees(employees.filter(emp => emp.id !== id));
            } catch (error) {
                console.error('Failed to delete employee:', error);
            }
        }
    };

    // Download Excel template
    const handleDownloadTemplate = () => {
        const template = [
            {
                employeeId: 'EMP001',
                name: 'John Doe',
                department: 'Operations',
                role: 'FleetManager',
                status: 'Active',
                location: 'New York',
                hireDate: '2024-01-15',
            }
        ];

        import('../utils/exportHelpers').then(({ exportToExcel }) => {
            exportToExcel(template, 'employee-template', 'Template');
        });
    };

    // Handle Excel file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Process and add employees to database via API
                const newEmployees = jsonData.map((row: any) => ({
                    employeeId: row.employeeId || `EMP${Math.floor(Math.random() * 10000)}`,
                    name: row.name,
                    department: row.department as Department,
                    role: row.role as SystemRole,
                    status: (row.status || 'Active') as EmployeeStatus,
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}`,
                    location: row.location || '',
                    hireDate: row.hireDate || new Date().toISOString().split('T')[0],
                }));

                // Save each employee to database via API
                let successCount = 0;
                let errorCount = 0;

                for (const emp of newEmployees) {
                    try {
                        await employeesAPI.create(emp);
                        successCount++;
                    } catch (error) {
                        console.error('Error saving employee:', emp.name, error);
                        errorCount++;
                    }
                }

                // Refresh employee list from database
                const response = await employeesAPI.getAll();
                setEmployees(response.data);

                if (errorCount > 0) {
                    alert(`Imported ${successCount} employees successfully. ${errorCount} failed.`);
                } else {
                    alert(`Successfully imported ${successCount} employees!`);
                }
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                console.error('Error details:', {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                alert(`Error importing file: ${error instanceof Error ? error.message : 'Please check the format and try again'}`);
            }
        };
        reader.readAsBinaryString(file);

        // Reset file input
        if (event.target) event.target.value = '';
    };


    return (
        <>
            <div className="glass-card rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Node Directory</h2>
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">High-fidelity Personnel Management</p>
                    </div>
                    <div className="flex gap-4">
                        <TacticalButton
                            onClick={handleDownloadTemplate}
                            icon={<DownloadIcon className="w-4 h-4" />}
                        >
                            Template
                        </TacticalButton>
                        <TacticalButton
                            onClick={() => fileInputRef.current?.click()}
                            icon={<PlusIcon className="w-4 h-4" />}
                        >
                            Import
                        </TacticalButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <TacticalButton
                            variant="primary"
                            onClick={handleOpenAddModal}
                            icon={<PlusIcon className="w-4 h-4" />}
                        >
                            Enroll Node
                        </TacticalButton>
                    </div>
                </div>
                <div className="p-6 border-b border-white/5 flex gap-3">
                        {(['All', EmployeeStatus.Active, EmployeeStatus.OnLeave, EmployeeStatus.Terminated] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Code</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Division</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Function</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vital Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 flex items-center gap-4">
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <img src={emp.avatarUrl} alt={emp.name} className="w-12 h-12 rounded-xl object-cover relative border border-white/10" />
                                        </div>
                                        <span className="font-black text-white uppercase tracking-tight text-sm">{emp.name}</span>
                                    </td>
                                    <td className="p-6 font-mono text-xs text-slate-400">{emp.employeeId}</td>
                                    <td className="p-6 text-xs text-slate-500">{emp.department}</td>
                                    <td className="p-6 text-[10px] font-black text-cyan-400 uppercase tracking-tight">{emp.role}</td>
                                    <td className="p-6">
                                        <StatusBadge status={emp.status} />
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleOpenDetailModal(emp)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-all" title="View Details"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            {isAddModalOpen && <EmployeeModal employee={null} onSave={handleSaveEmployee} onClose={handleCloseAddModal} />}

            {/* Employee Detail Modal with Tabs */}
            {isDetailModalOpen && selectedEmployee && (
                <EmployeeDetailModal
                    employee={selectedEmployee}
                    currentUserId={JSON.parse(localStorage.getItem('user') || '{}').id || 'user1'}
                    onClose={handleCloseDetailModal}
                    onUpdate={(updatedEmployee) => {
                        setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
                    }}
                />
            )}
        </>
    );
};

const EmployeeModal: React.FC<{
    employee: Employee | null;
    onSave: (employeeData: Omit<Employee, 'avatarUrl'>) => void;
    onClose: () => void;
}> = ({ employee, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: employee?.id || '',
        employeeId: employee?.employeeId || '',
        name: employee?.name || '',
        department: employee?.department || Department.Operations,
        role: employee?.role || SystemRole.Employee,
        status: employee?.status || EmployeeStatus.Active,
        location: employee?.location || '',
        hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
        terminationDate: employee?.terminationDate || '',
        terminationReason: employee?.terminationReason || undefined,
    });

    const roles = [
        'Frontend Developer',
        'Backend Developer',
        'Marketing Manager',
        'Sales Executive',
        'HR Specialist',
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-[#0a0f14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 bg-white/5 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                            <UserIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{employee ? 'Edit Identity' : 'Enroll Node'}</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">Personnel Authorization Protocol</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="employeeId" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Node Identifier</label>
                                <input type="text" name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" required />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Node Status</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight">
                                    {Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Legal Designation</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" required />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="department" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Assigned Division</label>
                                <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" required />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Deployment Zone</label>
                                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Protocol Role</label>
                            <select name="role" id="role" value={formData.role} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" required>
                                <option value="" disabled>Select Role...</option>
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="hireDate" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Activation Date</label>
                            <input type="date" name="hireDate" id="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" required />
                        </div>
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">Abort</button>
                        <button type="submit" className="px-8 py-3 executive-gradient text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            {employee ? 'Save Metrics' : 'Confirm Enrollment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SearchableEmployeeDropdown: React.FC<{
    employees: Employee[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
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
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 text-white text-xs transition-all ${isOpen ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'border-white/10 hover:border-white/20'}`}
            >
                {selectedEmployee ? (
                    <div className="flex items-center gap-3">
                        <img src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="w-6 h-6 rounded-lg object-cover border border-white/10" />
                        <span className="font-black uppercase tracking-tight">{selectedEmployee.name}</span>
                    </div>
                ) : (
                    <span className="text-slate-500 font-black uppercase tracking-widest">{placeholder}</span>
                )}
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 top-full mt-2 w-full glass-card bg-[#0a0f14]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-white/5 bg-white/5">
                        <input
                            type="text"
                            placeholder="Filter Nodes..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredEmployees.length > 0 ? filteredEmployees.map(employee => (
                            <li
                                key={employee.id}
                                className="p-4 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors group border-b border-white/5 last:border-b-0"
                                onClick={() => {
                                    onChange(employee.id);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                <img src={employee.avatarUrl} alt={employee.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-white text-[11px] font-black uppercase tracking-tight">{employee.name}</span>
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{employee.role}</span>
                                </div>
                            </li>
                        )) : (
                            <li className="p-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">No matching nodes</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const LeaveRequestModal: React.FC<{
    request: LeaveRequest | null;
    employees: Employee[];
    onSave: (requestData: Omit<LeaveRequest, 'id' | 'employeeName' | 'employeeAvatar'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ request, employees, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: request?.id || undefined,
        employeeId: request?.employeeId || '',
        leaveType: request?.leaveType || LeaveType.Annual,
        startDate: request?.startDate || '',
        endDate: request?.endDate || '',
        reason: request?.reason || '',
        status: request?.status || LeaveStatus.Pending,
        document: request?.document || undefined,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState<any>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate days requested
    const daysRequested = useMemo(() => {
        if (formData.startDate && formData.endDate) {
            return calculateLeaveDays(formData.startDate, formData.endDate);
        }
        return 0;
    }, [formData.startDate, formData.endDate]);

    // Validate balance when dates or leave type changes
    useEffect(() => {
        if (formData.employeeId && formData.leaveType && daysRequested > 0 && leaveBalance) {
            const balanceForType = leaveBalance[formData.leaveType];
            if (balanceForType) {
                const validation = validateLeaveBalance(daysRequested, balanceForType.remaining);
                setValidationError(validation.valid ? null : validation.message || null);
            }
        } else {
            setValidationError(null);
        }
    }, [formData.employeeId, formData.leaveType, daysRequested, leaveBalance]);

    const handleBalanceLoad = (balance: any) => {
        setLeaveBalance(balance);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string; // base64 string
                setFormData(prev => ({ ...prev, document: { name: file.name, content } }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({ ...prev, document: undefined }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
            if (fileInputRef.current) {
                fileInputRef.current.files = e.dataTransfer.files;
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { ...dataToSave } = formData;
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-[#0a0f14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 bg-white/5 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                            <ClockIcon className="w-8 h-8 text-orange-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{request ? 'Adjust Protocol' : 'New Leave Signal'}</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">Operational Downtime Authorization</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Leave Balance Display */}
                        {formData.employeeId && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden">
                                <LeaveBalanceCard employeeId={formData.employeeId} onBalanceLoad={handleBalanceLoad} />
                            </div>
                        )}

                        {/* Days Requested Info */}
                        {daysRequested > 0 && (
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Requested</p>
                                    <p className="text-xl font-black text-cyan-400 uppercase tracking-tight">{daysRequested} Operational Cycle{daysRequested !== 1 ? 's' : ''}</p>
                                </div>
                                <CalendarIcon className="w-10 h-10 text-cyan-500/20" />
                            </div>
                        )}

                        {/* Validation Error */}
                        {validationError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-relaxed">
                                    Critical: {validationError}
                                </p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="employeeId" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Protocol Node</label>
                            <SearchableEmployeeDropdown
                                employees={employees.filter(e => e.status === EmployeeStatus.Active || e.status === EmployeeStatus.OnLeave)}
                                value={formData.employeeId}
                                placeholder="Select Operational Node..."
                                onChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                            />
                        </div>

                        <div>
                            <label htmlFor="leaveType" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Mission Downtime Type</label>
                            <select name="leaveType" id="leaveType" value={formData.leaveType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" required>
                                {Object.values(LeaveType).map(lt => <option key={lt} value={lt}>{lt}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="startDate" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Start Sync</label>
                                <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" required />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">End Sync</label>
                                <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" required />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Mission Justification</label>
                            <textarea name="reason" id="reason" value={formData.reason} onChange={handleChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-none" placeholder="Provide operational context..." required></textarea>
                        </div>

                        <div>
                            <label htmlFor="document" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Evidence Payload</label>
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={`mt-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                <CloudArrowUpIcon className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-cyan-400' : 'text-slate-700'}`} />
                                <div className="text-center">
                                    <label htmlFor="document-upload" className="relative cursor-pointer group">
                                        <span className="text-[10px] font-black text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase tracking-widest">Inject File Payload</span>
                                        <input id="document-upload" name="document-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} />
                                    </label>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-2">or drag-and-drop evidence</p>
                                </div>
                            </div>
                            {formData.document?.name && (
                                <div className="mt-4 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <DocumentCheckIcon className="w-5 h-5 text-emerald-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[200px]">{formData.document.name}</span>
                                    </div>
                                    <button type="button" onClick={handleRemoveFile} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">Abort</button>
                        <button type="submit" className="px-8 py-3 executive-gradient text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            {request ? 'Update Protocol' : 'Execute Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LeaveManagement: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'All'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

    const filteredRequests = useMemo(() => {
        if (statusFilter === 'All') return leaveRequests;
        return leaveRequests.filter(req => req.status === statusFilter);
    }, [leaveRequests, statusFilter]);

    const handleOpenModal = (request: LeaveRequest | null = null) => {
        setEditingRequest(request);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRequest(null);
    };

    const handleSaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'employeeName' | 'employeeAvatar'> & { id?: string }) => {
        const employee = employees.find(e => e.id === requestData.employeeId);
        if (!employee) return;

        if (requestData.id) { // Editing
            setLeaveRequests(leaveRequests.map(req =>
                req.id === requestData.id
                    ? {
                        ...req,
                        ...requestData,
                        employeeName: employee.name,
                        employeeAvatar: employee.avatarUrl
                    }
                    : req
            ));
        } else { // Adding
            const newRequest: LeaveRequest = {
                ...requestData,
                id: crypto.randomUUID(),
                employeeName: employee.name,
                employeeAvatar: employee.avatarUrl,
            };
            setLeaveRequests([newRequest, ...leaveRequests]);
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (requestId: string) => {
        setLeaveRequests(leaveRequests.filter(req => req.id !== requestId));
    };

    const handleStatusUpdate = async (id: string, newStatus: LeaveStatus) => {
        const request = leaveRequests.find(req => req.id === id);
        if (!request) return;

        // If approving, deduct days from balance
        if (newStatus === LeaveStatus.Approved && request.status === LeaveStatus.Pending) {
            try {
                // Calculate days
                const days = calculateLeaveDays(request.startDate, request.endDate);

                // Deduct from leave entitlements
                await leaveEntitlementsAPI.deduct(
                    request.employeeId,
                    request.leaveType,
                    days
                );

                console.log(`✅ Deducted ${days} days of ${request.leaveType} leave for ${request.employeeName}`);
                alert(`Leave approved! ${days} day(s) deducted from ${request.employeeName}'s ${request.leaveType} leave balance.`);
            } catch (error) {
                console.error('Error deducting leave days:', error);
                alert('Leave approved, but failed to update balance. Please check manually.');
            }
        }

        setLeaveRequests(leaveRequests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    const statusMap: { [key in LeaveStatus]: { text: string; bg: string; dot: string } } = {
        [LeaveStatus.Approved]: { text: 'text-green-800', bg: 'bg-green-100', dot: 'bg-green-500' },
        [LeaveStatus.Pending]: { text: 'text-orange-800', bg: 'bg-orange-100', dot: 'bg-orange-500' },
        [LeaveStatus.Rejected]: { text: 'text-red-800', bg: 'bg-red-100', dot: 'bg-red-500' },
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                    <PlusIcon className="w-4 h-4" />
                    Initiate Downtime
                </button>
            </div>
            <div className="glass-card rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight text-center sm:text-left">Downtime Logs</h2>
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1 text-center sm:text-left">Synchronized Leave Authorization Registry</p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-3">
                        {(['All', ...Object.values(LeaveStatus)] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Node</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Downtime Type</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Range</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Justification</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Command</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 flex items-center gap-4">
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-cyan-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <img src={req.employeeAvatar} alt={req.employeeName} className="w-12 h-12 rounded-xl object-cover relative border border-white/10" />
                                        </div>
                                        <span className="font-black text-white uppercase tracking-tight text-sm">{req.employeeName}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{req.leaveType}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-[11px] text-white/80">{req.startDate}</span>
                                            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">through</span>
                                            <span className="font-mono text-[11px] text-white/80">{req.endDate}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 max-w-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="truncate text-xs text-slate-400 font-medium" title={req.reason}>{req.reason}</span>
                                            {req.document?.name && (
                                                <div className="p-1.5 bg-cyan-500/10 rounded-lg" title={req.document.name}>
                                                    <DocumentIcon className="w-3.5 h-3.5 text-cyan-400" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 ${req.status === LeaveStatus.Approved ? 'bg-emerald-500/10 text-emerald-400' : req.status === LeaveStatus.Pending ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${req.status === LeaveStatus.Approved ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : req.status === LeaveStatus.Pending ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            {req.status === LeaveStatus.Pending ? (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(req.id, LeaveStatus.Approved)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all" title="Authorize"><CheckCircleIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleStatusUpdate(req.id, LeaveStatus.Rejected)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all" title="Deny"><XCircleIcon className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Locked</span>
                                            )}
                                            <div className="h-4 w-px bg-white/10"></div>
                                            <button onClick={() => handleOpenModal(req)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-all" title="Modify"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteRequest(req.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all" title="Purge"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <LeaveRequestModal request={editingRequest} employees={employees} onSave={handleSaveRequest} onClose={handleCloseModal} />}
        </div>
    );
};

const DashboardContent: React.FC = () => {
    const totalEmployees = initialEmployees.length;
    const pendingLeaves = initialLeaveRequests.filter(r => r.status === LeaveStatus.Pending).length;
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mt-1">Real-time Operational Intelligence</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-cyan-500/10 transition-all duration-700"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
                            <UserGroupIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg uppercase tracking-wider">↑ 22%</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Total Intel Nodes</p>
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">124</p>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/10 transition-all duration-700"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                            <LeaveIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-[10px] font-black text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg uppercase tracking-wider">Active</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Pending Requests</p>
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">12</p>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/10 transition-all duration-700"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <BuildingOfficeIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg uppercase tracking-wider">Open</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Vacant Slots</p>
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">08</p>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-all duration-700"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <DollarIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg uppercase tracking-wider">Stability</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Economic Flow</p>
                        <p className="text-4xl font-black text-white tracking-tighter tabular-nums">94.2M</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Charts */}
            <DashboardCharts />
        </div>
    );
};

const UserManagement: React.FC<{ users: SystemUser[], setUsers: React.Dispatch<React.SetStateAction<SystemUser[]>> }> = ({ users, setUsers }) => {

    const handleStatusToggle = (userId: string) => {
        setUsers(users.map(user =>
            user.id === userId ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user
        ));
    };

    return (
        <div className="glass-card rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identity Registry</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">System-wide Node Permissions & Access</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Identity</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Hash</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Role</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Sync</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6 flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-xl object-cover relative border border-white/10" />
                                    </div>
                                    <span className="font-black text-white uppercase tracking-tight text-sm">{user.name}</span>
                                </td>
                                <td className="p-6 font-mono text-xs text-slate-400">{user.username}</td>
                                <td className="p-6 text-xs text-slate-500">{user.email}</td>
                                <td className="p-6">
                                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg uppercase tracking-tight border border-cyan-400/20">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-6 text-[10px] font-mono text-slate-600 uppercase">{user.lastLogin}</td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/30 text-slate-500 border border-white/5'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <label htmlFor={`toggle-${user.id}`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id={`toggle-${user.id}`} className="sr-only" checked={user.status === 'Active'} onChange={() => handleStatusToggle(user.id)} />
                                            <div className="block bg-white/5 border border-white/10 w-12 h-6 rounded-full transition-all group-hover:bg-white/10"></div>
                                            <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all duration-300 ${user.status === 'Active' ? 'translate-x-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-700'}`}></div>
                                        </div>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AssignPermissions: React.FC<{ roles: SystemRoleDefinition[], setRoles: React.Dispatch<React.SetStateAction<SystemRoleDefinition[]>> }> = ({ roles, setRoles }) => {

    const handlePermissionChange = (roleId: string, permissionKey: string, checked: boolean) => {
        setRoles(roles.map(role => {
            if (role.id === roleId) {
                const newPermissions = checked
                    ? [...role.permissions, permissionKey]
                    : role.permissions.filter(p => p !== permissionKey);
                return { ...role, permissions: newPermissions };
            }
            return role;
        }));
    };

    return (
        <div className="glass-card shadow-2xl rounded-[2rem] border border-white/5 overflow-hidden animate-fade-in relative h-full flex flex-col">
             <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="p-8 lg:p-12 border-b border-white/5 relative z-10 shrink-0">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Clearance Matrix</h2>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-2">Manage nodal sector operational capabilities</p>
            </div>
            <div className="p-8 lg:p-12 space-y-10 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                {roles.map(role => (
                    <div key={role.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-500/20 transition-all group">
                        <div className="mb-8 border-b border-white/5 pb-6">
                             <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">{role.name}</h3>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{role.description}</p>
                        </div>
                        <div className="space-y-8">
                            {ALL_PERMISSIONS.map(category => (
                                <div key={category.category}>
                                    <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                                         <span className="w-8 h-[1px] bg-cyan-500/30"></span>
                                         {category.category}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {category.permissions.map(perm => (
                                            <label key={perm.key} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group/label">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${role.permissions.includes(perm.key) ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-white/10 bg-black/40'}`}>
                                                    {role.permissions.includes(perm.key) && <div className="w-2.5 h-2.5 bg-[#020617] rounded-sm"></div>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={role.permissions.includes(perm.key)}
                                                    onChange={(e) => handlePermissionChange(role.id, perm.key, e.target.checked)}
                                                />
                                                <span className="text-[10px] font-black text-slate-400 group-hover/label:text-white uppercase tracking-tight transition-colors">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DocumentTypeModal: React.FC<{
    documentType: DocumentTypeDefinition | null;
    allRoles: SystemRoleDefinition[];
    onSave: (data: Omit<DocumentTypeDefinition, 'id'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ documentType, allRoles, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: documentType?.id || undefined,
        name: documentType?.name || '',
        description: documentType?.description || '',
        requiredFor: documentType?.requiredFor || [],
        accessPermissions: documentType?.accessPermissions || [],
        workflow: documentType?.workflow || 'None',
    });

    const handleCheckboxChange = (field: 'requiredFor' | 'accessPermissions', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-[#0a0f14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 bg-white/5 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                            <DocumentDuplicateIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{documentType ? 'Edit Schema' : 'New Directive'}</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">Registry Backbone Configuration</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div>
                            <label htmlFor="name" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Directive Tag</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" placeholder="e.g., Medical Clearance" required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Directive Details</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-none" placeholder="Explain the directive's purpose..." required></textarea>
                        </div>
                        <div>
                            <label htmlFor="workflow" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Authorization Pipeline</label>
                            <select name="workflow" id="workflow" value={formData.workflow} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" required>
                                {Object.values(DocumentWorkflow).map(wf => <option key={wf} value={wf}>{wf}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest ml-1">Operational Requirement (Leave Signals)</label>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.values(LeaveType).map(lt => (
                                    <label key={lt} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.requiredFor.includes(lt) ? 'bg-cyan-500 border-cyan-500' : 'border-white/10 bg-black/20'}`}>
                                            {formData.requiredFor.includes(lt) && <div className="w-2.5 h-2.5 bg-black rounded-sm"></div>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.requiredFor.includes(lt)}
                                            onChange={() => handleCheckboxChange('requiredFor', lt)}
                                        />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-tight transition-colors">{lt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest ml-1">Access Clearances (Protocol Roles)</label>
                            <div className="grid grid-cols-2 gap-4">
                                {allRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.accessPermissions.includes(role.name) ? 'bg-emerald-500 border-emerald-500' : 'border-white/10 bg-black/20'}`}>
                                            {formData.accessPermissions.includes(role.name) && <div className="w-2.5 h-2.5 bg-black rounded-sm"></div>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.accessPermissions.includes(role.name)}
                                            onChange={() => handleCheckboxChange('accessPermissions', role.name)}
                                        />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-tight transition-colors">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">Abort</button>
                        <button type="submit" className="px-8 py-3 executive-gradient text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            {documentType ? 'Update Schema' : 'Execute Directive'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfigureDocumentTypes: React.FC<{ allRoles: SystemRoleDefinition[] }> = ({ allRoles }) => {
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeDefinition[]>(initialDocumentTypes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocType, setEditingDocType] = useState<DocumentTypeDefinition | null>(null);

    const handleOpenModal = (docType: DocumentTypeDefinition | null = null) => {
        setEditingDocType(docType);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocType(null);
    };

    const handleSaveDocumentType = (data: Omit<DocumentTypeDefinition, 'id'> & { id?: string }) => {
        if (data.id) { // Editing
            setDocumentTypes(documentTypes.map(doc => doc.id === data.id ? { ...doc, ...data } as DocumentTypeDefinition : doc));
        } else { // Adding
            const newDocType: DocumentTypeDefinition = {
                ...data,
                id: crypto.randomUUID(),
            };
            setDocumentTypes([newDocType, ...documentTypes]);
        }
        handleCloseModal();
    };

    const handleDeleteDocumentType = (id: string) => {
        setDocumentTypes(documentTypes.filter(doc => doc.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Protocol Library</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1 text-center sm:text-left">Operational Directive Configuration Registry</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                    <PlusIcon className="w-4 h-4" />
                    Inject Protocol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {documentTypes.map(doc => (
                    <div key={doc.id} className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-cyan-500/10 transition-all duration-700"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <DocumentTextIcon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{doc.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleOpenModal(doc)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-all"><EditIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteDocumentType(doc.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8 flex-grow">{doc.description}</p>

                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">Pipeline</h4>
                                <span className="inline-block bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                    {doc.workflow}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">Requirement Signal</h4>
                                {doc.requiredFor.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {doc.requiredFor.map(lt => <span key={lt} className="bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-orange-500/20">{lt}</span>)}
                                    </div>
                                ) : <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Global Compliance</span>}
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">Access Nodes</h4>
                                {doc.accessPermissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {doc.accessPermissions.map(role => <span key={role} className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-emerald-500/20">{role}</span>)}
                                    </div>
                                ) : <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Restricted Entry</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <DocumentTypeModal documentType={editingDocType} allRoles={allRoles} onSave={handleSaveDocumentType} onClose={handleCloseModal} />}
        </div>
    );
};

const VehicleManagement: React.FC<{
    employees: Employee[];
    vehicles: Vehicle[];
    setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}> = ({ employees, vehicles, setVehicles }) => {
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>(initialVehicleLogs);
    const [isVehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isLogsModalOpen, setLogsModalOpen] = useState(false);
    const [viewingLogsFor, setViewingLogsFor] = useState<Vehicle | null>(null);

    const handleOpenVehicleModal = (vehicle: Vehicle | null = null) => {
        setEditingVehicle(vehicle);
        setVehicleModalOpen(true);
    };

    const handleCloseVehicleModal = () => {
        setVehicleModalOpen(false);
        setEditingVehicle(null);
    };

    const handleOpenLogsModal = (vehicle: Vehicle) => {
        setViewingLogsFor(vehicle);
        setLogsModalOpen(true);
    };

    const handleCloseLogsModal = () => {
        setLogsModalOpen(false);
        setViewingLogsFor(null);
    };

    const handleSaveVehicle = (data: Omit<Vehicle, 'id' | 'avatarUrl'> & { id?: string }) => {
        if (data.id) { // Editing
            setVehicles(vehicles.map(v => v.id === data.id ? { ...v, ...data } as Vehicle : v));
        } else { // Adding
            const newVehicle: Vehicle = {
                ...data,
                id: crypto.randomUUID(),
                avatarUrl: `https://i.imgur.com/${['Qz2QzX3', 'H5f9T6b', 'g89BGvX'][Math.floor(Math.random() * 3)]}.png`
            };
            setVehicles([newVehicle, ...vehicles]);
        }
        handleCloseVehicleModal();
    };

    const handleDeleteVehicle = (id: string) => {
        setVehicles(vehicles.filter(v => v.id !== id));
        setVehicleLogs(vehicleLogs.filter(log => log.vehicleId !== id)); // Also remove logs
    };

    const statusMap: { [key in VehicleStatus]: { color: string; bg: string; dot: string } } = {
        [VehicleStatus.Available]: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
        [VehicleStatus.InUse]: { color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' },
        [VehicleStatus.Maintenance]: { color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
        [VehicleStatus.OutOfService]: { color: 'text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-400' },
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Mobile Fleet</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1 text-center sm:text-left">Strategic Mobility Asset Registry</p>
                </div>
                <button onClick={() => handleOpenVehicleModal()} className="flex items-center gap-2 executive-gradient text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                    <PlusIcon className="w-4 h-4" />
                    Deploy Asset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vehicles.map(vehicle => {
                    const assignedEmployee = employees.find(e => e.id === vehicle.assignedTo);
                    const status = statusMap[vehicle.status];
                    return (
                        <div key={vehicle.id} className="glass-card rounded-[2.5rem] flex flex-col overflow-hidden border border-white/5 relative group hover:border-white/10 transition-all">
                            <div className="relative h-48 overflow-hidden pointer-events-none">
                                <img src={vehicle.avatarUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md ${status.bg} ${status.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} shadow-[0_0_8px_rgba(34,211,238,0.5)]`}></span>
                                        {vehicle.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-8 flex-grow flex flex-col -mt-4 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{vehicle.make} {vehicle.model}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{vehicle.year}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="text-[10px] text-cyan-400 font-mono tracking-wider">{vehicle.registration}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 mt-auto border-t border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator Contact</span>
                                        {assignedEmployee ? (
                                            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                                                <img src={assignedEmployee.avatarUrl} alt={assignedEmployee.name} className="w-5 h-5 rounded-lg border border-white/20" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{assignedEmployee.name}</span>
                                            </div>
                                        ) : <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">Unassigned</span>}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Maintenance Sync</span>
                                        <span className="text-[10px] font-mono text-slate-300">{vehicle.nextMaintenance}</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <button onClick={() => handleOpenLogsModal(vehicle)} className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                                        Log History
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenVehicleModal(vehicle)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5" title="Modify"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all border border-white/5" title="Purge"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {isVehicleModalOpen && <VehicleModal vehicle={editingVehicle} allEmployees={employees} onSave={handleSaveVehicle} onClose={handleCloseVehicleModal} />}
            {isLogsModalOpen && viewingLogsFor && <VehicleLogsModal vehicle={viewingLogsFor} logs={vehicleLogs.filter(l => l.vehicleId === viewingLogsFor.id)} employees={employees} onClose={handleCloseLogsModal} />}
        </div>
    );
};

const VehicleModal: React.FC<{
    vehicle: Vehicle | null;
    allEmployees: Employee[];
    onSave: (data: Omit<Vehicle, 'id' | 'avatarUrl'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ vehicle, allEmployees, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: vehicle?.id,
        make: vehicle?.make || '',
        model: vehicle?.model || '',
        year: vehicle?.year || new Date().getFullYear(),
        registration: vehicle?.registration || '',
        insuranceExpiry: vehicle?.insuranceExpiry || '',
        status: vehicle?.status || VehicleStatus.Available,
        assignedTo: vehicle?.assignedTo || '',
        lastMaintenance: vehicle?.lastMaintenance || '',
        nextMaintenance: vehicle?.nextMaintenance || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-[#0a0f14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 bg-white/5 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                            <VehicleIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{vehicle ? 'Reconfigure Asset' : 'New Fleet Unit'}</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">Strategic Mobility Node Registration</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div>
                            <label htmlFor="make" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Fleet Manufacturer</label>
                            <input type="text" name="make" id="make" value={formData.make} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" placeholder="e.g., Tesla" required />
                        </div>
                        <div>
                            <label htmlFor="model" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Asset Model</label>
                            <input type="text" name="model" id="model" value={formData.model} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight" placeholder="e.g., Model S" required />
                        </div>
                        <div>
                            <label htmlFor="year" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Production Cycle</label>
                            <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" required />
                        </div>
                        <div>
                            <label htmlFor="registration" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Signal ID (Reg)</label>
                            <input type="text" name="registration" id="registration" value={formData.registration} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" placeholder="ABC-123" required />
                        </div>
                        <div>
                            <label htmlFor="insuranceExpiry" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Security Expiry</label>
                            <input type="date" name="insuranceExpiry" id="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono text-white/70" required />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Asset Condition</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-black uppercase tracking-tight">
                                {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="assignedTo" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Active Operator</label>
                            <SearchableEmployeeDropdown
                                employees={allEmployees.filter(e => e.status === EmployeeStatus.Active)}
                                value={formData.assignedTo}
                                onChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                                placeholder="Assign Operator Node..."
                            />
                        </div>
                        <div>
                            <label htmlFor="lastMaintenance" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Last Logged Maint</label>
                            <input type="date" name="lastMaintenance" id="lastMaintenance" value={formData.lastMaintenance} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" />
                        </div>
                        <div>
                            <label htmlFor="nextMaintenance" className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Scheduled Sync</label>
                            <input type="date" name="nextMaintenance" id="nextMaintenance" value={formData.nextMaintenance} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono" />
                        </div>
                    </div>
                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">Abort</button>
                        <button type="submit" className="px-8 py-3 executive-gradient text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            {vehicle ? 'Update Registry' : 'Initialize Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VehicleLogsModal: React.FC<{
    vehicle: Vehicle;
    logs: VehicleLog[];
    employees: Employee[];
    onClose: () => void;
}> = ({ vehicle, logs, employees, onClose }) => {
    return (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-[#0a0f14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 border-b border-white/5 bg-white/5 relative">
                    <div className="absolute top-0 right-0 p-6">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                            <ClipboardDocumentListIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Operational Logs: {vehicle.make}</h3>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">{vehicle.registration} — Mission History</p>
                </div>
                <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {logs.length > 0 ? (
                        <div className="rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
                                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Range</th>
                                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Distance</th>
                                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Mission Objective</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map(log => {
                                        const driver = employees.find(e => e.id === log.driverId);
                                        const mileage = log.endMileage - log.startMileage;
                                        return (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 flex items-center gap-3">
                                                    {driver && <img src={driver.avatarUrl} alt={driver.name} className="w-7 h-7 rounded-lg border border-white/10" />}
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{driver?.name || 'N/A'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-mono text-slate-400">{log.startDate}{log.endDate !== log.startDate && ` → ${log.endDate}`}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{mileage} NM</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] text-slate-400 font-medium">{log.purpose}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <DocumentTextIcon className="w-10 h-10 text-slate-700" />
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Registry Empty</h4>
                            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-2">No historical data found for this asset.</p>
                        </div>
                    )}
                </div>
                <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end">
                    <button type="button" onClick={onClose} className="px-8 py-3 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10">Terminate Sync</button>
                </div>
            </div>
        </div>
    );
};

interface SidebarMenuItemProps {
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
    onClick: () => void;
    isSubItem?: boolean;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ icon, text, isActive, onClick, isSubItem }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group relative ${isActive
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            } ${isSubItem ? 'pl-8 py-1.5' : ''}`}
    >
        <div className={`flex-shrink-0 transition-all duration-300 ${isActive ? '' : 'group-hover:text-cyan-400'}`}>
            {icon}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap text-left truncate leading-none`}>
            {text}
        </span>
    </button>
);

interface SidebarMenuItemCollapsibleProps {
    icon: React.ReactNode;
    text: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const SidebarMenuItemCollapsible: React.FC<SidebarMenuItemCollapsibleProps> = ({ icon, text, isOpen, onToggle, children }) => (
    <div>
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300 group"
        >
            <div className="flex items-center gap-3">
                <span className="flex-shrink-0 group-hover:text-cyan-400 transition-all duration-300">{icon}</span>
                <span className="whitespace-nowrap font-black text-[9px] uppercase tracking-widest leading-none">{text}</span>
            </div>
            <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-600'}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="pt-0.5 space-y-0.5 ml-2 border-l border-white/5 pl-2">
                {children}
            </div>
        </div>
    </div>
);

const Content: React.FC<{
    currentPage: Page;
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    vacancies: Vacancy[];
    setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
    candidates: Candidate[];
    setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
    systemUsers: SystemUser[];
    setSystemUsers: React.Dispatch<React.SetStateAction<SystemUser[]>>;
    handleUserCreate: (newUserData: any) => void;
    systemRoles: SystemRoleDefinition[];
    setSystemRoles: React.Dispatch<React.SetStateAction<SystemRoleDefinition[]>>;
    vehicles: Vehicle[];
    setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}> = ({ currentPage, employees, setEmployees, vacancies, candidates, setCandidates, setVacancies, systemUsers, setSystemUsers, handleUserCreate, systemRoles, setSystemRoles, vehicles, setVehicles }) => {
    switch (currentPage) {
        case Page.Dashboard:
            return <DashboardCharts />;
        case Page.Payroll:
            return <PayrollManagement />;
        case Page.EmployeeManagement:
            return <EmployeeManagement employees={employees} setEmployees={setEmployees} />;
        case Page.LeaveManagement:
            return <LeaveManagement employees={employees} />;
        case Page.VehicleManagement:
            return <VehicleManagement employees={employees} vehicles={vehicles} setVehicles={setVehicles} />;
        case Page.Recruitment:
            return <Recruitment
                vacancies={vacancies}
                candidates={candidates}
                employees={employees}
                onUpdateCandidates={setCandidates}
                onUpdateVacancies={setVacancies}
            />;
        case Page.CreateUser:
            return <CreateUser roles={systemRoles} onUserCreate={handleUserCreate} />;
        case Page.ManageUsers:
            return <UserManagement users={systemUsers} setUsers={setSystemUsers} />;
        case Page.ResetPasswords:
            return <ResetPasswords users={systemUsers} />;
        case Page.AssignPermissions:
            return <AssignPermissions roles={systemRoles} setRoles={setSystemRoles} />;
        case Page.ConfigureDocumentTypes:
            return <ConfigureDocumentTypes allRoles={systemRoles} />;
        case Page.Operations:
            return <Operations employees={employees} vehicles={vehicles} />;
        case Page.SalesAndMarketing:
            return <SalesMarketing employees={employees} />;
        case Page.Finance:
            return <Finance employees={employees} />;
        case Page.Reports:
            return <Reports />;
        case Page.Settings:
            return <Settings />;
        case Page.AttendanceTracking:
            return <AttendanceTracking />;
        case Page.PerformanceManagement:
            return <PerformanceManagement />;
        case Page.TrainingDevelopment:
            return <TrainingDevelopment />;
        case Page.DisciplinaryGrievance:
            return <DisciplinaryGrievance />;
        case Page.HRReports:
            return <HRReports />;
        case Page.OrgChart:
            return <OrgChart />;
        case Page.AuditLogs:
            return <AuditLogs />;
        default:
            return <div className="text-white text-center p-10">Select a page from the menu.</div>;
    }
};

interface Notification {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
}

const NotificationsPanel: React.FC<{
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}> = ({ notifications, setNotifications }) => {

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    return (
        <div className="absolute top-full right-0 mt-5 w-80 sm:w-96 glass-card bg-[#0a0f14]/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-30 animate-fade-in-down overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Intelligence Feed</h3>
                {unreadCount > 0 && <span className="text-[10px] bg-cyan-500 text-black font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{unreadCount} New</span>}
            </div>
            <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? notifications.map(notification => (
                    <div key={notification.id} className={`flex items-start gap-4 p-6 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all cursor-pointer group ${!notification.read ? 'bg-cyan-500/5' : ''}`}>
                        <div className="flex-shrink-0 mt-1 p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">{notification.icon}</div>
                        <div className="flex-grow">
                            <p className="font-black text-[13px] text-white uppercase tracking-tight mb-1">{notification.title}</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{notification.description}</p>
                            <p className="text-[9px] text-slate-600 mt-2 font-black uppercase tracking-widest">{notification.timestamp}</p>
                        </div>
                    </div>
                )) : (
                    <div className="p-12 text-center">
                        <BellIcon className="w-16 h-16 mx-auto text-slate-800 mb-4" />
                        <h4 className="font-black text-white uppercase tracking-widest text-sm">Quiet Spectrum</h4>
                        <p className="text-xs text-slate-500 mt-2">All data cycles are synchronized.</p>
                    </div>
                )}
            </div>
            <div className="p-4 bg-black/40 border-t border-white/5">
                <button onClick={handleMarkAllRead} className="w-full text-center text-[10px] font-black text-cyan-400 hover:text-cyan-300 py-3 rounded-xl hover:bg-white/5 transition-all uppercase tracking-[0.2em]">
                    Synchronize All
                </button>
            </div>
        </div>
    );
};

export const DashboardLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [vacancies, setVacancies] = useState<Vacancy[]>(initialVacancies);
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>(initialSystemUsers);
    const [systemRoles, setSystemRoles] = useState<SystemRoleDefinition[]>(initialSystemRoles);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
    const [openMenus, setOpenMenus] = useState<string[]>(['HR Management', 'User Management']);
    
    // Theme Toggle State Hooks
    const [isLightTheme, setIsLightTheme] = useState(() => {
        return document.documentElement.classList.contains('light-theme');
    });

    useEffect(() => {
        if (isLightTheme) {
            document.documentElement.classList.add('light-theme');
        } else {
            document.documentElement.classList.remove('light-theme');
        }
    }, [isLightTheme]);

    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', icon: <LeaveIcon className="w-6 h-6 text-orange-500" />, title: "New Leave Request", description: "John Doe has requested annual leave.", timestamp: "15 minutes ago", read: false },
        { id: '2', icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />, title: "Request Approved", description: "Your sick leave request has been approved.", timestamp: "1 hour ago", read: false },
        { id: '3', icon: <RecruitmentIcon className="w-6 h-6 text-indigo-500" />, title: "New Candidate", description: "A new candidate applied for the Frontend Developer role.", timestamp: "3 hours ago", read: true },
    ]);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Fetch data from API on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [employeesRes, vehiclesRes, vacanciesRes, candidatesRes] = await Promise.all([
                    employeesAPI.getAll(),
                    vehiclesAPI.getAll(),
                    vacanciesAPI.getAll(),
                    candidatesAPI.getAll(),
                ]);
                if (employeesRes.data && employeesRes.data.length > 0) {
                    setEmployees(employeesRes.data);
                }
                if (vehiclesRes.data && vehiclesRes.data.length > 0) {
                    setVehicles(vehiclesRes.data);
                }
                if (vacanciesRes.data && vacanciesRes.data.length > 0) {
                    setVacancies(vacanciesRes.data);
                }
                if (candidatesRes.data && candidatesRes.data.length > 0) {
                    setCandidates(candidatesRes.data);
                }
            } catch (error) {
                console.error('Error fetching data from API:', error);
                // Keep using initial data if API fails
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUserCreate = (newUserData: any) => {
        const newUser: SystemUser = {
            id: crypto.randomUUID(),
            name: newUserData.fullName,
            username: newUserData.username,
            email: newUserData.email,
            role: systemRoles.find(r => r.id === newUserData.role)?.name || 'Employee',
            department: Department.Support,
            status: newUserData.status,
            avatarUrl: newUserData.avatar
                ? URL.createObjectURL(newUserData.avatar)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserData.fullName)}&background=0ea5e9&color=fff`,
            lastLogin: 'Never'
        };
        setSystemUsers(prev => [newUser, ...prev]);
    };

    const handleMenuClick = (page: Page) => {
        setActivePage(page);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleToggleMenu = (menu: string) => {
        setOpenMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
    };

    const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const menuItems = [
        { name: Page.Dashboard, icon: DashboardIcon },
        { name: Page.Operations, icon: OperationsIcon },
        { name: Page.VehicleManagement, icon: VehicleIcon },
        { name: Page.Recruitment, icon: RecruitmentIcon },
        { name: Page.SalesAndMarketing, icon: SalesMarketingIcon },
        { name: Page.Finance, icon: FinanceIcon },
        { name: Page.HRReports, icon: DocumentTextIcon },
        {
            name: 'HR Management', icon: UserGroupIcon, subItems: [
                { name: Page.EmployeeManagement, icon: UserIcon },
                { name: Page.LeaveManagement, icon: LeaveIcon },
                { name: Page.AttendanceTracking, icon: DashboardIcon },
                { name: Page.Payroll, icon: DollarIcon },
                { name: Page.PerformanceManagement, icon: ReportsIcon },
                { name: Page.Recruitment, icon: RecruitmentIcon },
                { name: Page.TrainingDevelopment, icon: SettingsIcon },
                { name: Page.DisciplinaryGrievance, icon: ShieldCheckIcon },
            ]
        },
        {
            name: 'User Management', icon: UserIcon, subItems: [
                { name: Page.CreateUser, icon: PlusIcon },
                { name: Page.ManageUsers, icon: UserGroupIcon },
                { name: Page.ResetPasswords, icon: KeyIcon },
            ]
        },
        {
            name: 'Roles & Permissions', icon: ShieldCheckIcon, subItems: [
                { name: Page.AssignPermissions, icon: KeyIcon },
            ]
        },
        {
            name: 'Document Templates', icon: ClipboardDocumentListIcon, subItems: [
                { name: Page.ConfigureDocumentTypes, icon: DocumentTextIcon },
            ]
        },
        { name: Page.Reports, icon: ReportsIcon },
        { name: Page.Settings, icon: SettingsIcon },
        { name: Page.AuditLogs, icon: ShieldCheckIcon },
    ];

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30">
            {/* Sidebar */}
            <aside className={`glass-sidebar w-64 min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 flex flex-col`}>
                <div className="flex items-center justify-center h-16 border-b border-white/5 px-4">
                    <img src="/assets/pts-logo-light.png" alt="PTS" className="h-10 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {menuItems.map((item) => (
                        'subItems' in item ? (
                            <SidebarMenuItemCollapsible
                                key={item.name}
                                icon={<item.icon className="w-4 h-4" />}
                                text={item.name}
                                isOpen={openMenus.includes(item.name)}
                                onToggle={() => handleToggleMenu(item.name)}
                            >
                                {item.subItems.map(subItem => (
                                    <SidebarMenuItem
                                        key={subItem.name}
                                        icon={<subItem.icon className="w-3.5 h-3.5" />}
                                        text={subItem.name}
                                        isActive={activePage === subItem.name}
                                        onClick={() => handleMenuClick(subItem.name)}
                                        isSubItem
                                    />
                                ))}
                            </SidebarMenuItemCollapsible>
                        ) : (
                            <SidebarMenuItem
                                key={item.name}
                                icon={<item.icon className="w-4 h-4" />}
                                text={item.name}
                                isActive={activePage === item.name}
                                onClick={() => handleMenuClick(item.name as Page)}
                            />
                        )
                    ))}
                </nav>
                <div className="px-3 py-4 border-t border-white/5">
                    <SidebarMenuItem icon={<LogoutIcon className="w-4 h-4" />} text="Logout" isActive={false} onClick={onLogout} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background ambient glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

                {/* Header */}
                <header className="h-24 flex-shrink-0 z-20 border-b border-white/5 bg-black/10 backdrop-blur-xl">
                    <div className="container mx-auto px-8 h-full flex items-center justify-between">
                        <div className="flex items-center">
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden mr-4 text-slate-400 hover:text-white transition-colors">
                                {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">{activePage}</h1>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Tactical Operations Node</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="relative hidden md:block group">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input type="text" placeholder="Quick Search..." className="pl-11 pr-4 py-2.5 w-72 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm transition-all hover:bg-white/10" />
                            </div>
                            
                            <button onClick={() => setIsLightTheme(!isLightTheme)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Toggle Theme">
                                {isLightTheme ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            
                            <div className="relative" ref={notificationsRef}>
                                <button onClick={() => setNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                    <BellIcon className="w-6 h-6" />
                                    {unreadNotificationsCount > 0 && <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black ring-4 ring-[#020617]">{unreadNotificationsCount}</span>}
                                </button>
                                {isNotificationsOpen && <NotificationsPanel notifications={notifications} setNotifications={setNotifications} />}
                            </div>
                            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                <div className="text-right">
                                    <p className="font-bold text-sm text-white">Alice Johnson</p>
                                    <p className="text-[10px] text-cyan-400 uppercase tracking-tighter font-black">Super Admin</p>
                                </div>
                                <img src="https://randomuser.me/api/portraits/women/10.jpg" alt="Admin" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 p-0.5" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in focus:outline-none">
                    <div className="max-w-7xl mx-auto space-y-6 glass-card">
                    <Content
                        currentPage={activePage}
                        employees={employees}
                        setEmployees={setEmployees}
                        vacancies={vacancies}
                        setVacancies={setVacancies}
                        candidates={candidates}
                        setCandidates={setCandidates}
                        systemUsers={systemUsers}
                        setSystemUsers={setSystemUsers}
                        handleUserCreate={handleUserCreate}
                        systemRoles={systemRoles}
                        setSystemRoles={setSystemRoles}
                        vehicles={vehicles}
                        setVehicles={setVehicles}
                    />
                    </div>
                </main>
            </div>
        </div>
    );
};
