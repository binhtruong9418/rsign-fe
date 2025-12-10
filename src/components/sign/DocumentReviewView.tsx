import React from 'react';
import { Document } from '../../types';
import DocumentContentViewer from '../DocumentContentViewer';

interface DocumentReviewViewProps {
    document: Document;
    onProceedToSign: () => void;
}

const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({ document, onProceedToSign }) => {
    return (
        <div className="flex flex-col h-full min-h-0 bg-white sm:bg-transparent">
            <div className="flex-shrink-0 px-4 py-3 border-b border-secondary-200 sm:border-0">
                <h1 className="text-lg sm:text-2xl font-bold text-secondary-900 truncate" title={document.title}>
                    Review: {document.title}
                </h1>
                <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                    Please review the document carefully before signing.
                </p>
            </div>
            
            <div className="flex-grow min-h-0 p-0 sm:p-4 bg-secondary-50">
                {document.fileUrl ? (
                    <DocumentContentViewer
                        documentUri={document.fileUrl}
                        documentTitle={document.title}
                        className="h-full w-full shadow-sm bg-white"
                    />
                ) : (
                    <div className="h-full w-full max-w-4xl mx-auto bg-white shadow-sm sm:shadow-md overflow-y-auto border border-secondary-200 rounded-lg">
                        <div className="prose prose-sm sm:prose-base max-w-none p-6 sm:p-8 font-body text-secondary-800 leading-relaxed">
                            <p>{document.content}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 p-4 sm:pt-4 border-t border-secondary-200 sm:border-t-0 bg-white sm:bg-transparent z-10">
                <button
                    onClick={onProceedToSign}
                    className="w-full btn-primary text-base sm:text-lg py-3 sm:py-3 shadow-lg sm:shadow-sm"
                >
                    Proceed to Sign
                </button>
            </div>
        </div>
    );
};

export default DocumentReviewView;
