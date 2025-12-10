import React, { useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useCreateDocument } from '../../hooks/useDocumentQueries';
import FileUploadArea from './FileUploadArea';
import DocumentViewer from '../DocumentViewer';
import { showToast } from '../../utils/toast';
import { useTranslation } from 'react-i18next';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [competentAuthority, setCompetentAuthority] = useState('');
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const { t } = useTranslation();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createDocumentMutation.mutateAsync({
                title,
                content,
                competentAuthority,
                file: file
            });

            // Reset form
            setTitle('');
            setContent('');
            setCompetentAuthority('');
            clearFile();
            onClose();
        } catch (error: any) {
            showToast.error(t('dashboard_components.create_modal.failed', { message: error?.response?.data?.message || 'Unknown error' }));
        }
    };

    const handleRemoveFile = () => {
        clearFile();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl m-4 border border-secondary-200">
                    <h2 className="text-2xl font-bold mb-6 text-secondary-900">{t('dashboard_components.create_modal.title')}</h2>
                    <form onSubmit={handleSubmit} id="create-doc-form" className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
                        {/* Left Column: Form Fields */}
                        <div className="flex flex-col space-y-4 md:w-1/2">
                            <div>
                                <label htmlFor="title" className="label-text">{t('dashboard_components.create_modal.title_label')}</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="input-field"
                                    placeholder={t('dashboard_components.create_modal.title_placeholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="competentAuthority" className="label-text">{t('dashboard_components.create_modal.authority_label')}</label>
                                <input
                                    id="competentAuthority"
                                    type="text"
                                    value={competentAuthority}
                                    onChange={(e) => setCompetentAuthority(e.target.value)}
                                    required
                                    className="input-field"
                                    placeholder={t('dashboard_components.create_modal.authority_placeholder')}
                                />
                            </div>
                            {!file && (
                                <div className="flex-grow flex flex-col">
                                    <label htmlFor="content" className="label-text">{t('dashboard_components.create_modal.content_label')}</label>
                                    <textarea
                                        id="content"
                                        rows={10}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="input-field flex-grow"
                                        placeholder={t('dashboard_components.create_modal.content_placeholder')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Column: File Upload & Preview */}
                        <div className="flex flex-col md:w-1/2 min-h-0">
                            <label className="label-text">{t('dashboard_components.create_modal.file_label')}</label>
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

                    <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-secondary-100">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            {t('dashboard_components.create_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            form="create-doc-form"
                            disabled={createDocumentMutation.isPending}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createDocumentMutation.isPending ? t('dashboard_components.create_modal.creating') : t('dashboard_components.create_modal.create')}
                        </button>
                    </div>
                </div>
            </div>

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                documentUri={previewUrl || ''}
                documentTitle={file?.name || t('dashboard_components.create_modal.preview_title')}
            />
        </>
    );
};

export default CreateDocumentModal;