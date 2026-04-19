import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verifyEmail = async () => {
      try {
        await api.post('/auth/verify-email/', { token })
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.error || 'Email verification failed. The token may be invalid or expired.')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen flex items-center justify-center py-12 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          {status === 'loading' && (
            <>
              <div className="spinner mx-auto mb-6"></div>
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Verifying your email...
              </h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={`text-6xl mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓</div>
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Email Verified!
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {message}
              </p>
              <Link to="/login">
                <button className="glow-button w-full py-3">
                  Sign In
                </button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={`text-6xl mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>✗</div>
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Verification Failed
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {message}
              </p>
              <Link to="/login">
                <button className="glow-button w-full py-3">
                  Go to Login
                </button>
              </Link>
              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Need a new verification link?{' '}
                <Link to="/resend-verification" className={`hover:underline ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  Resend
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default VerifyEmailPage
