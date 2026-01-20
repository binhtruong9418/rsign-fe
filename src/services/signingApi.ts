import api from "./api";
import type {
    CheckoutSessionResponse,
    SessionDetailsResponse,
    SubmitSignatureRequest,
    SubmitSignatureResponse,
    PendingDocument,
    PageDto,
    DocumentDetails,
    MultiSignatureSessionResponse,
    MultiDocumentDetailsResponse,
    MultiSessionDetailsResponse,
    MultiSignatureSubmitRequest,
    MultiSignatureSubmitResponse,
    PendingDocumentDetail,
    CompletedDocumentDetail,
    CompletedDocumentListItem,
} from "../types";

/**
 * Signing API Service
 * Implements session-based signing workflow
 */
export const signingApi = {
    /**
     * Get pending documents for current user
     * Returns list of documents where user hasn't completed their signatures yet
     */
    getPendingDocuments: async (
        page = 0,
        limit = 10,
        sortBy: "createdAt" | "deadline" | "title" = "createdAt",
        sortOrder: "ASC" | "DESC" = "DESC",
        title?: string,
        signingMode?: "INDIVIDUAL" | "SHARED",
    ): Promise<PageDto<PendingDocument>> => {
        const params: any = { page, limit, sortBy, sortOrder };
        if (title) params.title = title;
        if (signingMode) params.signingMode = signingMode;

        const response = await api.get("/api/documents/pending", { params });
        return response.data;
    },

    /**
     * Get document details for signing
     */
    getDocumentDetails: async (
        documentSignerId: string,
    ): Promise<DocumentDetails> => {
        const response = await api.get(
            `/api/documents/${documentSignerId}/details`,
        );
        return response.data;
    },

    /**
     * Create checkout session (device-locked, 30-minute TTL)
     */
    createCheckoutSession: async (
        documentSignerId: string,
    ): Promise<CheckoutSessionResponse> => {
        const response = await api.post(
            `/api/documents/${documentSignerId}/checkout`,
        );
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
        data: SubmitSignatureRequest,
    ): Promise<SubmitSignatureResponse> => {
        const response = await api.post(
            `/api/documents/sessions/${sessionId}/sign`,
            data,
        );
        return response.data;
    },

    /**
     * Cancel active signing session
     */
    cancelSession: async (sessionId: string): Promise<{ success: boolean }> => {
        const response = await api.delete(
            `/api/documents/sessions/${sessionId}/cancel`,
        );
        return response.data;
    },

    /**
     * Decline document
     */
    declineDocument: async (
        documentSignerId: string,
        reason?: string,
    ): Promise<{ success: boolean }> => {
        const response = await api.post(
            `/api/documents/${documentSignerId}/decline`,
            { reason },
        );
        return response.data;
    },

    /**
     * Get multi-document details before creating session
     */
    getMultiDocumentDetails: async (
        documentId: string,
    ): Promise<MultiDocumentDetailsResponse> => {
        const response = await api.get(
            `/api/documents/multi/${documentId}/details`,
        );
        return response.data;
    },

    /**
     * Create multi-signature session for a document
     */
    createMultiCheckoutSession: async (
        documentId: string,
    ): Promise<MultiSignatureSessionResponse> => {
        const response = await api.post(
            `/api/documents/multi/${documentId}/checkout`,
        );
        return response.data;
    },

    /**
     * Get multi-signature session details
     */
    getMultiSession: async (
        sessionId: string,
    ): Promise<MultiSessionDetailsResponse> => {
        const response = await api.get(
            `/api/documents/multi-sessions/${sessionId}`,
        );
        return response.data;
    },

    /**
     * Submit multiple signatures in one session
     */
    submitMultiSignatures: async (
        sessionId: string,
        data: MultiSignatureSubmitRequest,
    ): Promise<MultiSignatureSubmitResponse> => {
        const response = await api.post(
            `/api/documents/multi-sessions/${sessionId}/sign`,
            data,
        );
        return response.data;
    },

    /**
     * Cancel multi-signature session and release all locks
     */
    cancelMultiSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/api/documents/multi-sessions/${sessionId}/cancel`);
    },

    /**
     * Get pending document detail (for signing preparation)
     */
    getPendingDocumentDetail: async (
        documentId: string,
    ): Promise<PendingDocumentDetail> => {
        const response = await api.get(`/api/documents/${documentId}/pending`);
        return response.data;
    },

    /**
     * Get completed document detail (for review)
     */
    getCompletedDocumentDetail: async (
        documentId: string,
    ): Promise<CompletedDocumentDetail> => {
        const response = await api.get(
            `/api/documents/${documentId}/completed`,
        );
        return response.data;
    },

    /**
     * Get list of completed documents for current user
     * Returns documents where user has completed their signatures
     */
    getCompletedDocuments: async (
        page = 0,
        limit = 10,
        sortBy: "createdAt" | "deadline" | "title" = "createdAt",
        sortOrder: "ASC" | "DESC" = "DESC",
        title?: string,
        signingMode?: "INDIVIDUAL" | "SHARED",
    ): Promise<PageDto<CompletedDocumentListItem>> => {
        const params: any = { page, limit, sortBy, sortOrder };
        if (title) params.title = title;
        if (signingMode) params.signingMode = signingMode;

        const response = await api.get("/api/documents/completed", { params });
        return response.data;
    },
};
