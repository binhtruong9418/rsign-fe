import React from 'react';
import { Link } from 'react-router-dom';
import { Document } from '../../types';
import { formatDate } from '../../utils/helpers';

interface DocumentGridProps {
    documents: Document[];
}

const DocumentGrid: React.FC<DocumentGridProps> = ({ documents }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
                <Link
                    to={`/documents/${doc.id}`}
                    key={doc.id}
                    className="block bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold text-brand-primary truncate pr-2">{doc.title}</h2>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                            }`}>
                            {doc.status}
                        </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-dark-text-secondary">
                        <p>Authority: <span className="font-medium text-dark-text">{doc.competentAuthority}</span></p>
                        <p>Last Activity: <span className="font-medium text-dark-text">{formatDate(doc.updatedAt)}</span></p>
                        {doc.signedAt && (
                            <p>Signed On: <span className="font-medium text-dark-text">{formatDate(doc.signedAt)}</span></p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default DocumentGrid;