import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'

const PaymentForm = ({ 
  amount, 
  currency = 'TZS', 
  itemType,      // 'consultation' or 'booking'
  itemId, 
  description, 
  buttonText = 'Pay Now',
  onSuccess 
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [transaction, setTransaction] = useState(null)

  const handlePayment = async () => {
    if (!phoneNumber) {
      setError('Phone number is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call backend initiate payment endpoint
      const res = await api.post('/payments/initiate/', {
        amount: amount,
        currency: currency,
        customer_name: user?.full_name || user?.username,
        customer_email: user?.email,
        customer_phone: phoneNumber,
        item_type: itemType || '',
        item_id: itemId || null,
      })

      if (res.data.success) {
        setTransaction(res.data)
        setSuccess(true)
        
        if (onSuccess) {
          setTimeout(() => onSuccess(res.data), 2000)
        } else {
          setTimeout(() => {
            navigate('/payment-history', { 
              state: { message: 'Payment initiated! Check your phone for payment prompt.' } 
            })
          }, 2500)
        }
      } else {
        setError(res.data.error || 'Payment initiation failed')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {success ? (
        /* ============ SUCCESS ============ */
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.2, type: "spring" }}
            className="relative inline-block mb-6"
          >
            <div className="absolute -inset-6 bg-emerald-400/15 rounded-full blur-xl" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
          <h2 className="text-xl font-extrabold text-white mb-2">Payment Initiated!</h2>
          <p className="text-white/50 text-sm mb-4">
            Check your phone for a payment prompt to complete the transaction.
          </p>
          {transaction && (
            <div className="glass rounded-2xl p-4 mb-4 inline-block">
              <p className="text-white/40 text-xs mb-1">Transaction ID</p>
              <p className="text-white font-bold">{transaction.transaction_id}</p>
            </div>
          )}
          <p className="text-white/30 text-xs">Redirecting...</p>
        </motion.div>
      ) : (
        /* ============ FORM ============ */
        <div className="glass-card p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-2xl">
              💳
            </div>
            <h2 className="text-xl font-extrabold text-white mb-1">{description || 'Payment'}</h2>
            <p className="text-white/40 text-sm">
              {itemType === 'consultation' ? 'Consultation Payment' : 
               itemType === 'booking' ? 'Booking Payment' : 'Complete Payment'}
            </p>
          </div>

          {/* Amount Display */}
          <div className="glass rounded-2xl p-5 mb-6 text-center">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Amount</p>
            <p className="text-3xl font-extrabold text-white">
              {amount?.toLocaleString()} <span className="text-white/50 text-xl">{currency}</span>
            </p>
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/60 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">📱</div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); setError('') }}
                placeholder="e.g. +255 712 345 678"
                className="w-full pl-11 pr-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
                required
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1.5">
              You will receive a payment prompt on this number
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mb-4 text-center bg-red-500/10 py-2 px-4 rounded-xl"
            >
              {error}
            </motion.p>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayment}
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
                {buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default PaymentForm