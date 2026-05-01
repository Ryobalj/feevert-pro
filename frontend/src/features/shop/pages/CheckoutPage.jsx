import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../../../features/accounts/hooks/useAuth'
import api from '../../../app/api'

const CheckoutPage = () => {
  const { cart, cartCount, cartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    shipping_address: '',
    city: '',
    region: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paymentLink, setPaymentLink] = useState(null)
  const [orderNumber, setOrderNumber] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/shop/orders/create_order/', formData)
      
      if (res.data.success) {
        setOrderNumber(res.data.order_number)
        setPaymentLink(res.data.payment_link)
        await clearCart()
      } else {
        setError(res.data.error || 'Failed to create order')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state - order created, waiting for payment
  if (orderNumber) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-16 md:py-24">
        <div className="container-main max-w-lg">
          <div className="glass-card p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Order Created!</h2>
            <p className="text-white/50 mb-2">Order #{orderNumber}</p>
            <p className="text-white/40 text-sm mb-8">Complete payment to process your order</p>
            
            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-lg w-full justify-center mb-4"
              >
                Pay Now (PawaPay)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            
            <Link to="/shop/orders" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View Order History →
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  // Empty cart
  if (!cart || cartCount === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-16 md:py-24">
        <div className="container-main max-w-lg">
          <div className="glass-card p-12 text-center">
            <span className="text-6xl mb-6 block opacity-40">🛒</span>
            <h2 className="text-xl font-bold text-white mb-3">Your cart is empty</h2>
            <p className="text-white/40 mb-8">Add some products before checking out.</p>
            <Link to="/shop" className="btn-primary btn-lg">Continue Shopping</Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-2xl">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/shop/cart')}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-4 group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Checkout
          </h1>
          <p className="text-white/40">Complete your order</p>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📋</span>
            Order Summary
          </h3>
          <div className="space-y-2 mb-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/60 truncate flex-1 mr-4">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="text-white font-medium">TZS {item.subtotal?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-white/5 mb-4" />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="gradient-text">TZS {cartTotal?.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Shipping Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <form onSubmit={handleSubmit}>
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🚚</span>
                Shipping Information
              </h3>
              
              {/* Full Name */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Full Name *</label>
                <input
                  type="text" name="full_name" value={formData.full_name}
                  onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                  placeholder="Your full name"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Email *</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Phone (for payment) *</label>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                    placeholder="+255 712 345 678"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Shipping Address *</label>
                <textarea
                  name="shipping_address" value={formData.shipping_address}
                  onChange={handleChange} required rows={2}
                  className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all resize-none"
                  placeholder="Street address, building, etc."
                />
              </div>

              {/* City + Region */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">City *</label>
                  <input
                    type="text" name="city" value={formData.city}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                    placeholder="Dar es Salaam"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Region *</label>
                  <input
                    type="text" name="region" value={formData.region}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all"
                    placeholder="Dar es Salaam"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Order Notes (optional)</label>
                <textarea
                  name="notes" value={formData.notes}
                  onChange={handleChange} rows={2}
                  className="w-full px-4 py-3 rounded-xl glass text-white placeholder:text-white/20 border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all resize-none"
                  placeholder="Any special instructions..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order & Pay
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default CheckoutPage