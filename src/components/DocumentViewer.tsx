import React from 'react';
import { X } from 'lucide-react';
import DocumentContentViewer from './DocumentContentViewer';

interface DocumentViewerProps {
    isOpen: boolean;
    onClose: () => void;
    documentUri: string;
    documentTitle: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, documentUri, documentTitle }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col border border-secondary-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-secondary-200 flex-shrink-0">
                    <h3 className="text-xl font-bold text-secondary-900 truncate pr-4" title={documentTitle}>{documentTitle}</h3>
                    <button onClick={onClose} className="text-secondary-500 hover:text-secondary-900 p-1 rounded-full hover:bg-secondary-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow overflow-hidden bg-secondary-50 p-4 rounded-b-xl">
                    <DocumentContentViewer
                        documentUri={documentUri}
                        documentTitle={documentTitle}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
