// Organizational Departments
export enum Department {
    Executive = 'Executive',
    Operations = 'Operations',
    AdminFinance = 'Administration & Finance',
    Commercial = 'Commercial',
    Support = 'Support',
}

// Complete Organizational Roles
export enum SystemRole {
    // Executive Level
    Board = 'Board',
    ManagingDirector = 'Managing Director',
    DeputyManagingDirector = 'Deputy Managing Director',

    // Support Staff (Report to Managing Director)
    InternalAuditor = 'Internal Auditor',
    ProcurementOfficer = 'Procurement Officer',
    ITOfficer = 'IT Officer',
    PersonalAssistant = 'Personal Assistant',
    LegalAdvisor = 'Legal Advisor & Company Secretary',

    // Department Directors
    DirectorOperations = 'Director Operations',
    DirectorAdminFinance = 'Director Administration & Finance',
    DirectorCommercial = 'Director Commercial',

    // Operations Department
    FleetManager = 'Fleet Manager',
    InspectionComplianceOfficer = 'Inspection & Compliance Officer',
    MaintenanceOfficer = 'Maintenance Officer',
    GarageTechnician = 'Garage Technician',
    FuelManagementOfficer = 'Fuel Management Officer',
    AssistantFleetManager = 'Assistant Fleet Management Officer',

    // Administration & Finance Department
    ChiefAccountant = 'Chief Accountant',
    Accountant = 'Accountant',
    RecoveryOfficer = 'Recovery Officer',
    BillingOfficer = 'Billing Officer',
    Cashier = 'Cashier',
    HRManager = 'HR Manager',
    Receptionist = 'Receptionist',
    OfficerCleaners = 'Officer Cleaners',

    // Commercial Department
    TourOperations = 'Tour Operations',
    SalesMarketingManager = 'Sales & Marketing Manager',
    SalesOfficer = 'Sales Officer',
    TourOperationsOfficer = 'Tour Operations Officer',
    SalesMarketingOfficer = 'Sales Marketing Officer',
    SalesAssistant = 'Sales Assistant',

    // Legacy/General
    Administrator = 'Administrator',
    Employee = 'Employee',
}

// Permission levels for RBAC
export enum Permission {
    // System Administration
    ManageUsers = 'manage_users',
    ManageRoles = 'manage_roles',
    ViewAuditLogs = 'view_audit_logs',
    SystemSettings = 'system_settings',

    // Employee Management
    ViewAllEmployees = 'view_all_employees',
    ViewDepartmentEmployees = 'view_department_employees',
    ManageEmployees = 'manage_employees',
    ApproveLeave = 'approve_leave',

    // Operations
    ManageFleet = 'manage_fleet',
    ManageSchedules = 'manage_schedules',
    ViewOperations = 'view_operations',

    // Finance
    ManagePayroll = 'manage_payroll',
    ViewFinancials = 'view_financials',
    ProcessPayments = 'process_payments',

    // Commercial
    ManageLeads = 'manage_leads',
    ViewSales = 'view_sales',
    ManageTours = 'manage_tours',

    // Recruitment
    ManageVacancies = 'manage_vacancies',
    ViewCandidates = 'view_candidates',
}

export enum EmployeeStatus {
    Active = 'Active',
    OnLeave = 'On Leave',
    Terminated = 'Terminated',
}

export interface Employee {
    id: string;
    employeeId: string;
    name: string;
    department: Department;
    role: SystemRole;
    status: EmployeeStatus;
    avatarUrl: string;
    location: string;
    hireDate: string;
    reportsTo?: string; // ID of manager/supervisor
    terminationDate?: string;
    terminationReason?: 'Voluntary' | 'Involuntary';
    basic_salary?: number;
    transport_allowance?: number;
    housing_allowance?: number;
    other_allowances?: number;
}

// Employee Dependents (Spouse/Children for insurance)
export interface EmployeeDependent {
    id: string;
    employee_id: string;
    full_name: string;
    birth_date: string;
    relationship_type: 'Spouse' | 'Child' | 'Other';
    insurance_enrolled: boolean;
    is_emergency_contact: boolean;
    created_at: string;
    updated_at: string;
}

// Employee Documents (Degrees, Certificates, etc.)
export enum EmployeeDocumentType {
    Degree = 'Degree',
    Certificate = 'Certificate',
    Qualification = 'Qualification',
    License = 'License',
    Other = 'Other',
}

export interface EmployeeDocument {
    id: string;
    employee_id: string;
    document_type: EmployeeDocumentType;
    title: string;
    issuing_institution?: string;
    issue_date?: string;
    expiry_date?: string;
    file_path: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    uploaded_at: string;
    uploaded_by?: string;
}

// Employee Warnings (Disciplinary Records)
export enum WarningType {
    Verbal = 'Verbal',
    Written = 'Written',
    Final = 'Final',
}

export enum WarningSeverity {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export enum WarningStatus {
    Active = 'Active',
    Resolved = 'Resolved',
    Dismissed = 'Dismissed',
}

export interface EmployeeWarning {
    id: string;
    employee_id: string;
    warning_type: WarningType;
    severity: WarningSeverity;
    issue_date: string;
    reason: string;
    action_taken?: string;
    issued_by: string;
    issued_by_name?: string; // Populated from join
    document_path?: string;
    status: WarningStatus;
    created_at: string;
    updated_at: string;
}

export enum LeaveType {
    Annual = 'Annual Leave',
    Sick = 'Sick Leave',
    Maternity = 'Maternity Leave',
    Unpaid = 'Unpaid Leave',
}

export enum LeaveStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeAvatar: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
    document?: {
        name: string;
        content: string; // base64 encoded content with mime type
    };
}

export enum DocumentWorkflow {
    Pending = 'Pending',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Archived = 'Archived',
}

export enum DocumentType {
    Contract = 'Contract',
    Policy = 'Policy',
    Report = 'Report',
    Memo = 'Memo',
}

export enum VehicleStatus {
    Available = 'Available',
    InUse = 'In Use',
    Maintenance = 'Maintenance',
    OutOfService = 'Out of Service',
}

export interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    registration: string;
    insuranceExpiry: string;
    status: VehicleStatus;
    assignedTo?: string; // employeeId
    lastMaintenance?: string;
    nextMaintenance?: string;
    avatarUrl?: string;
}

export interface VehicleLog {
    id: string;
    vehicleId: string;
    driverId: string;
    startDate: string;
    endDate: string;
    startMileage: number;
    endMileage: number;
    purpose: string;
    type?: 'Maintenance' | 'Repair' | 'Inspection' | 'Fuel';
    description?: string;
    cost?: number;
    performedBy?: string;
}

export enum VacancyStatus {
    Open = 'Open',
    Closed = 'Closed',
    OnHold = 'On Hold',
}

export interface Vacancy {
    id: string;
    title: string;
    department: string;
    status: VacancyStatus;
    postedDate: string;
    hiringManagerId: string; // employeeId
    description: string;
    location: string;
    employmentType: 'Full-time' | 'Part-time' | 'Contract';
}

export enum CandidateStage {
    Sourced = 'Sourced',
    Screening = 'Screening',
    Interview = 'Interview',
    Offer = 'Offer',
    Hired = 'Hired',
    Rejected = 'Rejected',
}

export interface Candidate {
    id: string;
    vacancyId: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    stage: CandidateStage;
    appliedDate: string;
    resumeUrl?: string; // Link to resume
    notes?: string;
}


export enum Page {
    Dashboard = 'Dashboard',
    Operations = 'Operations',
    VehicleManagement = 'Vehicle Management',
    Recruitment = 'Recruitment',
    SalesAndMarketing = 'Sales & Marketing',
    Finance = 'Finance',

    // HR Management
    EmployeeManagement = 'Employee Management',
    LeaveManagement = 'Leave Management',
    AttendanceTracking = 'Attendance & Time Tracking',
    Payroll = 'Payroll',
    PerformanceManagement = 'Performance Management',
    TrainingDevelopment = 'Training & Development',
    DisciplinaryGrievance = 'Disciplinary & Grievance',
    HRReports = 'HR Reports',

    // User Management
    CreateUser = 'Create User',
    ManageUsers = 'Disable/Enable User',
    ResetPasswords = 'Reset Passwords',

    // Roles & Permissions
    CreateRoles = 'Create Roles',
    AssignPermissions = 'Assign Permissions',
    RoleAccessMatrix = 'Role Access Matrix',

    // Departments & Units
    ManageDepartments = 'Add/Edit Department',
    AssignStaffToDepts = 'Assign Staff to Departments',

    // System Configuration
    GeneralSettings = 'General Settings',
    NotificationSettings = 'Notification Settings',
    DataBackupRestore = 'Data Backup & Restore',

    // Audit & Logs
    SystemActivityLogs = 'System Activity Logs',
    LoginHistory = 'Login History',
    FileRequestMovementLogs = 'File/Request Movement Logs',

    // Approval Workflows
    DefineApprovalChains = 'Define Approval Chains',
    ManageApprovers = 'Manage Approvers',

    // Document Management
    ConfigureDocumentTypes = 'Configure Document Types',
    ManageTemplateVersions = 'Manage Template Versions',

    // Reports & Settings
    Reports = 'Reports',
    Settings = 'Settings',
    OrgChart = 'Organization Chart',
    AuditLogs = 'Audit Logs',
}

// Operations - Driver Schedules
export interface DriverSchedule {
    id: string;
    driverId: string;
    driverName: string;
    vehicleId: string;
    vehicleName: string;
    date: string;
    shift: 'Morning' | 'Afternoon' | 'Night';
    route: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

// Sales & Marketing - Leads
export enum LeadStatus {
    New = 'New',
    Contacted = 'Contacted',
    Qualified = 'Qualified',
    Proposal = 'Proposal',
    Negotiation = 'Negotiation',
    Won = 'Won',
    Lost = 'Lost',
}

export interface Lead {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: LeadStatus;
    value: number;
    source: string;
    assignedTo?: string;
    createdAt: string;
    notes?: string;
}

// Finance - Payroll
export interface PayrollRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    month: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: 'Draft' | 'Processed' | 'Paid';
    paymentDate?: string;
}

export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
}

// Reports
export enum ReportType {
    EmployeeReport = 'Employee Report',
    LeaveReport = 'Leave Report',
    PayrollReport = 'Payroll Report',
    VehicleReport = 'Vehicle Report',
    SalesReport = 'Sales Report',
}

export interface SystemUser {
    id: string;
    name: string;
    username: string;
    email: string;
    password?: string;
    role: string; // Changed from SystemRole to string to allow custom roles
    department: Department;
    reportsTo?: string; // ID of manager/supervisor
    status: 'Active' | 'Inactive';
    createdAt?: string;
    lastLogin?: string;
    avatarUrl?: string;
    permissions?: Permission[];
}