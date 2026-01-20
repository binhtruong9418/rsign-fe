import { create } from "zustand";
import { User } from "../types";
import { STORAGE_KEYS } from "../constants/app";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (user, token) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        set({ user: null, token: null, isAuthenticated: false });
    },
    setUser: (user) => {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        set({ user });
    },
    init: () => {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const userString = localStorage.getItem(STORAGE_KEYS.USER);
            if (token && userString) {
                const user = JSON.parse(userString);
                set({ user, token, isAuthenticated: true });
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
