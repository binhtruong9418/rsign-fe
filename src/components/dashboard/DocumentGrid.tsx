import React from 'react';
import { Link } from 'react-router-dom';
import { Document } from '../../types';
import { formatDate } from '../../utils/helpers';
import { FileText, Clock, CheckCircle } from 'lucide-react';

interface DocumentGridProps {
    documents: Document[];
}

const DocumentGrid: React.FC<DocumentGridProps> = ({ documents }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-accent-500/10 text-accent-600 border border-accent-200';
            case 'PENDING':
                return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 border border-red-200';
            default:
                return 'bg-secondary-100 text-secondary-700 border border-secondary-200';
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
                <Link
                    to={`/documents/${doc.id}`}
                    key={doc.id}
                    className="group block bg-white p-6 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                            <FileText size={24} />
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                        </span>
                    </div>

                    <h2 className="text-lg font-bold text-secondary-900 truncate mb-1 group-hover:text-primary-600 transition-colors">{doc.title}</h2>
                    
                    <div className="mt-4 space-y-2 text-sm text-secondary-500">
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider font-semibold text-secondary-400">Authority</span>
                            <span className="font-medium text-secondary-700 truncate">{doc.competentAuthority}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Updated {formatDate(doc.updatedAt)}</span>
                        </div>
                        {doc.signedAt && (
                            <div className="flex items-center gap-2 text-accent-600">
                                <CheckCircle size={14} />
                                <span>Signed {formatDate(doc.signedAt)}</span>
                            </div>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default DocumentGrid;