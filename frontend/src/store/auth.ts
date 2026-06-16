import { create } from 'zustand';
import type { User } from '../types';

type AuthState = {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user, hydrated: true }),
  clearSession: () => set({ accessToken: null, user: null, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
