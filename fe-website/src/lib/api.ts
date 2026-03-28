import axios from 'axios';
import { authStorage } from './authStorage';
import type { ApiEnvelope, AuthUser } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const session = authStorage.load();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      authStorage.clear();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const unwrap = <T>(payload: ApiEnvelope<T>) => {
  if (!payload.success) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload.data as T;
};

export const getApiMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as ApiEnvelope<unknown> | undefined)?.message ||
      error.message ||
      'Request failed.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed.';
};

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

export const normalizeUser = (input: Record<string, unknown>): AuthUser => ({
  id: toStringValue(input.id || input._id),
  email: toStringValue(input.email),
  fullName: toStringValue(input.fullName || input.name),
  avatarUrl: toStringValue(input.avatarUrl),
  role: (toStringValue(input.role).toUpperCase() || 'CUSTOMER') as AuthUser['role'],
  status: toStringValue(input.status).toUpperCase(),
});
