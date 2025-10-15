// User interfaces
export interface User {
    id: number;
    email: string;
    fullName?: string;
}

// Document interfaces
export interface Document {
    id: number;
    title: string;
    content?: string;
    createdAt: string;
    updatedAt: string;
    signature: Signature;
    signedAt: string | null;
    deadline: string | null;
    status: DocumentStatus;
    fileUrl?: string;
    competentAuthority: string;
}

// Signature interfaces
export interface Signature {
    id: string;
    signer: User;
    signatureData: {
        strokes: Stroke[];
        timestamp: string;
        expiresAt: string;
        documentHash: string;
        color: string;
        width: number;
    };
    createdAt: string;
}

export interface Point {
    x: number;
    y: number;
    timestamp: number;
}

export interface Stroke {
    id: string;
    points: Point[];
}

// Enums and types
export type DocumentStatus = "PENDING" | "COMPLETED" | "EXPIRED";

// Pagination interfaces
export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DocumentQueryParams {
    page?: number;
    limit?: number;
    status?: DocumentStatus | 'ALL';
    search?: string;
}

// API response interfaces
export interface LoginResponse {
    token: string;
    user: User;
}

export interface ApiError {
    message: string;
    status?: number;
}

// Form interfaces
export interface LoginFormData {
    email: string;
    password: string;
}

export interface CreateDocumentFormData {
    title: string;
    content: string;
    competentAuthority: string;
    file: File | null;
}

// Component prop interfaces
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface FileUploadProps {
    onFileSelected?: (file: File | null) => void;
    acceptedTypes?: string;
    maxSize?: number;
}
