import api from './api';
import type {
  CheckoutSessionResponse,
  SessionDetailsResponse,
  SubmitSignatureRequest,
  SubmitSignatureResponse,
  PendingDocument,
  PageDto,
  DocumentDetailsV2,
} from '../types';

/**
 * V2 Signing API Service
 * Implements session-based signing workflow
 */
export const signingApi = {
  /**
   * Get pending documents for current user
   */
  getPendingDocuments: async (page = 0, limit = 10): Promise<PageDto<PendingDocument>> => {
    const response = await api.get('/api/documents/pending', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get document details for signing
   */
  getDocumentDetails: async (documentSignerId: string): Promise<DocumentDetailsV2> => {
    const response = await api.get(`/api/documents/${documentSignerId}/details`);
    return response.data;
  },

  /**
   * Create checkout session (device-locked, 30-minute TTL)
   */
  createCheckoutSession: async (documentSignerId: string): Promise<CheckoutSessionResponse> => {
    const response = await api.post(`/api/documents/${documentSignerId}/checkout`);
    return response.data;
  },

  /**
   * Get session details and validate device
   */
  getSession: async (sessionId: string): Promise<SessionDetailsResponse> => {
    const response = await api.get(`/api/documents/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Submit signature with idempotency
   */
  submitSignature: async (
    sessionId: string,
    data: SubmitSignatureRequest
  ): Promise<SubmitSignatureResponse> => {
    const response = await api.post(`/api/documents/sessions/${sessionId}/sign`, data);
    return response.data;
  },

  /**
   * Cancel active signing session
   */
  cancelSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/api/documents/sessions/${sessionId}/cancel`);
    return response.data;
  },

  /**
   * Decline document
   */
  declineDocument: async (
    documentSignerId: string,
    reason?: string
  ): Promise<{ success: boolean }> => {
    const response = await api.post(`/api/documents/${documentSignerId}/decline`, { reason });
    return response.data;
  },
};
