import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    amount: '', currency: 'TZS', customer_name: '', customer_email: '', customer_phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState(null)
  const [error, setError] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const amount = params.get('amount')
    const bookingId = params.get('booking')
    const consultationId = params.get('consultation')
    
    if (amount) setFormData(prev => ({ ...prev, amount }))
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await api.post('/payments/initiate/', formData)
      if (res.data.payment_link) {
        setPaymentLink(res.data.payment_link)
        window.open(res.data.payment_link, '_blank')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (paymentLink) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen flex items-center justify-center py-12 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="max-w-md w-full">
          <div className={`modern-card p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
            <div className={`text-5xl mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓</div>
            <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Initiated
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Payment window has been opened. Complete your payment to confirm your booking.
            </p>
            <button
              onClick={() => setPaymentLink(null)}
              className="glow-button w-full py-3"
            >
              Done
            </button>
            <button
              onClick={() => window.open(paymentLink, '_blank')}
              className={`w-full mt-3 py-3 rounded-lg font-medium border ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Open Payment Window Again
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Make a <span className="gradient-text">Payment</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Secure payment via PawaPay
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`modern-card p-6 md:p-8 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount (TZS) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
                min="1"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email *
              </label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Your email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="e.g., 255712345678"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`glow-button w-full py-3 text-base ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PaymentPage
