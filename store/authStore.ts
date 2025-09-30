
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('rsign_token', token);
    localStorage.setItem('rsign_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('rsign_token');
    localStorage.removeItem('rsign_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  init: () => {
    try {
      const token = localStorage.getItem('rsign_token');
      const userString = localStorage.getItem('rsign_user');
      if (token && userString) {
        const user = JSON.parse(userString);
        set({ user, token, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Failed to initialize auth state from localStorage", error);
      get().logout();
    }
  },
}));
