import axios from 'axios';

// 🔄 Detect environment automatically
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const BASE_URL = isProduction 
  ? 'https://feevert-api.onrender.com'  // Production backend
  : 'http://127.0.0.1:8000';            // Local development

// Base URL without /api/v1 - we'll add it in the request
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    // Add /api/v1 prefix to all requests except token endpoints
    if (!config.url.includes('/token/') && !config.url.includes('/auth/')) {
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

api.interceptors.request.use(
  (config) => {
    // Usiongeze prefix kama URL tayari ina /api
    if (!config.url.startsWith('/api')) {
      // Auth endpoints ziko chini ya /api
      if (config.url.startsWith('/auth/')) {
        config.url = `/api${config.url}`;
      } 
      // Token endpoints ziko chini ya /api
      else if (config.url.startsWith('/token/')) {
        config.url = `/api${config.url}`;
      }
      // Endpoints nyingine ziko chini ya /api/v1
      else {
        config.url = `/api/v1${config.url}`;
      }
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;