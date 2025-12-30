import { SigningErrorCode, SigningErrorMessage } from '../constants/errorCodes';
import type { SigningErrorCodeType } from '../constants/errorCodes';

export interface SigningErrorResponse {
  success: false;
  error: SigningErrorCodeType;
  message: string;
  statusCode: number;
}

/**
 * Handle signing errors with structured error codes
 */
export const handleSigningError = (
  error: any,
  callbacks: {
    onSessionExpired?: () => void;
    onSessionNotFound?: () => void;
    onDeviceMismatch?: () => void;
    onDocumentLocked?: () => void;
    onSigningInProgress?: () => void;
    onTooManyAttempts?: () => void;
    onDefault?: (message: string) => void;
  }
): void => {
  const errorData: SigningErrorResponse | undefined = error.response?.data;

  if (!errorData || !errorData.error) {
    // Network error or unexpected error
    callbacks.onDefault?.(error.message || 'An unexpected error occurred');
    return;
  }

  const { error: errorCode, message } = errorData;

  switch (errorCode) {
    case SigningErrorCode.SESSION_EXPIRED:
      callbacks.onSessionExpired?.();
      break;

    case SigningErrorCode.SESSION_NOT_FOUND:
      callbacks.onSessionNotFound?.();
      break;

    case SigningErrorCode.SESSION_DEVICE_MISMATCH:
      callbacks.onDeviceMismatch?.();
      break;

    case SigningErrorCode.DOCUMENT_LOCKED:
      callbacks.onDocumentLocked?.();
      break;

    case SigningErrorCode.SIGNING_IN_PROGRESS:
      callbacks.onSigningInProgress?.();
      break;

    case SigningErrorCode.TOO_MANY_ATTEMPTS:
      callbacks.onTooManyAttempts?.();
      break;

    case SigningErrorCode.SESSION_COMPLETED:
    case SigningErrorCode.DOCUMENT_ALREADY_COMPLETED:
    case SigningErrorCode.DOCUMENT_ALREADY_SIGNED:
      callbacks.onDefault?.(message || 'Document already signed');
      break;

    case SigningErrorCode.DOCUMENT_NOT_READY:
    case SigningErrorCode.DOCUMENT_CANCELLED:
    case SigningErrorCode.INVALID_STATUS:
      callbacks.onDefault?.(message || SigningErrorMessage[errorCode]);
      break;

    default:
      callbacks.onDefault?.(message || 'An error occurred');
  }
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (errorCode: SigningErrorCodeType): string => {
  return SigningErrorMessage[errorCode] || 'An error occurred';
};
