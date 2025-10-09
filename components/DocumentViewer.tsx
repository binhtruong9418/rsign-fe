import React from 'react';
import DocViewer from '@cyntler/react-doc-viewer';
import { X } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-bold truncate pr-4" title={documentTitle}>{documentTitle}</h3>
                    <button onClick={onClose} className="text-dark-text-secondary hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow p-1 bg-gray-800 overflow-hidden">
                    <DocViewer
                        documents={[{ uri: documentUri, fileName: documentTitle }]}
                        config={{
                            header: {
                                disableHeader: false,
                                disableFileName: false,
                                retainURLParams: false,
                            },
                            pdfVerticalScrollByDefault: true,
                        }}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
