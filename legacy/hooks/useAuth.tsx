import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { SystemRole, Permission } from '../types';
import { hasPermission as checkPermission } from '../utils/roleHelpers';

interface User {
    id: string;
    email: string;
    name: string;
    role: SystemRole;
    department: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check for existing auth on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (email: string, password: string) => {
        // This would normally call the API
        // For now, using mock data
        const mockUser: User = {
            id: '1',
            email: email,
            name: 'Admin User',
            role: SystemRole.ManagingDirector,
            department: 'Executive'
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const hasPermissionCheck = (permission: Permission): boolean => {
        if (!user) return false;
        return checkPermission(user.role, permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        if (!user) return false;
        return permissions.some(permission => checkPermission(user.role, permission));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            hasPermission: hasPermissionCheck,
            hasAnyPermission,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
