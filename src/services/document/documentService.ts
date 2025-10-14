import api from "../api";
import { Document, PaginatedResponse, DocumentQueryParams } from "../../types";
import { API_ENDPOINTS } from "../../constants/app";

export const documentService = {
    /**
     * Fetch document by signing token
     */
    getByToken: async (token: string): Promise<Document> => {
        const { data } = await api.get(
            `${API_ENDPOINTS.DOCUMENT_BY_TOKEN}/${token}`
        );
        return data;
    },

    /**
     * Fetch current user's documents with pagination and filtering
     */
    getMyDocuments: async (params: DocumentQueryParams = {}): Promise<PaginatedResponse<Document>> => {
        const { page = 0, limit = 10, status, search } = params;

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status && status !== 'ALL') {
            queryParams.append('status', status);
        }

        if (search && search.trim()) {
            queryParams.append('search', search.trim());
        }

        const { data } = await api.get(`${API_ENDPOINTS.MY_DOCUMENTS}?${queryParams.toString()}`);
        return data;
    },

    /**
     * Create a new document
     */
    create: async (documentData: {
        title: string;
        content: string;
        fileUrl: string;
        competentAuthority: string;
    }): Promise<Document> => {
        const { data } = await api.post(API_ENDPOINTS.DOCUMENTS, documentData);
        return data;
    },

    /**
     * Generate presigned URL for file upload
     */
    generatePresignedUrl: async (fileName: string, fileType: string) => {
        const { data } = await api.post(API_ENDPOINTS.GENERATE_PRESIGNED_URL, {
            fileName,
            fileType,
        });
        return data;
    },
};
