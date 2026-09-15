import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    register: (data: any) => api.post('/auth/register', data),
    verify: () => api.get('/auth/verify'),
};

// Employees API
export const employeesAPI = {
    getAll: () => api.get('/employees'),
    getById: (id: string) => api.get(`/employees/${id}`),
    create: (data: any) => api.post('/employees', data),
    update: (id: string, data: any) => api.put(`/employees/${id}`, data),
    delete: (id: string) => api.delete(`/employees/${id}`),
};

// Leave Requests API
export const leavesAPI = {
    getAll: () => api.get('/leaves'),
    create: (data: any) => api.post('/leaves', data),
    update: (id: string, data: any) => api.put(`/leaves/${id}`, data),
    delete: (id: string) => api.delete(`/leaves/${id}`),
    approve: (id: string, approverId: string) => api.put(`/leaves/${id}/approve`, { approverId }),
    reject: (id: string, rejectedBy: string, reason?: string) => api.put(`/leaves/${id}/reject`, { rejectedBy, reason }),
};

// Leave Entitlements API
export const leaveEntitlementsAPI = {
    initialize: (employeeId: string, year?: number) => api.post('/leave-entitlements/initialize', { employeeId, year }),
    getEntitlements: (employeeId: string, year?: number) => api.get(`/leave-entitlements/${employeeId}`, { params: { year } }),
    getBalance: (employeeId: string, year?: number) => api.get(`/leave-entitlements/balance/${employeeId}`, { params: { year } }),
    updateEntitlement: (id: string, annual_days: number) => api.put(`/leave-entitlements/${id}`, { annual_days }),
    deduct: (employeeId: string, leaveType: string, days: number, year?: number) =>
        api.post('/leave-entitlements/deduct', { employeeId, leaveType, days, year }),
};

// Vehicles API
export const vehiclesAPI = {
    getAll: () => api.get('/vehicles'),
    create: (data: any) => api.post('/vehicles', data),
    update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
    delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Driver Schedules API
export const schedulesAPI = {
    getAll: () => api.get('/schedules'),
    create: (data: any) => api.post('/schedules', data),
    update: (id: string, data: any) => api.put(`/schedules/${id}`, data),
    delete: (id: string) => api.delete(`/schedules/${id}`),
};

// Leads API
export const leadsAPI = {
    getAll: () => api.get('/leads'),
    create: (data: any) => api.post('/leads', data),
    update: (id: string, data: any) => api.put(`/leads/${id}`, data),
    delete: (id: string) => api.delete(`/leads/${id}`),
};

// Payroll API
export const payrollAPI = {
    getAll: () => api.get('/payroll'),
    create: (data: any) => api.post('/payroll', data),
    update: (id: string, data: any) => api.put(`/payroll/${id}`, data),
    delete: (id: string) => api.delete(`/payroll/${id}`),
};

// Vacancies API
export const vacanciesAPI = {
    getAll: () => api.get('/vacancies'),
    create: (data: any) => api.post('/vacancies', data),
    update: (id: string, data: any) => api.put(`/vacancies/${id}`, data),
    delete: (id: string) => api.delete(`/vacancies/${id}`),
};

// Candidates API
export const candidatesAPI = {
    getAll: () => api.get('/candidates'),
    getByVacancy: (vacancyId: string) => api.get(`/candidates/vacancy/${vacancyId}`),
    create: (data: any) => api.post('/candidates', data),
    update: (id: string, data: any) => api.put(`/candidates/${id}`, data),
    delete: (id: string) => api.delete(`/candidates/${id}`),
};

// Employee Dependents API
export const dependentsAPI = {
    getAll: (employeeId: string) => api.get(`/employees/${employeeId}/dependents`),
    create: (employeeId: string, data: any) => api.post(`/employees/${employeeId}/dependents`, data),
    update: (id: string, data: any) => api.put(`/dependents/${id}`, data),
    delete: (id: string) => api.delete(`/dependents/${id}`),
};

// Employee Documents API
export const employeeDocumentsAPI = {
    getAll: (employeeId: string) => api.get(`/employees/${employeeId}/documents`),
    upload: (employeeId: string, formData: FormData) => api.post(`/employees/${employeeId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
    delete: (id: string) => api.delete(`/documents/${id}`),
};

// Employee Warnings API
export const employeeWarningsAPI = {
    getAll: (employeeId: string) => api.get(`/employees/${employeeId}/warnings`),
    create: (employeeId: string, formData: FormData) => api.post(`/employees/${employeeId}/warnings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id: string, data: any) => api.put(`/warnings/${id}`, data),
    delete: (id: string) => api.delete(`/warnings/${id}`),
    downloadDocument: (id: string) => api.get(`/warnings/${id}/document`, { responseType: 'blob' }),
};

// Audit Logs API
export const auditAPI = {
    getLogs: (params?: {
        action?: string;
        entity_type?: string;
        user_id?: string;
        search?: string;
        from?: string;
        to?: string;
        severity?: string;
        limit?: number;
        offset?: number;
    }) => api.get('/audit', { params }),
    getStats: () => api.get('/audit/stats'),
    getByEntity: (entityType: string, entityId: string) =>
        api.get(`/audit/entity/${entityType}/${entityId}`),
    getByUser: (userId: string) => api.get(`/audit/user/${userId}`),
};

export default api;
