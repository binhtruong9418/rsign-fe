import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, Stroke } from "../types";
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

// Hook for fetching user's documents
export const useMyDocuments = () => {
    return useQuery<Document[], Error>({
        queryKey: ["myDocuments"],
        queryFn: documentService.getMyDocuments,
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

// Hook for signing documents
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
