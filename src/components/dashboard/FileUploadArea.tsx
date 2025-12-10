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
            <div className="flex-grow border border-secondary-300 rounded-lg p-6 flex flex-col justify-center text-center bg-secondary-50">
                <div className="bg-white p-4 rounded-full shadow-sm w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileIcon className="h-10 w-10 text-primary-600" />
                </div>
                <p className="font-semibold truncate text-secondary-900" title={file.name}>{file.name}</p>
                <p className="text-sm text-secondary-500 mb-6">{formatBytes(file.size)}</p>
                <div className="flex items-center justify-center space-x-4">
                    <button
                        type="button"
                        onClick={onPreviewFile}
                        className="btn-secondary flex items-center space-x-2 text-sm"
                    >
                        <Eye size={16} />
                        <span>Preview</span>
                    </button>
                    <button
                        type="button"
                        onClick={onRemoveFile}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors"
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
                className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${dragActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-secondary-300 hover:border-primary-400 bg-secondary-50 hover:bg-secondary-100"
                    }`}
            >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                    <UploadCloud size={24} className="text-primary-600" />
                </div>
                <p className="text-secondary-600 text-center mb-1">
                    <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-secondary-400">PDF, DOCX, PNG, JPG (Max 10MB)</p>
            </div>
        </div>
    );
};

export default FileUploadArea;