import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';
import type { ApiResponse, User } from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = original?.url?.includes('/auth/');
    if (error.response?.status !== 401 || original?._retry || isAuthRoute) {
      throw error;
    }
    original._retry = true;
    refreshPromise ??= axios
      .post<ApiResponse<{ accessToken: string; user: User }>>(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data.accessToken, data.data.user);
        return data.data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
    try {
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      useAuthStore.getState().clearSession();
      window.location.assign('/login');
      throw error;
    }
  },
);

export const messageFromError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return Array.isArray(message) ? message.join(', ') : message || 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
};
