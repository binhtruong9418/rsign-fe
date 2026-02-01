import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants/app";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            if (originalRequest.url?.includes(API_ENDPOINTS.REFRESH_TOKEN)) {
                useAuthStore.getState().logout();
                window.location.pathname = "/login";
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem(
                    STORAGE_KEYS.REFRESH_TOKEN,
                );

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || ""}${API_ENDPOINTS.REFRESH_TOKEN}`,
                    { refreshToken },
                );

                const { accessToken } = response.data;

                useAuthStore.getState().setToken(accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                onRefreshed(accessToken);

                isRefreshing = false;

                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];

                useAuthStore.getState().logout();
                window.location.pathname = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
