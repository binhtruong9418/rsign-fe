import { create } from "zustand";
import { User } from "../types";
import { STORAGE_KEYS } from "../constants/app";

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string, refreshToken: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    login: (user, token, refreshToken) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user, token, refreshToken, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },
    setUser: (user) => {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user });
    },
    setToken: (token) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        set({ token });
    },
    init: () => {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            const userString = localStorage.getItem(STORAGE_KEYS.USER);
            if (token && refreshToken && userString) {
                const user = JSON.parse(userString);
                set({ user, token, refreshToken, isAuthenticated: true });
            }
        } catch (error) {
            console.error(
                "Failed to initialize auth state from localStorage",
                error,
            );
            get().logout();
        }
    },
}));
