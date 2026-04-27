import { createSlice } from '@reduxjs/toolkit'

// Safe JSON parse helper
const safeParse = (str) => {
  if (!str || str === 'null' || str === 'undefined') return null
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

const initialState = {
  user: safeParse(localStorage.getItem('cached_user')),
  token: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
  backendAvailable: true,
  authChecked: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ============ LOGIN ============
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user || null
      state.token = action.payload.access || null
      state.refreshToken = action.payload.refresh || null
      state.backendAvailable = true
      state.authChecked = true
      state.error = null
      
      // Persist to localStorage
      if (action.payload.access) localStorage.setItem('access_token', action.payload.access)
      if (action.payload.refresh) localStorage.setItem('refresh_token', action.payload.refresh)
      if (action.payload.user) localStorage.setItem('cached_user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload || 'Login failed'
      state.authChecked = true
    },

    // ============ LOGOUT ============
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.authChecked = true
      
      // Clear localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('cached_user')
    },

    // ============ USER ============
    setUser: (state, action) => {
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem('cached_user', JSON.stringify(action.payload))
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      if (state.user) {
        localStorage.setItem('cached_user', JSON.stringify(state.user))
      }
    },

    // ============ TOKEN ============
    setToken: (state, action) => {
      state.token = action.payload
      if (action.payload) {
        localStorage.setItem('access_token', action.payload)
      }
    },
    setRefreshToken: (state, action) => {
      state.refreshToken = action.payload
      if (action.payload) {
        localStorage.setItem('refresh_token', action.payload)
      }
    },

    // ============ AUTH CHECK ============
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload
    },
    
    // ============ BACKEND ============
    setBackendAvailable: (state, action) => {
      state.backendAvailable = action.payload
    },

    // ============ ERROR ============
    clearError: (state) => {
      state.error = null
    },

    // ============ RESET ============
    resetAuth: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.backendAvailable = true
      state.authChecked = false
    },
  }
})

// ============ SELECTORS ============
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectToken = (state) => state.auth.token
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectAuthChecked = (state) => state.auth.authChecked
export const selectBackendAvailable = (state) => state.auth.backendAvailable

// Role selectors
export const selectIsAdmin = (state) => {
  const user = state.auth.user
  return user?.role === 'admin' || user?.role_name === 'admin'
}
export const selectIsConsultant = (state) => {
  const user = state.auth.user
  return user?.role === 'consultant' || user?.role_name === 'consultant'
}
export const selectIsClient = (state) => {
  const user = state.auth.user
  return !user?.role || user?.role === 'client' || user?.role_name === 'client'
}

// ============ ACTIONS ============
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  setUser,
  updateUser,
  setToken,
  setRefreshToken,
  setAuthChecked,
  setBackendAvailable,
  clearError,
  resetAuth
} = authSlice.actions

export default authSlice.reducer