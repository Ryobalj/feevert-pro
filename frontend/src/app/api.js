import axios from 'axios';

// 🔄 Detect environment automatically
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const BASE_URL = isProduction 
  ? 'https://feevert-api.onrender.com'  // Production backend
  : 'http://127.0.0.1:8000';            // Local development

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 seconds - kutosha kwa cold start ya Render
});

// ⚠️ INTERCEPTOR MOJA TU
api.interceptors.request.use(
  (config) => {
    // Ongeza timestamp kuepuka cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }
    
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

// Response Interceptor - Retry kwa timeout na cold start
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle timeout (ECONNABORTED) au 502/503/504 (cold start)
    const isTimeout = error.code === 'ECONNABORTED';
    const isServerError = error.response?.status >= 502 && error.response?.status <= 504;
    const shouldRetry = (isTimeout || isServerError) && !originalRequest._retryCount;
    
    if (shouldRetry) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Max 2 retries
      if (originalRequest._retryCount <= 2) {
        console.log(`⏳ Retrying request (${originalRequest._retryCount}/2)...`);
        // Subiri sekunde 2 kabla ya kujaribu tena
        await new Promise(resolve => setTimeout(resolve, 2000));
        return api(originalRequest);
      }
    }
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(
          `${BASE_URL}/api/token/refresh/`, 
          { refresh: refreshToken },
          { timeout: 30000 } // Timeout fupi kwa refresh
        );
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Usifanye redirect kama tayari uko kwenye login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - Backend may be sleeping or unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default api;