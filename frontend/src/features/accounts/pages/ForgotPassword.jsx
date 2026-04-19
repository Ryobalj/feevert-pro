import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { darkMode } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await api.post('/auth/forgot-password/', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
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
              Forgot Password
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Enter your email to receive a password reset link
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

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`text-5xl mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓</div>
              <h2 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Check Your Email
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login">
                <button className="glow-button w-full py-3">
                  Back to Login
                </button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`glow-button w-full py-3 text-base ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Remember your password?{' '}
            <Link to="/login" className={`font-medium hover:underline ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ForgotPassword
