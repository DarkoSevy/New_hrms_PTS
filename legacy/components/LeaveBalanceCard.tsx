import React, { useEffect, useState } from 'react';
import { leaveEntitlementsAPI } from '../services/api';

interface LeaveBalance {
    total: number;
    used: number;
    remaining: number;
}

interface LeaveBalanceCardProps {
    employeeId: string;
    onBalanceLoad?: (balance: any) => void;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ employeeId, onBalanceLoad }) => {
    const [balance, setBalance] = useState<{ [key: string]: LeaveBalance } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                setLoading(true);
                const response = await leaveEntitlementsAPI.getBalance(employeeId);
                setBalance(response.data);
                if (onBalanceLoad) {
                    onBalanceLoad(response.data);
                }
                setError(null);
            } catch (err: any) {
                if (err.response?.status === 404) {
                    // No entitlements found, initialize them
                    try {
                        await leaveEntitlementsAPI.initialize(employeeId);
                        const response = await leaveEntitlementsAPI.getBalance(employeeId);
                        setBalance(response.data);
                        if (onBalanceLoad) {
                            onBalanceLoad(response.data);
                        }
                        setError(null);
                    } catch (initErr: any) {
                        setError('Failed to initialize leave entitlements');
                        console.error('Error initializing entitlements:', initErr);
                    }
                } else {
                    setError('Failed to fetch leave balance');
                    console.error('Error fetching balance:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchBalance();
        }
    }, [employeeId]);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 mb-4">
                <p className="text-gray-600 text-center">Loading leave balance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-600 text-center">{error}</p>
            </div>
        );
    }

    if (!balance) return null;

    const getProgressColor = (remaining: number, total: number) => {
        const percentage = (remaining / total) * 100;
        if (percentage > 50) return 'bg-green-500';
        if (percentage > 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 mb-4 border-l-4 border-cyan-600">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 Leave Balance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(balance).map(([leaveType, data]) => (
                    <div key={leaveType} className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{leaveType} Leave</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-cyan-600">{data.remaining}</span>
                            <span className="text-sm text-gray-500">/ {data.total} days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(data.remaining, data.total)}`}
                                style={{ width: `${(data.remaining / data.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">Used: {data.used} days</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveBalanceCard;
