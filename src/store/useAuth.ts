import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'cashier';
  pharmacy_id?: number | null;
  pharmacy?: {
    id: number;
    name: string;
    ai_enabled: boolean;
    daily_ai_limit: number;
    daily_sales_limit: number | null;
  };
};

interface AuthState {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
  isSubscriptionExpired: boolean;
  setAuth: (user: User, token: string, remember?: boolean) => void;
  logout: () => void;
  setSubscriptionStatus: (expired: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      rememberMe: true,
      isSubscriptionExpired: false,
      setAuth: (user, token, remember = true) => {
        set({ user, token, rememberMe: remember });
        // Also sync with raw localStorage for axios if needed
        if (remember) {
          localStorage.setItem('token', token);
        } else {
          sessionStorage.setItem('token', token);
          localStorage.removeItem('token'); // Clear any old persistent token
        }
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('auth-storage'); // Clear persisted state
      },
      setSubscriptionStatus: (expired) => set({ isSubscriptionExpired: expired }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name): StorageValue<AuthState> | null => {
          const raw = localStorage.getItem(name) || sessionStorage.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw) as StorageValue<AuthState>;
          } catch {
            return null;
          }
        },
        setItem: (name, value: StorageValue<AuthState>) => {
          const serialized = JSON.stringify(value);
          try {
            if (value.state?.rememberMe) {
              localStorage.setItem(name, serialized);
              sessionStorage.removeItem(name);
            } else {
              sessionStorage.setItem(name, serialized);
              localStorage.removeItem(name);
            }
          } catch {
            localStorage.setItem(name, serialized);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
