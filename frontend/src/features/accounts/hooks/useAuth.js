// src/features/accounts/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react'
import api from '../../../app/api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(true)

  // Check backend availability
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

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    
    // Hakuna token kabisa
    if (!token) {
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      setAuthChecked(true)
      return
    }

    // Angalia kama backend ipo
    const backendIsUp = await checkBackend()

    if (!backendIsUp) {
      // Backend haipo - tumia cached user kama ipo
      const cachedUser = localStorage.getItem('cached_user')
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser))
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

    // Backend ipo - thibitisha na database
    try {
      const response = await api.get('/users/me/')
      
      // Hifadhi user kwenye cache
      localStorage.setItem('cached_user', JSON.stringify(response.data))
      
      setUser(response.data)
      setIsAuthenticated(true)
      setBackendAvailable(true)
    } catch (error) {
      console.error('Auth check failed:', error)
      
      // Token si sahihi - futa kila kitu
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('cached_user')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
      setAuthChecked(true)
    }
  }, [checkBackend])

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      
      // Hifadhi tokens
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      // Hifadhi user kwenye cache
      if (response.data.user) {
        localStorage.setItem('cached_user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
      
      setBackendAvailable(true)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      
      // Angalia kama ni network error (backend haipo)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setBackendAvailable(false)
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your internet connection.' 
        }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData)
      
      // Kama registration inarudisha token, login automatically
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
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
      
      let errorMessage = 'Registration failed'
      if (error.response?.data) {
        const errors = error.response.data
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ')
        } else {
          errorMessage = errors.error || errors.detail || 'Registration failed'
        }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    
    // Jaribu kuita logout endpoint (ikiwa backend ipo)
    if (refreshToken && backendAvailable) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken }, { timeout: 3000 })
      } catch (error) {
        console.warn('Logout API call failed (backend may be down):', error)
      }
    }
    
    // Futa kila kitu - hata kama backend haipo
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('cached_user')
    setUser(null)
    setIsAuthenticated(false)
  }, [backendAvailable])

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) return false
    
    try {
      const response = await api.post('/token/refresh/', { refresh })
      localStorage.setItem('access_token', response.data.access)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Usifute token - inaweza kuwa backend haipo
      return false
    }
  }, [])

  // Check auth on mount na kila backend inapobadilika
  useEffect(() => {
    checkAuth()
    
    // Poll backend kila baada ya muda kuangalia kama imerudi
    const interval = setInterval(async () => {
      if (!backendAvailable) {
        const isUp = await checkBackend()
        if (isUp) {
          console.log('🟢 Backend is back online! Refreshing auth...')
          checkAuth()
        }
      }
    }, 10000) // Angalia kila sekunde 10
    
    return () => clearInterval(interval)
  }, [checkAuth, checkBackend, backendAvailable])

  return { 
    user, 
    loading, 
    isAuthenticated, 
    authChecked,
    backendAvailable,
    login, 
    register, 
    logout, 
    checkAuth,
    refreshToken
  }
}

export default useAuth