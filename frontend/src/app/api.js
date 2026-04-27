// frontend/src/app/api.js

import axios from 'axios'

// 🔄 Smart Environment Detection
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1'

const BASE_URL = isLocalhost 
  ? 'http://127.0.0.1:8000'             // Local development
  : 'https://feevert-api.onrender.com'  // Production backend

console.log(`🌐 API Base URL: ${BASE_URL} (${isLocalhost ? 'Development' : 'Production'})`)

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: isLocalhost ? 30000 : 60000, // Longer timeout for production cold starts
})

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    // Smart URL building - USIONGEZE /api/v1 IKIWA TAYARI IPO
    if (config.url.includes('/token/')) {
      config.url = `/api${config.url}`
    } else if (config.url.includes('/auth/')) {
      config.url = `/api${config.url}`
    } else if (config.url.includes('/payments/')) {
      config.url = `/api${config.url}`
    } else if (!config.url.startsWith('/api/') && !config.url.startsWith('/webhooks/')) {
      config.url = `/api/v1${config.url}`
    }
    
    // Add token to headers
    const token = localStorage.getItem('access_token')
    if (token && !config.url.includes('/token/')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Cache busting kwa GET requests (development only)
    if (isLocalhost && config.method === 'get') {
      config.params = { ...config.params, _t: new Date().getTime() }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Retry kwa timeout/cold start (production only)
    if (!isLocalhost) {
      const isTimeout = error.code === 'ECONNABORTED'
      const isServerError = error.response?.status >= 502 && error.response?.status <= 504
      const shouldRetry = (isTimeout || isServerError) && !originalRequest._retryCount
      
      if (shouldRetry) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
        if (originalRequest._retryCount <= 2) {
          console.log(`⏳ Retrying request (${originalRequest._retryCount}/2)...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          return api(originalRequest)
        }
      }
    }
    
    // Token refresh kwa 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(
          `${BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken },
          { timeout: 30000 }
        )
        
        localStorage.setItem('access_token', response.data.access)
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('cached_user')
        
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    
    // Network error handling
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - Check if backend is running')
      if (isLocalhost) {
        console.info('💡 Local: Run "python manage.py runserver" in another terminal')
      } else {
        console.info('💡 Production: Backend may be sleeping (cold start). Waiting...')
      }
    }
    
    // Log other errors in development
    if (isLocalhost) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      })
    }
    
    return Promise.reject(error)
  }
)

export default api