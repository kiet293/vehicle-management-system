import axios, { AxiosInstance } from 'axios';

// Base URL configured via environment variable (default: API Gateway at http://localhost:8080)
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach Authorization Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vms_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('vms_auth_token');
        localStorage.removeItem('vms_user');
        localStorage.setItem('vms_redirect_url', currentPath);
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
