import api from "../api";
import { Stroke } from "../../types";
import { API_ENDPOINTS } from "../../constants/app";

export const signatureService = {
    /**
     * Sign a document with signature strokes (legacy token-based)
     */
    signDocument: async (signatureData: {
        strokes: Stroke[];
        signingToken: string;
        width: number;
        color: string;
    }): Promise<void> => {
        await api.post(API_ENDPOINTS.SIGN_DOCUMENT, signatureData);
    },

    /**
     * Sign a document with signature strokes using session ID
     */
    signDocumentBySession: async (signatureData: {
        strokes: Stroke[];
        sessionId: string;
        width: number;
        color: string;
    }): Promise<void> => {
        await api.post(`${API_ENDPOINTS.SIGN_DOCUMENT_SESSION}/${signatureData.sessionId}`, {
            strokes: signatureData.strokes,
            width: signatureData.width,
            color: signatureData.color,
        });
    },
};
