import axios from 'axios';

// 🔄 Detect environment automatically
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const BASE_URL = isProduction 
  ? 'https://feevert-api.onrender.com'  // Production backend
  : 'http://127.0.0.1:8000';            // Local development

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ⚠️ INTERCEPTOR MOJA TU
api.interceptors.request.use(
  (config) => {
    if (config.url.includes('/token/')) {
      config.url = `/api${config.url}`;
    } else if (config.url.includes('/auth/')) {
      config.url = `/api${config.url}`;
    } else if (config.url.includes('/payments/')) {
      config.url = `/api${config.url}`;
    } else if (!config.url.startsWith('/api/') && !config.url.startsWith('/webhooks/')) {
      config.url = `/api/v1${config.url}`;
    }
    
    const token = localStorage.getItem('access_token');
    if (token && !config.url.includes('/token/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;