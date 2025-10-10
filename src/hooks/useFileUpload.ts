import { useState, useRef, useCallback } from "react";

interface UseFileUploadOptions {
    onFileSelected?: (file: File | null) => void;
    acceptedTypes?: string;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelected = useCallback(
        (selectedFile: File | null) => {
            if (selectedFile) {
                setFile(selectedFile);
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(URL.createObjectURL(selectedFile));
                options.onFileSelected?.(selectedFile);
            }
        },
        [options, previewUrl]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelected(e.dataTransfer.files[0]);
            }
        },
        [handleFileSelected]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
            }
        },
        [handleFileSelected]
    );

    const clearFile = useCallback(() => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        options.onFileSelected?.(null);
    }, [options, previewUrl]);

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        file,
        previewUrl,
        dragActive,
        fileInputRef,
        handleDrag,
        handleDrop,
        handleFileChange,
        clearFile,
        openFileDialog,
    };
};
