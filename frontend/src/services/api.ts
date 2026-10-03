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

// Response interceptor for centralized error handling/logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[API Gateway Request Failed]:', error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
