import { STORAGE_KEYS } from "../constants/app";

/**
 * Token Storage Utility
 * Manages storage and retrieval of access token and refresh token
 */
export const TokenStorage = {
    /**
     * Get access token from localStorage
     */
    getAccessToken: (): string | null => {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    /**
     * Get refresh token from localStorage
     */
    getRefreshToken: (): string | null => {
        return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    },

    /**
     * Save both access token and refresh token
     */
    setTokens: (accessToken: string, refreshToken: string): void => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    },

    /**
     * Clear all tokens
     */
    clearTokens: (): void => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    },

    /**
     * Check if tokens exist
     */
    hasTokens: (): boolean => {
        return !!(
            TokenStorage.getAccessToken() && TokenStorage.getRefreshToken()
        );
    },
};
