import React, { useState, useEffect } from 'react';
import { EmployeeDocument, EmployeeDocumentType } from '../types';
import { employeeDocumentsAPI } from '../services/api';

interface DocumentsTabProps {
    employeeId: string;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ employeeId }) => {
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        document_type: EmployeeDocumentType.Degree,
        title: '',
        issuing_institution: '',
        issue_date: '',
        expiry_date: '',
    });

    useEffect(() => {
        loadDocuments();
    }, [employeeId]);

    const loadDocuments = async () => {
        try {
            const response = await employeeDocumentsAPI.getAll(employeeId);
            setDocuments(response.data);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a file');
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('document_type', formData.document_type);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('issuing_institution', formData.issuing_institution);
        uploadFormData.append('issue_date', formData.issue_date);
        uploadFormData.append('expiry_date', formData.expiry_date);

        try {
            await employeeDocumentsAPI.upload(employeeId, uploadFormData);
            setFormData({
                document_type: EmployeeDocumentType.Degree,
                title: '',
                issuing_institution: '',
                issue_date: '',
                expiry_date: '',
            });
            setSelectedFile(null);
            setShowForm(false);
            loadDocuments();
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document');
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const response = await employeeDocumentsAPI.download(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download document:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await employeeDocumentsAPI.delete(id);
                loadDocuments();
            } catch (error) {
                console.error('Failed to delete document:', error);
            }
        }
    };

    const getFileIcon = (mimeType?: string) => {
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('image')) return '🖼️';
        if (mimeType?.includes('word')) return '📝';
        return '📎';
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0f3443]">Employee Documents</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    {showForm ? 'Cancel' : 'Upload Document'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document Type
                            </label>
                            <select
                                value={formData.document_type}
                                onChange={(e) => setFormData({ ...formData, document_type: e.target.value as EmployeeDocumentType })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {Object.values(EmployeeDocumentType).map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issuing Institution
                            </label>
                            <input
                                type="text"
                                value={formData.issuing_institution}
                                onChange={(e) => setFormData({ ...formData, issuing_institution: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date (if applicable)
                            </label>
                            <input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
                    >
                        Upload Document
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                        No documents uploaded
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className="text-3xl">{getFileIcon(doc.mime_type)}</div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#0f3443]">{doc.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs mr-2">
                                                {doc.document_type}
                                            </span>
                                        </p>
                                        {doc.issuing_institution && (
                                            <p className="text-sm text-gray-600 mt-1">{doc.issuing_institution}</p>
                                        )}
                                        {doc.issue_date && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Issued: {new Date(doc.issue_date).toLocaleDateString()}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleDownload(doc.id, doc.file_name)}
                                        className="text-cyan-600 hover:text-cyan-800 text-sm"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentsTab;
