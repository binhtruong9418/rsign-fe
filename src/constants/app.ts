// Signature defaults
export const DEFAULT_SIGNATURE_COLOR = "#0000FF";
export const DEFAULT_SIGNATURE_WIDTH = 2;

// File upload constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_FILE_TYPES = [
    "image/*",
    "application/pdf",
    ".doc",
    ".docx",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Document status
export const DOCUMENT_STATUS = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    EXPIRED: "EXPIRED",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    TOKEN: "rsign_token",
    USER: "rsign_user",
    REDIRECT_AFTER_LOGIN: "redirectAfterLogin",
} as const;

// API endpoints
export const API_ENDPOINTS = {
    LOGIN: "/api/users/login",
    LOGIN_HUST: "/api/users/login-hust",
    REGISTER: "/api/users/register",
    MY_DOCUMENTS: "/api/documents/created/me",
    DOCUMENTS: "/api/documents",
    DOCUMENT_BY_TOKEN: "/api/documents/get-by-token",
    GENERATE_PRESIGNED_URL: "/api/documents/generate-presigned-url",
    SIGN_DOCUMENT: "/api/signatures/sign",
} as const;
