// Signing Error Codes (from backend V2)
export const SigningErrorCode = {
  // Session Errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_COMPLETED: 'SESSION_COMPLETED',
  SESSION_DEVICE_MISMATCH: 'SESSION_DEVICE_MISMATCH',
  
  // Lock Errors
  DOCUMENT_LOCKED: 'DOCUMENT_LOCKED',
  SIGNING_IN_PROGRESS: 'SIGNING_IN_PROGRESS',
  
  // Document Errors
  DOCUMENT_NOT_READY: 'DOCUMENT_NOT_READY',
  DOCUMENT_ALREADY_COMPLETED: 'DOCUMENT_ALREADY_COMPLETED',
  DOCUMENT_CANCELLED: 'DOCUMENT_CANCELLED',
  DOCUMENT_ALREADY_SIGNED: 'DOCUMENT_ALREADY_SIGNED',
  
  // Rate Limiting
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  
  // Validation Errors
  INVALID_STATUS: 'INVALID_STATUS',
} as const;

export type SigningErrorCodeType = typeof SigningErrorCode[keyof typeof SigningErrorCode];

// Error Messages
export const SigningErrorMessage: Record<SigningErrorCodeType, string> = {
  SESSION_NOT_FOUND: 'Session not found or expired',
  SESSION_EXPIRED: 'Session expired. Please create a new signing session.',
  SESSION_COMPLETED: 'Session already completed',
  SESSION_DEVICE_MISMATCH: 'Device verification failed. This session was created on a different device.',
  
  DOCUMENT_LOCKED: 'Document is currently being signed by another device',
  SIGNING_IN_PROGRESS: 'Another signing request is in progress. Please wait.',
  
  DOCUMENT_NOT_READY: 'Document is not ready for signing',
  DOCUMENT_ALREADY_COMPLETED: 'Document is already completed',
  DOCUMENT_CANCELLED: 'Document has been cancelled',
  DOCUMENT_ALREADY_SIGNED: 'Document already signed',
  
  TOO_MANY_ATTEMPTS: 'Too many signing attempts. Please create a new session.',
  
  INVALID_STATUS: 'Cannot sign: invalid document status',
};
