import { SystemRole, Department, Permission } from '../types';

// Role Hierarchy - defines reporting structure
export const roleHierarchy: Record<SystemRole, SystemRole | null> = {
    // Executive
    [SystemRole.Board]: null,
    [SystemRole.ManagingDirector]: SystemRole.Board,
    [SystemRole.DeputyManagingDirector]: SystemRole.ManagingDirector,

    // Support Staff
    [SystemRole.InternalAuditor]: SystemRole.ManagingDirector,
    [SystemRole.ProcurementOfficer]: SystemRole.ManagingDirector,
    [SystemRole.ITOfficer]: SystemRole.ManagingDirector,
    [SystemRole.PersonalAssistant]: SystemRole.ManagingDirector,
    [SystemRole.LegalAdvisor]: SystemRole.ManagingDirector,

    // Directors
    [SystemRole.DirectorOperations]: SystemRole.ManagingDirector,
    [SystemRole.DirectorAdminFinance]: SystemRole.ManagingDirector,
    [SystemRole.DirectorCommercial]: SystemRole.ManagingDirector,

    // Operations
    [SystemRole.FleetManager]: SystemRole.DirectorOperations,
    [SystemRole.InspectionComplianceOfficer]: SystemRole.FleetManager,
    [SystemRole.MaintenanceOfficer]: SystemRole.FleetManager,
    [SystemRole.GarageTechnician]: SystemRole.FleetManager,
    [SystemRole.FuelManagementOfficer]: SystemRole.FleetManager,
    [SystemRole.AssistantFleetManager]: SystemRole.FleetManager,

    // Admin & Finance
    [SystemRole.ChiefAccountant]: SystemRole.DirectorAdminFinance,
    [SystemRole.Accountant]: SystemRole.ChiefAccountant,
    [SystemRole.RecoveryOfficer]: SystemRole.ChiefAccountant,
    [SystemRole.BillingOfficer]: SystemRole.ChiefAccountant,
    [SystemRole.Cashier]: SystemRole.ChiefAccountant,
    [SystemRole.HRManager]: SystemRole.DirectorAdminFinance,
    [SystemRole.Receptionist]: SystemRole.HRManager,
    [SystemRole.OfficerCleaners]: SystemRole.HRManager,

    // Commercial
    [SystemRole.TourOperations]: SystemRole.DirectorCommercial,
    [SystemRole.SalesMarketingManager]: SystemRole.DirectorCommercial,
    [SystemRole.SalesOfficer]: SystemRole.TourOperations,
    [SystemRole.TourOperationsOfficer]: SystemRole.TourOperations,
    [SystemRole.SalesMarketingOfficer]: SystemRole.SalesMarketingManager,
    [SystemRole.SalesAssistant]: SystemRole.SalesMarketingManager,

    // Legacy
    [SystemRole.Administrator]: null,
    [SystemRole.Employee]: null,
};

// Role to Department mapping
export const roleToDepartment: Record<SystemRole, Department> = {
    // Executive
    [SystemRole.Board]: Department.Executive,
    [SystemRole.ManagingDirector]: Department.Executive,
    [SystemRole.DeputyManagingDirector]: Department.Executive,

    // Support
    [SystemRole.InternalAuditor]: Department.Support,
    [SystemRole.ProcurementOfficer]: Department.Support,
    [SystemRole.ITOfficer]: Department.Support,
    [SystemRole.PersonalAssistant]: Department.Support,
    [SystemRole.LegalAdvisor]: Department.Support,

    // Directors
    [SystemRole.DirectorOperations]: Department.Operations,
    [SystemRole.DirectorAdminFinance]: Department.AdminFinance,
    [SystemRole.DirectorCommercial]: Department.Commercial,

    // Operations
    [SystemRole.FleetManager]: Department.Operations,
    [SystemRole.InspectionComplianceOfficer]: Department.Operations,
    [SystemRole.MaintenanceOfficer]: Department.Operations,
    [SystemRole.GarageTechnician]: Department.Operations,
    [SystemRole.FuelManagementOfficer]: Department.Operations,
    [SystemRole.AssistantFleetManager]: Department.Operations,

    // Admin & Finance
    [SystemRole.ChiefAccountant]: Department.AdminFinance,
    [SystemRole.Accountant]: Department.AdminFinance,
    [SystemRole.RecoveryOfficer]: Department.AdminFinance,
    [SystemRole.BillingOfficer]: Department.AdminFinance,
    [SystemRole.Cashier]: Department.AdminFinance,
    [SystemRole.HRManager]: Department.AdminFinance,
    [SystemRole.Receptionist]: Department.AdminFinance,
    [SystemRole.OfficerCleaners]: Department.AdminFinance,

    // Commercial
    [SystemRole.TourOperations]: Department.Commercial,
    [SystemRole.SalesMarketingManager]: Department.Commercial,
    [SystemRole.SalesOfficer]: Department.Commercial,
    [SystemRole.TourOperationsOfficer]: Department.Commercial,
    [SystemRole.SalesMarketingOfficer]: Department.Commercial,
    [SystemRole.SalesAssistant]: Department.Commercial,

    // Legacy
    [SystemRole.Administrator]: Department.Executive,
    [SystemRole.Employee]: Department.Support,
};

// Role-based permissions
export const rolePermissions: Record<SystemRole, Permission[]> = {
    // Executive - Full access
    [SystemRole.Board]: Object.values(Permission),
    [SystemRole.ManagingDirector]: Object.values(Permission),
    [SystemRole.DeputyManagingDirector]: Object.values(Permission),

    // Support Staff
    [SystemRole.InternalAuditor]: [Permission.ViewAuditLogs, Permission.ViewAllEmployees, Permission.ViewFinancials],
    [SystemRole.ProcurementOfficer]: [Permission.ViewOperations],
    [SystemRole.ITOfficer]: [Permission.SystemSettings, Permission.ManageUsers],
    [SystemRole.PersonalAssistant]: [Permission.ViewAllEmployees],
    [SystemRole.LegalAdvisor]: [Permission.ViewAuditLogs, Permission.ViewAllEmployees],

    // Directors
    [SystemRole.DirectorOperations]: [Permission.ManageFleet, Permission.ManageSchedules, Permission.ViewOperations, Permission.ViewDepartmentEmployees, Permission.ApproveLeave],
    [SystemRole.DirectorAdminFinance]: [Permission.ManagePayroll, Permission.ViewFinancials, Permission.ProcessPayments, Permission.ViewDepartmentEmployees, Permission.ManageEmployees, Permission.ApproveLeave],
    [SystemRole.DirectorCommercial]: [Permission.ManageLeads, Permission.ViewSales, Permission.ManageTours, Permission.ViewDepartmentEmployees, Permission.ApproveLeave],

    // Operations
    [SystemRole.FleetManager]: [Permission.ManageFleet, Permission.ManageSchedules, Permission.ViewOperations],
    [SystemRole.InspectionComplianceOfficer]: [Permission.ViewOperations],
    [SystemRole.MaintenanceOfficer]: [Permission.ViewOperations],
    [SystemRole.GarageTechnician]: [Permission.ViewOperations],
    [SystemRole.FuelManagementOfficer]: [Permission.ViewOperations],
    [SystemRole.AssistantFleetManager]: [Permission.ViewOperations, Permission.ManageSchedules],

    // Admin & Finance
    [SystemRole.ChiefAccountant]: [Permission.ManagePayroll, Permission.ViewFinancials, Permission.ProcessPayments],
    [SystemRole.Accountant]: [Permission.ViewFinancials],
    [SystemRole.RecoveryOfficer]: [Permission.ViewFinancials],
    [SystemRole.BillingOfficer]: [Permission.ViewFinancials, Permission.ProcessPayments],
    [SystemRole.Cashier]: [Permission.ProcessPayments],
    [SystemRole.HRManager]: [Permission.ManageEmployees, Permission.ViewDepartmentEmployees, Permission.ApproveLeave, Permission.ManageVacancies, Permission.ViewCandidates],
    [SystemRole.Receptionist]: [],
    [SystemRole.OfficerCleaners]: [],

    // Commercial
    [SystemRole.TourOperations]: [Permission.ManageTours, Permission.ViewSales],
    [SystemRole.SalesMarketingManager]: [Permission.ManageLeads, Permission.ViewSales],
    [SystemRole.SalesOfficer]: [Permission.ViewSales],
    [SystemRole.TourOperationsOfficer]: [Permission.ManageTours],
    [SystemRole.SalesMarketingOfficer]: [Permission.ManageLeads, Permission.ViewSales],
    [SystemRole.SalesAssistant]: [Permission.ViewSales],

    // Legacy
    [SystemRole.Administrator]: Object.values(Permission),
    [SystemRole.Employee]: [],
};

// Helper functions
export const hasPermission = (role: SystemRole, permission: Permission): boolean => {
    return rolePermissions[role]?.includes(permission) || false;
};

export const getDepartmentForRole = (role: SystemRole): Department => {
    return roleToDepartment[role] || Department.Support;
};

export const getReportsTo = (role: SystemRole): SystemRole | null => {
    return roleHierarchy[role] || null;
};

export const isManager = (role: SystemRole): boolean => {
    const managerRoles = [
        SystemRole.ManagingDirector,
        SystemRole.DeputyManagingDirector,
        SystemRole.DirectorOperations,
        SystemRole.DirectorAdminFinance,
        SystemRole.DirectorCommercial,
        SystemRole.FleetManager,
        SystemRole.ChiefAccountant,
        SystemRole.HRManager,
        SystemRole.TourOperations,
        SystemRole.SalesMarketingManager,
    ];
    return managerRoles.includes(role);
};

export const getRolesByDepartment = (department: Department): SystemRole[] => {
    return Object.entries(roleToDepartment)
        .filter(([_, dept]) => dept === department)
        .map(([role, _]) => role as SystemRole);
};
