import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authService, LoginResponse } from "../services/auth/authService";
import { STORAGE_KEYS } from "../constants/app";

// Hook for regular login
export const useLogin = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    return useMutation<
        LoginResponse,
        Error,
        { email: string; password: string }
    >({
        mutationFn: authService.login,
        onSuccess: (data) => {
            login(data.user, data.token);
            const redirectAfterLogin = sessionStorage.getItem(
                STORAGE_KEYS.REDIRECT_AFTER_LOGIN
            );
            navigate(redirectAfterLogin || "/dashboard");
            sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
        },
    });
};

// Hook for HUST login
export const useHustLogin = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    return useMutation<
        LoginResponse,
        Error,
        { email: string; password: string }
    >({
        mutationFn: authService.loginHust,
        onSuccess: (data) => {
            login(data.user, data.token);
            const redirectAfterLogin = sessionStorage.getItem(
                STORAGE_KEYS.REDIRECT_AFTER_LOGIN
            );
            navigate(redirectAfterLogin || "/dashboard");
            sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
        },
    });
};
