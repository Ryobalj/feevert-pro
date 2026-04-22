import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { darkMode } = useTheme()

  const getRedirectPath = (user) => {
    // Kama user hana role kabisa, elekeza kwa /profile
    if (!user.role && !user.role_name) {
      console.warn('⚠️ User has no role, redirecting to /profile')
      return '/profile'
    }
    
    // Kulingana na role, elekeza kwenye dashboard sahihi
    const roleName = (user.role_name || user.role?.name || '').toLowerCase().trim()
    
    // Kama role ni tupu
    if (!roleName) {
      console.warn('⚠️ User has empty role, redirecting to /profile')
      return '/profile'
    }
    
    switch (roleName) {
      case 'admin':
        console.log('✅ Admin user, redirecting to /dashboard')
        return '/dashboard'
      case 'consultant':
        console.log('✅ Consultant user, redirecting to /dashboard')
        return '/dashboard'
      case 'normal employee':
        console.log('✅ Employee user, redirecting to /dashboard')
        return '/dashboard'
      case 'client':
        console.log('✅ Client user, redirecting to /dashboard')
        return '/dashboard'
      default:
        // Role haijulikani - elekeza kwa profile
        console.warn(`⚠️ Unknown role "${roleName}", redirecting to /profile`)
        return '/profile'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submit
    if (loading) return
    
    setLoading(true)
    setError('')
    
    console.log('📤 Sending login data:', { username: formData.username })
    
    try {
      const res = await api.post('/auth/login/', formData)
      
      console.log('✅ Login success:', {
        username: res.data.user?.username,
        role: res.data.user?.role_name || res.data.user?.role?.name || 'none'
      })
      
      // Hifadhi tokens
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      
      // Hifadhi user kwenye cache
      localStorage.setItem('cached_user', JSON.stringify(res.data.user))
      
      // Redirect kulingana na role
      const redirectPath = getRedirectPath(res.data.user)
      console.log(`🔄 Redirecting to: ${redirectPath}`)
      
      // Use setTimeout to ensure state updates complete
      setTimeout(() => {
        navigate(redirectPath)
        // Refresh page to reload auth state
        window.location.reload()
      }, 100)
      
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.response?.data?.error || 'Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen flex items-center justify-center py-12 px-4 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <div className="text-center mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Back
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Sign in to your account
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username or Email
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Enter your username or email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Remember me
                </span>
              </label>
              <Link to="/forgot-password" className={`text-sm hover:underline ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`glow-button w-full py-3 text-base ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={`text-center mt-6 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <Link to="/register" className={`font-medium hover:underline ${
              darkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default LoginPage