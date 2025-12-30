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

export interface SignaturePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
}

export interface InsertSignaturePayload {
    signatureId: number;
    position: SignaturePosition;
}

export interface InsertSignatureResponse {
    fileUrl: string;
    documentId: number;
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

// ============================================
// V2 Signing Types (Session-based workflow)
// ============================================

// Signing Session
export interface SigningSession {
    id: string;
    status: 'active' | 'completed' | 'expired';
    expiresAt: number;
    createdAt: number;
}

// Checkout Session Response
export interface CheckoutSessionResponse {
    sessionId: string;
    expiresIn: number;
    expiresAt: number;
}

// Signature Zone
export interface SignatureZone {
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

// Session Details Response
export interface SessionDetailsResponse {
    session: SigningSession;
    document: {
        id: string;
        title: string;
        originalFileUrl: string;
        signatureZone: SignatureZone;
        deadline?: string;
    };
    canSign: boolean;
    reason?: string;
}

// Multi-Signature Session Response
export interface MultiSignatureSessionResponse {
    sessionId: string;
    expiresIn: number;
    expiresAt: number;
    totalSignatures: number;
}

// Multi-Document Details Response (before creating session)
export interface MultiDocumentDetailsResponse {
    document: {
        id: string;
        title: string;
        originalFileUrl: string;
        deadline?: string;
        status: string;
        createdBy: {
            id: string;
            fullName: string;
            email: string;
        };
        createdAt: string;
    };
    signatureZones: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
        status: 'PENDING' | 'SIGNED' | 'DECLINED';
        stepOrder: number;
    }>;
    totalSignatures: number;
    canUseMultiSign: boolean;
    allSignaturesStatus: string;
}

// Multi-Signature Session Details
export interface MultiSessionDetailsResponse {
    session: {
        id: string;
        documentId: string;
        totalSignatures: number;
        completedSignatures: string[];
        status: 'active' | 'completed' | 'expired';
        expiresAt: number;
    };
    document: {
        id: string;
        title: string;
        originalFileUrl: string;
        deadline?: string;
    };
    pendingSignatures: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
    }>;
    canSign: boolean;
    reason?: string;
}

// Signature Data (V2)
export interface SignatureDataV2 {
    strokes: Stroke[];
    color: string;
    width: number;
}

// Submit Signature Request
export interface SubmitSignatureRequest {
    signatureData: SignatureDataV2;
    idempotencyKey: string;
}

// Submit Signature Response
export interface SubmitSignatureResponse {
    success: boolean;
    documentComplete: boolean;
    documentSigner?: {
        id: string;
        status: string;
        signedAt: string;
    };
    signedFileUrl?: string;
}

// Multi-Signature Submit Request
export interface MultiSignatureSubmitRequest {
    signatures: Array<{
        documentSignerId: string;
        signatureData: SignatureDataV2;
    }>;
    idempotencyKey: string;
}

// Multi-Signature Submit Response
export interface MultiSignatureSubmitResponse {
    success: boolean;
    documentComplete: boolean;
    completedSignatures: string[];
    pendingSignatures: string[];
    totalSignatures: number;
    signedFileUrl?: string;
    errors?: Array<{
        documentSignerId: string;
        error: string;
        message: string;
    }>;
}

// Pending Document (V2)
export interface PendingDocument {
    documentId: string;
    documentSignerId?: string;
    document: {
        id: string;
        title: string;
        originalFileUrl: string;
        createdBy?: string | {
            id: string;
            fullName: string;
            email: string;
        };
        deadline?: string;
        batchId?: string;
    };
    signers?: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
    }>;
    canUseMultiSign?: boolean;
    status: 'PENDING' | 'SIGNED' | 'DECLINED';
}

// Paginated Response (V2)
export interface PageDto<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Document Details (V2)
export interface DocumentDetailsV2 {
    id: string;
    document: {
        id: string;
        title: string;
        originalFileUrl: string;
        deadline?: string;
    };
    signatureZone: SignatureZone;
    status: 'PENDING' | 'SIGNED' | 'DECLINED';
}
