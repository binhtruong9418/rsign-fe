import React from 'react';
import { FileText } from 'lucide-react';

interface EmptyDocumentsViewProps {
    onCreateDocument: () => void;
}

const EmptyDocumentsView: React.FC<EmptyDocumentsViewProps> = ({ onCreateDocument }) => {
    return (
        <div className="text-center py-16 bg-dark-card rounded-lg">
            <FileText size={48} className="mx-auto text-dark-text-secondary" />
            <h3 className="mt-2 text-xl font-medium text-dark-text">No documents found</h3>
            <p className="mt-1 text-sm text-dark-text-secondary">Get started by creating a new document.</p>
        </div>
    );
};

export default EmptyDocumentsView;