import React from 'react';
import { Document } from '../../types';
import DocumentContentViewer from '../DocumentContentViewer';

interface DocumentReviewViewProps {
    document: Document;
    onProceedToSign: () => void;
}

const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({ document, onProceedToSign }) => {
    return (
        <div className="flex flex-col h-full min-h-0">
            <h1 className="text-xl sm:text-2xl font-bold text-dark-text mb-4 truncate" title={document.title}>
                Review: {document.title}
            </h1>
            <div className="flex-grow overflow-y-auto min-h-0 border border-gray-700 rounded-md p-4 bg-gray-900/50">
                {document.fileUrl ? (
                    <DocumentContentViewer
                        documentUri={document.fileUrl}
                        documentTitle={document.title}
                        className="h-full"
                    />
                ) : (
                    <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-dark-text p-4">
                        <p>{document.content}</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                    onClick={onProceedToSign}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Proceed to Sign
                </button>
            </div>
        </div>
    );
};

export default DocumentReviewView;
