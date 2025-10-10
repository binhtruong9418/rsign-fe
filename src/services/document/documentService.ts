import api from "../api";
import { Document } from "../../types";
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
     * Fetch current user's documents
     */
    getMyDocuments: async (): Promise<Document[]> => {
        const { data } = await api.get(API_ENDPOINTS.MY_DOCUMENTS);
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
