import React, { useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useCreateDocument } from '../../hooks/useDocumentQueries';
import FileUploadArea from './FileUploadArea';
import DocumentViewer from '../DocumentViewer';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [competentAuthority, setCompetentAuthority] = useState('');
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const createDocumentMutation = useCreateDocument();

    const {
        file,
        previewUrl,
        dragActive,
        fileInputRef,
        handleDrag,
        handleDrop,
        handleFileChange,
        clearFile,
        openFileDialog,
    } = useFileUpload();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createDocumentMutation.mutate(
            { title, content, file, competentAuthority },
            {
                onSuccess: () => {
                    onClose();
                    setTitle('');
                    setContent('');
                    setCompetentAuthority('');
                    clearFile();
                },
                onError: (error: any) => {
                    alert('Failed to create document: ' + (error?.response?.data?.message || 'Unknown error'));
                }
            }
        );
    };

    const handleRemoveFile = () => {
        clearFile();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-dark-card p-8 rounded-lg shadow-xl w-full max-w-2xl m-4">
                    <h2 className="text-2xl font-bold mb-4">Create New Document</h2>
                    <form onSubmit={handleSubmit} id="create-doc-form" className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
                        {/* Left Column: Form Fields */}
                        <div className="flex flex-col space-y-4 md:w-1/2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-dark-text-secondary mb-1">Title *</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="competentAuthority" className="block text-sm font-medium text-dark-text-secondary mb-1">Competent Authority *</label>
                                <input
                                    id="competentAuthority"
                                    type="text"
                                    value={competentAuthority}
                                    onChange={(e) => setCompetentAuthority(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                            {!file && (
                                <div className="flex-grow flex flex-col">
                                    <label htmlFor="content" className="block text-sm font-medium text-dark-text-secondary mb-1">Content (or upload a file)</label>
                                    <textarea
                                        id="content"
                                        rows={10}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Column: File Upload & Preview */}
                        <div className="flex flex-col md:w-1/2 min-h-0">
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Document File</label>
                            <FileUploadArea
                                file={file}
                                dragActive={dragActive}
                                fileInputRef={fileInputRef}
                                onFileChange={handleFileChange}
                                onDrag={handleDrag}
                                onDrop={handleDrop}
                                onRemoveFile={handleRemoveFile}
                                onPreviewFile={() => setIsViewerOpen(true)}
                                onOpenFileDialog={openFileDialog}
                            />
                        </div>
                    </form>

                    <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-dark-text-secondary hover:bg-gray-600">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-doc-form"
                            disabled={createDocumentMutation.isPending}
                            className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50"
                        >
                            {createDocumentMutation.isPending ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                documentUri={previewUrl || ''}
                documentTitle={file?.name || 'Preview'}
            />
        </>
    );
};

export default CreateDocumentModal;