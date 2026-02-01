import api from "../api";
import { User } from "../../types";
import { API_ENDPOINTS } from "../../constants/app";

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    expiresIn?: number;
}

export interface VerifyEmailResponse {
    message: string;
}

export interface ResendVerificationResponse {
    message: string;
}

export const authService = {
    /**
     * Regular user login
     */
    login: async (credentials: {
        email: string;
        password: string;
    }): Promise<LoginResponse> => {
        const { data } = await api.post(API_ENDPOINTS.LOGIN, credentials);
        return data;
    },

    /**
     * HUST user login
     */
    loginHust: async (credentials: {
        email: string;
        password: string;
    }): Promise<LoginResponse> => {
        const { data } = await api.post(API_ENDPOINTS.LOGIN_HUST, credentials);
        return data;
    },

    /**
     * User registration
     */
    register: async (userData: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<LoginResponse> => {
        const { data } = await api.post(API_ENDPOINTS.REGISTER, userData);
        return data;
    },

    /**
     * Verify email with 6-digit code
     */
    verifyEmail: async (data: {
        email: string;
        code: string;
    }): Promise<VerifyEmailResponse> => {
        const { data: response } = await api.post(
            API_ENDPOINTS.VERIFY_EMAIL,
            data,
        );
        return response;
    },

    /**
     * Resend verification code
     */
    resendVerification: async (
        email: string,
    ): Promise<ResendVerificationResponse> => {
        const { data } = await api.post(API_ENDPOINTS.RESEND_VERIFICATION, {
            email,
        });
        return data;
    },

    /**
     * Request password reset code
     */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const { data } = await api.post("/api/users/forgot-password", {
            email,
        });
        return data;
    },

    /**
     * Reset password with code
     */
    resetPassword: async (payload: {
        email: string;
        code: string;
        newPassword: string;
    }): Promise<{ message: string }> => {
        const { data } = await api.post("/api/users/reset-password", payload);
        return data;
    },
};
