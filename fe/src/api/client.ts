import axios, { AxiosError } from 'axios';
import { CONFIG } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // If we receive a 401, token might be expired. Log user out.
    if (error.response?.status === 401) {
      const logout = useAuthStore.getState().logout;
      await logout();
      // Optionally emit event or use navigation to force redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
