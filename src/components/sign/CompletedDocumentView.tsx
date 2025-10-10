import React from 'react';
import { Document } from '../../types';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompletedDocumentViewProps {
    document: Document;
}

const CompletedDocumentView: React.FC<CompletedDocumentViewProps> = ({ document }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2">Document Completed</h1>
            <p className="text-dark-text-secondary mb-6">This document has already been signed and no further action is required.</p>
            <Link to="/" className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors">
                Go to Homepage
            </Link>
        </div>
    );
};

export default CompletedDocumentView;