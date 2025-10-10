import api from "../api";
import { Stroke } from "../../types";
import { API_ENDPOINTS } from "../../constants/app";

export const signatureService = {
    /**
     * Sign a document with signature strokes
     */
    signDocument: async (signatureData: {
        strokes: Stroke[];
        signingToken: string;
        width: number;
        color: string;
    }): Promise<void> => {
        await api.post(API_ENDPOINTS.SIGN_DOCUMENT, signatureData);
    },
};
