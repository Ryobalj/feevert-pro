import React, { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', password_confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { darkMode } = useTheme()

  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    if (!token) {
      setError('Invalid or missing reset token')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await api.post('/auth/reset-password/', {
        token,
        new_password: formData.password
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen flex items-center justify-center py-12 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="max-w-md w-full">
          <div className={`modern-card p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
            <div className={`text-6xl mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>✗</div>
            <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Invalid Reset Link
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              The password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <button className="glow-button w-full py-3">
                Request New Link
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen flex items-center justify-center py-12 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          <div className="text-center mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Reset Password
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Enter your new password
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

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`text-5xl mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓</div>
              <h2 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Password Reset Successful!
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your password has been changed. Redirecting to login...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength="8"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`glow-button w-full py-3 text-base ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Link to="/login" className={`font-medium hover:underline ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Back to Login
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ResetPassword
