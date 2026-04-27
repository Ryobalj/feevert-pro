import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../accounts/hooks/useAuth'
import api from '../../../app/api'

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { darkMode } = useTheme()
  
  const [formData, setFormData] = useState({
    amount: '', currency: 'TZS', customer_name: '', customer_email: '', customer_phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const state = location.state || {}
    const params = new URLSearchParams(location.search)
    
    setFormData(prev => ({
      ...prev,
      amount: state.amount || params.get('amount') || '',
      customer_name: state.customer_name || user?.full_name || user?.username || '',
      customer_email: state.customer_email || user?.email || '',
      customer_phone: state.customer_phone || user?.phone || '',
    }))
  }, [location, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.customer_phone) {
      setError('Phone number is required for payment')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/payments/initiate/', formData)
      
      if (res.data.success) {
        setPaymentResult(res.data)
        // Open payment link if available
        if (res.data.payment_link) {
          window.open(res.data.payment_link, '_blank')
        }
      } else {
        setError(res.data.error || 'Payment initiation failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============ SUCCESS STATE ============
  if (paymentResult) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-md w-full"
        >
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <motion.div 
              className="absolute -inset-6 bg-emerald-400/15 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>

          <h2 className="text-2xl font-extrabold text-white mb-2">Payment Initiated!</h2>
          <p className="text-white/50 text-sm mb-2">
            Check your phone for a payment prompt to complete the transaction.
          </p>

          {paymentResult.transaction_id && (
            <div className="glass rounded-2xl p-4 my-6">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Transaction ID</p>
              <p className="text-white font-bold font-mono">{paymentResult.transaction_id}</p>
            </div>
          )}

          <div className="space-y-3">
            {paymentResult.payment_link && (
              <button
                onClick={() => window.open(paymentResult.payment_link, '_blank')}
                className="btn-primary btn-lg w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Payment Window
              </button>
            )}
            <button
              onClick={() => navigate('/payment-history')}
              className="glass px-6 py-4 rounded-full text-white font-semibold w-full hover:border-emerald-400/30 transition-all"
            >
              View Payment History
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ============ FORM ============
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">💳 Secure Payment</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Make a <span className="gradient-text">Payment</span>
          </h1>
          <p className="text-white/50 text-sm">Secure payment via PawaPay</p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6 md:p-8">
          {/* Top accent */}
          <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6">
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Amount (TZS) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">💰</div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => { setFormData({...formData, amount: e.target.value}); setError('') }}
                  required
                  min="1"
                  className="w-full pl-11 pr-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => { setFormData({...formData, customer_name: e.target.value}); setError('') }}
                required
                className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
                placeholder="Your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => { setFormData({...formData, customer_email: e.target.value}); setError('') }}
                required
                className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
                placeholder="Your email"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">📱</div>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => { setFormData({...formData, customer_phone: e.target.value}); setError('') }}
                  required
                  className="w-full pl-11 pr-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
                  placeholder="e.g., +255 712 345 678"
                />
              </div>
              <p className="text-[10px] text-white/25 mt-1.5">You will receive a payment prompt on this number</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={loading ? {} : { x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Pay Now
                </span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PaymentPage