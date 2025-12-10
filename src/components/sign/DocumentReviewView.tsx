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
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 truncate" title={document.title}>
                Review: {document.title}
            </h1>
            <div className="flex-grow overflow-y-auto min-h-0 border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                {document.fileUrl ? (
                    <DocumentContentViewer
                        documentUri={document.fileUrl}
                        documentTitle={document.title}
                        className="h-full"
                    />
                ) : (
                    <div className="prose prose-sm max-w-none p-4">
                        <p>{document.content}</p>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-200">
                <button
                    onClick={onProceedToSign}
                    className="w-full btn-primary text-lg py-3"
                >
                    Proceed to Sign
                </button>
            </div>
        </div>
    );
};

export default DocumentReviewView;
