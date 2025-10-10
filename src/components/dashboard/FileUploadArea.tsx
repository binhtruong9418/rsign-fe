import React from 'react';
import { UploadCloud, File as FileIcon, X, Eye } from 'lucide-react';
import { formatBytes } from '../../utils/helpers';
import { ACCEPTED_FILE_TYPES } from '../../constants/app';

interface FileUploadAreaProps {
    file: File | null;
    dragActive: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onRemoveFile: () => void;
    onPreviewFile: () => void;
    onOpenFileDialog: () => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
    file,
    dragActive,
    fileInputRef,
    onFileChange,
    onDrag,
    onDrop,
    onRemoveFile,
    onPreviewFile,
    onOpenFileDialog,
}) => {
    if (file) {
        return (
            <div className="flex-grow border border-gray-600 rounded-lg p-4 flex flex-col justify-center text-center">
                <FileIcon className="h-16 w-16 text-brand-primary mx-auto mb-4" />
                <p className="font-semibold truncate" title={file.name}>{file.name}</p>
                <p className="text-sm text-dark-text-secondary">{formatBytes(file.size)}</p>
                <div className="mt-4 flex items-center justify-center space-x-4">
                    <button
                        type="button"
                        onClick={onPreviewFile}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                    >
                        <Eye size={16} />
                        <span>Preview</span>
                    </button>
                    <button
                        type="button"
                        onClick={onRemoveFile}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <X size={16} />
                        <span>Remove</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept={ACCEPTED_FILE_TYPES.join(',')}
            />
            <div
                onClick={onOpenFileDialog}
                onDrop={onDrop}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive
                        ? "border-brand-primary bg-gray-700"
                        : "border-gray-600 hover:border-brand-secondary bg-gray-800/50"
                    }`}
            >
                <UploadCloud size={40} className="text-dark-text-secondary mb-2" />
                <p className="text-dark-text-secondary text-center">
                    <span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PNG, JPG, etc.</p>
            </div>
        </div>
    );
};

export default FileUploadArea;