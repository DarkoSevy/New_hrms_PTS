import React, { useState, useEffect } from 'react';
import { EmployeeDependent } from '../types';
import { dependentsAPI } from '../services/api';

interface DependentsTabProps {
    employeeId: string;
}

const DependentsTab: React.FC<DependentsTabProps> = ({ employeeId }) => {
    const [dependents, setDependents] = useState<EmployeeDependent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        birth_date: '',
        relationship_type: 'Child' as 'Spouse' | 'Child' | 'Other',
        insurance_enrolled: false,
        is_emergency_contact: false,
    });

    useEffect(() => {
        loadDependents();
    }, [employeeId]);

    const loadDependents = async () => {
        try {
            const response = await dependentsAPI.getAll(employeeId);
            setDependents(response.data);
        } catch (error) {
            console.error('Failed to load dependents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dependentsAPI.create(employeeId, formData);
            setFormData({
                full_name: '',
                birth_date: '',
                relationship_type: 'Child',
                insurance_enrolled: false,
                is_emergency_contact: false,
            });
            setShowForm(false);
            loadDependents();
        } catch (error) {
            console.error('Failed to add dependent:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this dependent?')) {
            try {
                await dependentsAPI.delete(id);
                loadDependents();
            } catch (error) {
                console.error('Failed to delete dependent:', error);
            }
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443]">Family & Dependents</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    {showForm ? 'Cancel' : 'Add Dependent'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Birth Date
                            </label>
                            <input
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Relationship
                            </label>
                            <select
                                value={formData.relationship_type}
                                onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="Spouse">Spouse</option>
                                <option value="Child">Child</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-6 pt-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.insurance_enrolled}
                                    onChange={(e) => setFormData({ ...formData, insurance_enrolled: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Insurance Enrolled</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_emergency_contact}
                                    onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Emergency Contact</span>
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
                    >
                        Add Dependent
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {dependents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No dependents registered
                    </div>
                ) : (
                    dependents.map((dependent) => (
                        <div key={dependent.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg text-[#0f3443]">{dependent.full_name}</h3>
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <p>
                                        <span className="font-medium">Relationship:</span> {dependent.relationship_type}
                                    </p>
                                    <p>
                                        <span className="font-medium">Birth Date:</span> {new Date(dependent.birth_date).toLocaleDateString()}
                                    </p>
                                    <div className="flex gap-4 mt-2">
                                        {dependent.insurance_enrolled && (
                                            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                Insured
                                            </span>
                                        )}
                                        {dependent.is_emergency_contact && (
                                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                Emergency Contact
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(dependent.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DependentsTab;
