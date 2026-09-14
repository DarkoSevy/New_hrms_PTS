import React, { useState, useEffect } from 'react';
import { EmployeeWarning, WarningType, WarningSeverity, WarningStatus } from '../types';
import { employeeWarningsAPI } from '../services/api';

interface WarningsTabProps {
    employeeId: string;
    currentUserId: string; // For issued_by field
}

const WarningsTab: React.FC<WarningsTabProps> = ({ employeeId, currentUserId }) => {
    const [warnings, setWarnings] = useState<EmployeeWarning[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        warning_type: WarningType.Verbal,
        severity: WarningSeverity.Low,
        issue_date: new Date().toISOString().split('T')[0],
        reason: '',
        action_taken: '',
    });

    useEffect(() => {
        loadWarnings();
    }, [employeeId]);

    const loadWarnings = async () => {
        try {
            const response = await employeeWarningsAPI.getAll(employeeId);
            setWarnings(response.data);
        } catch (error) {
            console.error('Failed to load warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const uploadFormData = new FormData();
        if (selectedFile) {
            uploadFormData.append('document', selectedFile);
        }
        uploadFormData.append('warning_type', formData.warning_type);
        uploadFormData.append('severity', formData.severity);
        uploadFormData.append('issue_date', formData.issue_date);
        uploadFormData.append('reason', formData.reason);
        uploadFormData.append('action_taken', formData.action_taken);
        uploadFormData.append('issued_by', currentUserId);

        try {
            await employeeWarningsAPI.create(employeeId, uploadFormData);
            setFormData({
                warning_type: WarningType.Verbal,
                severity: WarningSeverity.Low,
                issue_date: new Date().toISOString().split('T')[0],
                reason: '',
                action_taken: '',
            });
            setSelectedFile(null);
            setShowForm(false);
            loadWarnings();
        } catch (error) {
            console.error('Failed to create warning:', error);
            alert('Failed to create warning');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this warning?')) {
            try {
                await employeeWarningsAPI.delete(id);
                loadWarnings();
            } catch (error) {
                console.error('Failed to delete warning:', error);
            }
        }
    };

    const getSeverityColor = (severity: WarningSeverity) => {
        switch (severity) {
            case WarningSeverity.High:
                return 'bg-red-100 text-red-800';
            case WarningSeverity.Medium:
                return 'bg-orange-100 text-orange-800';
            case WarningSeverity.Low:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getTypeColor = (type: WarningType) => {
        switch (type) {
            case WarningType.Final:
                return 'bg-red-100 text-red-800';
            case WarningType.Written:
                return 'bg-orange-100 text-orange-800';
            case WarningType.Verbal:
                return 'bg-blue-100 text-blue-800';
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443]">Warnings & Disciplinary Records</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    {showForm ? 'Cancel' : 'Add Warning'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Warning Type
                            </label>
                            <select
                                value={formData.warning_type}
                                onChange={(e) => setFormData({ ...formData, warning_type: e.target.value as WarningType })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {Object.values(WarningType).map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Severity
                            </label>
                            <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value as WarningSeverity })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {Object.values(WarningSeverity).map((sev) => (
                                    <option key={sev} value={sev}>{sev}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supporting Document (Optional)
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Action Taken
                            </label>
                            <textarea
                                value={formData.action_taken}
                                onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                rows={2}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                    >
                        Create Warning
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {warnings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No warnings on record
                    </div>
                ) : (
                    warnings.map((warning) => (
                        <div key={warning.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(warning.warning_type)}`}>
                                            {warning.warning_type}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                                            {warning.severity} Severity
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(warning.issue_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 font-medium mb-2">{warning.reason}</p>
                                    {warning.action_taken && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Action Taken:</span> {warning.action_taken}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Issued by: {warning.issued_by_name || warning.issued_by}
                                    </p>
                                    {warning.document_path && (
                                        <p className="text-xs text-cyan-600 mt-1">📎 Document attached</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(warning.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WarningsTab;
