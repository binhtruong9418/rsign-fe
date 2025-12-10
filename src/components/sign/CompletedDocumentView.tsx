import React from 'react';
import { Document } from '../../types';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompletedDocumentViewProps {
    document: Document;
}

const CompletedDocumentView: React.FC<CompletedDocumentViewProps> = ({ document }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-green-50 p-6 rounded-full mb-6">
                <CheckCircle size={64} className="text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-3">Document Completed</h1>
            <p className="text-secondary-600 mb-8 max-w-md mx-auto">This document has already been signed and no further action is required.</p>
            <Link to="/" className="btn-primary px-8 py-3">
                Go to Homepage
            </Link>
        </div>
    );
};

export default CompletedDocumentView;