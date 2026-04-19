import { useState, useEffect, useCallback } from 'react'
import api from '../../../app/api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      setIsAuthenticated(false)
      setUser(null)
      return
    }

    try {
      const response = await api.get('/users/me/')
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post('/token/', { username, password })
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      await checkAuth()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      await api.post('/auth/register/', userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data || 'Registration failed' }
    }
  }

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return { user, loading, isAuthenticated, login, register, logout, checkAuth }
}
