// src/features/accounts/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react'
import api from '../../../app/api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [authError, setAuthError] = useState(null)

  // ============ CHECK BACKEND ============
  const checkBackend = useCallback(async () => {
    try {
      await api.get('/site-settings/', { timeout: 5000 })
      setBackendAvailable(true)
      return true
    } catch (error) {
      console.warn('⚠️ Backend unavailable, using cached auth state')
      setBackendAvailable(false)
      return false
    }
  }, [])

  // ============ CHECK AUTH ============
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    
    // No token at all
    if (!token) {
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      setAuthChecked(true)
      return
    }

    // Check if backend is available
    const backendIsUp = await checkBackend()

    if (!backendIsUp) {
      // Backend down - use cached user if available
      const cachedUser = localStorage.getItem('cached_user')
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser)
          setUser(parsed)
          setIsAuthenticated(true)
          console.log('📦 Using cached user (backend unavailable)')
        } catch (e) {
          setUser(null)
          setIsAuthenticated(false)
        }
      }
      setLoading(false)
      setAuthChecked(true)
      return
    }

    // Backend up - verify token
    try {
      const response = await api.get('/users/me/')
      
      // Cache user data
      localStorage.setItem('cached_user', JSON.stringify(response.data))
      
      setUser(response.data)
      setIsAuthenticated(true)
      setBackendAvailable(true)
      setAuthError(null)
    } catch (error) {
      console.error('Auth check failed:', error)
      
      // Token invalid - clear everything
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('cached_user')
      setUser(null)
      setIsAuthenticated(false)
      
      if (error.response?.status === 401) {
        setAuthError('Session expired. Please login again.')
      }
    } finally {
      setLoading(false)
      setAuthChecked(true)
    }
  }, [checkBackend])

  // ============ LOGIN ============
  const login = async (username, password) => {
    if (!username?.trim() || !password?.trim()) {
      return { success: false, error: 'Please enter both username and password' }
    }

    try {
      const response = await api.post('/auth/login/', { username, password })
      
      // Save tokens
      localStorage.setItem('access_token', response.data.access)
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }
      
      // Save user to cache
      if (response.data.user) {
        localStorage.setItem('cached_user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
      
      setBackendAvailable(true)
      setAuthError(null)
      
      return { success: true, user: response.data.user }
    } catch (error) {
      console.error('Login error:', error)
      
      // Network error
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setBackendAvailable(false)
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your internet connection.' 
        }
      }
      
      // Server errors
      const status = error.response?.status
      if (status === 401) {
        return { success: false, error: 'Invalid username or password' }
      }
      if (status === 429) {
        return { success: false, error: 'Too many attempts. Please try again later.' }
      }
      if (status >= 500) {
        return { success: false, error: 'Server error. Please try again later.' }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.detail || 'Login failed. Please try again.' 
      }
    }
  }

  // ============ REGISTER ============
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData)
      
      // Auto-login if token returned
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access)
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh)
        }
        if (response.data.user) {
          localStorage.setItem('cached_user', JSON.stringify(response.data.user))
          setUser(response.data.user)
          setIsAuthenticated(true)
        }
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return { success: false, error: 'Network error. Please check your connection.' }
      }
      
      // Extract error messages
      let errorMessage = 'Registration failed. Please try again.'
      if (error.response?.data) {
        const errors = error.response.data
        if (typeof errors === 'string') {
          errorMessage = errors
        } else if (typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([field, msg]) => {
              const fieldName = field.replace(/_/g, ' ')
              const message = Array.isArray(msg) ? msg.join(', ') : msg
              return `${fieldName}: ${message}`
            })
            .join('; ')
          if (messages) errorMessage = messages
        }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // ============ LOGOUT ============
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    
    // Try calling logout endpoint
    if (refreshToken && backendAvailable) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken }, { timeout: 3000 })
      } catch (error) {
        console.warn('Logout API call failed (backend may be down):', error)
      }
    }
    
    // Clear all auth data
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('cached_user')
    
    setUser(null)
    setIsAuthenticated(false)
    setAuthError(null)
  }, [backendAvailable])

  // ============ REFRESH TOKEN ============
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) return false
    
    try {
      const response = await api.post('/token/refresh/', { refresh })
      localStorage.setItem('access_token', response.data.access)
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Don't clear tokens - backend might just be down
      return false
    }
  }, [])

  // ============ UPDATE USER ============
  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }))
    const cached = localStorage.getItem('cached_user')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        localStorage.setItem('cached_user', JSON.stringify({ ...parsed, ...userData }))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  // ============ CLEAR ERROR ============
  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  // ============ EFFECTS ============
  useEffect(() => {
    checkAuth()
    
    // Poll backend to check if it's back online
    const interval = setInterval(async () => {
      if (!backendAvailable) {
        const isUp = await checkBackend()
        if (isUp) {
          console.log('🟢 Backend is back online! Refreshing auth...')
          checkAuth()
        }
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [checkAuth, checkBackend, backendAvailable])

  return { 
    // State
    user, 
    loading, 
    isAuthenticated, 
    authChecked,
    backendAvailable,
    authError,
    
    // Actions
    login, 
    register, 
    logout, 
    checkAuth,
    refreshToken,
    updateUser,
    clearError,
    
    // Helpers
    isAdmin: user?.role === 'admin' || user?.role_name === 'admin',
    isConsultant: user?.role === 'consultant' || user?.role_name === 'consultant',
    isEmployee: user?.role === 'Normal Employee' || user?.role_name === 'Normal Employee',
    isClient: !user?.role || user?.role === 'client' || user?.role_name === 'client',
  }
}

export default useAuth