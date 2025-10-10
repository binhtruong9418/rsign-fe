import api from "../api";
import { User } from "../../types";
import { API_ENDPOINTS } from "../../constants/app";

export interface LoginResponse {
    token: string;
    user: User;
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
};
