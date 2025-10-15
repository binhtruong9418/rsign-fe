import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, Stroke, PaginatedResponse, DocumentQueryParams } from "../types";
import { AxiosError } from "axios";
import { documentService } from "../services/document/documentService";
import { signatureService } from "../services/document/signatureService";
import { createDocumentWithFile } from "../services/document/fileUploadService";

// Hook for fetching document by token
export const useDocumentByToken = (token: string) => {
    return useQuery<Document, Error>({
        queryKey: ["documentByToken", token],
        queryFn: () => documentService.getByToken(token),
        enabled: !!token,
    });
};

// Hook for fetching document by session ID
export const useDocumentBySessionId = (sessionId: string) => {
    return useQuery<Document, Error>({
        queryKey: ["documentBySessionId", sessionId],
        queryFn: () => documentService.getBySessionId(sessionId),
        enabled: !!sessionId,
        retry: false,
    });
};

// Hook for fetching user's documents with pagination
export const useMyDocuments = (params: DocumentQueryParams = {}) => {
    return useQuery<PaginatedResponse<Document>, Error>({
        queryKey: ["myDocuments", params],
        queryFn: () => documentService.getMyDocuments(params),
    });
};

// Hook for creating documents
export const useCreateDocument = () => {
    const queryClient = useQueryClient();

    return useMutation<
        Document,
        Error,
        {
            title: string;
            content: string;
            competentAuthority: string;
            file: File | null;
        }
    >({
        mutationFn: createDocumentWithFile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myDocuments"] });
        },
    });
};

// Hook for signing documents (legacy token-based)
export const useSignDocument = () => {
    return useMutation<
        void,
        AxiosError<{ message: string }>,
        {
            strokes: Stroke[];
            signingToken: string;
            width: number;
            color: string;
        }
    >({
        mutationFn: signatureService.signDocument,
    });
};

// Hook for signing documents using session ID
export const useSignDocumentBySession = () => {
    return useMutation<
        void,
        AxiosError<{ message: string }>,
        {
            strokes: Stroke[];
            sessionId: string;
            width: number;
            color: string;
        }
    >({
        mutationFn: signatureService.signDocumentBySession,
    });
};
