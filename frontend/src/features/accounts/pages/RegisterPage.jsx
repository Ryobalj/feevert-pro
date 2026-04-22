import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

// Common country codes
const COUNTRY_CODES = [
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
]

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', password: '', password_confirm: ''
  })
  const [countryCode, setCountryCode] = useState('+255') // Default to Tanzania
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { darkMode } = useTheme()

  // 📞 Format phone number with selected country code
  const formatPhoneNumber = (phone, code) => {
    if (!phone || phone.trim() === '') return ''
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Remove leading zero if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // Combine with country code
    return code + cleaned
  }

  // 🔒 Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Za-z]/.test(password)) {
      return 'Password must contain at least one letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validate passwords match
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match')
      return
    }
    
    // Validate password strength
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    
    setLoading(true)
    
    try {
      // Format phone with selected country code
      const formattedPhone = formData.phone 
        ? formatPhoneNumber(formData.phone, countryCode)
        : ''
      
      console.log('📤 Sending registration data:', {
        username: formData.username,
        email: formData.email,
        phone: formattedPhone || '(none)',
        country: countryCode
      })
      
      const response = await api.post('/auth/register/', {
        username: formData.username,
        email: formData.email,
        phone: formattedPhone,
        password: formData.password,
        password_confirm: formData.password_confirm
      })
      
      console.log('✅ Registration successful:', response.data)
      
      setSuccess('Account created successfully! Redirecting to login...')
      
      // Reset form
      setFormData({
        username: '', email: '', phone: '', password: '', password_confirm: ''
      })
      setCountryCode('+255')
      
      // Redirect after delay
      setTimeout(() => navigate('/login'), 2000)
      
    } catch (err) {
      console.error('❌ Registration error:', err)
      
      // Handle different error formats
      if (err.response?.data?.details) {
        const details = err.response.data.details
        const errorMessages = Object.entries(details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')
        setError(errorMessages)
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.data?.phone) {
        setError(`Phone number: ${err.response.data.phone}`)
      } else if (err.response?.data?.email) {
        setError(`Email: ${err.response.data.email}`)
      } else if (err.response?.data?.username) {
        setError(`Username: ${err.response.data.username}`)
      } else {
        setError('Registration failed. Please check your information and try again.')
      }
    } finally {
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
              Create Account
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Join FeeVert today
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

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm text-center"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username *
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
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Phone (optional)
              </label>
              
              {/* Country Code Selector + Phone Input */}
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={`w-28 px-2 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.code}
                    </option>
                  ))}
                </select>
                
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="712 345 678"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select your country code and enter your phone number
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength="8"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Create a password (min. 8 characters)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must contain at least one letter and one number
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.password_confirm}
                onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`glow-button w-full py-3 text-base ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className={`text-center mt-6 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Already have an account?{' '}
            <Link to="/login" className={`font-medium hover:underline ${
              darkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default RegisterPage