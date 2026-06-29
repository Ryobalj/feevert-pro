import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next' // ✅ Ongeza hii
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const OrderHistoryPage = () => {
  const { t } = useTranslation('shop') // ✅ Ongeza hii
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get('/shop/orders/')
        setOrders(res.data?.results || res.data || [])
      } catch (err) {
        console.error('Error loading orders:', err)
        setError(t('orders.error_load') || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [t])

  // Get status config with translations
  const getStatusConfig = () => ({
    pending: { 
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', 
      icon: '⏳', 
      label: t('order.status.pending') || 'Pending Payment' 
    },
    paid: { 
      badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', 
      icon: '💳', 
      label: t('order.status.paid') || 'Paid' 
    },
    processing: { 
      badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', 
      icon: '🔄', 
      label: t('order.status.processing') || 'Processing' 
    },
    shipped: { 
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 
      icon: '🚚', 
      label: t('order.status.shipped') || 'Shipped' 
    },
    delivered: { 
      badge: 'bg-green-500/15 text-green-400 border-green-500/20', 
      icon: '✅', 
      label: t('order.status.delivered') || 'Delivered' 
    },
    cancelled: { 
      badge: 'bg-red-500/15 text-red-400 border-red-500/20', 
      icon: '❌', 
      label: t('order.status.cancelled') || 'Cancelled' 
    },
  })

  const statusConfig = getStatusConfig()

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // Helper to get payment status label
  const getPaymentStatusLabel = (paymentStatus) => {
    if (!paymentStatus) return t('order.payment.pending') || 'Pending'
    const labels = {
      'pending': t('order.payment.pending') || 'Pending',
      'completed': t('order.payment.completed') || 'Completed',
      'failed': t('order.payment.failed') || 'Failed',
      'refunded': t('order.payment.refunded') || 'Refunded'
    }
    return labels[paymentStatus] || paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
  }

  // Helper to get payment status color
  const getPaymentStatusColor = (paymentStatus) => {
    if (paymentStatus === 'completed') return 'text-emerald-400'
    if (paymentStatus === 'failed') return 'text-red-400'
    if (paymentStatus === 'refunded') return 'text-purple-400'
    return 'text-amber-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">
            {t('orders.loading') || 'Loading orders...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-3xl">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            {t('orders.my_orders') || 'My'} <span className="gradient-text">{t('orders.title') || 'Orders'}</span>
          </h1>
          <p className="text-white/40">
            {t('orders.subtitle') || 'Track your order history'}
          </p>
        </motion.div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {t('order.title') || 'Order'} #{order.order_number}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items?.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-white/60 truncate flex-1 mr-4">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="text-white/40">
                          {t('order.currency') || 'TZS'} {item.subtotal?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-white/30">
                        +{order.items.length - 3} {t('order.more_items') || 'more items'}
                      </p>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <span className="text-xs text-white/40">{t('order.total') || 'Total'}</span>
                      <p className="text-sm font-bold gradient-text">
                        {t('order.currency') || 'TZS'} {order.total?.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Payment Status */}
                    <div className="text-right">
                      <span className="text-xs text-white/40">{t('order.payment.label') || 'Payment'}</span>
                      <p className={`text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                        {getPaymentStatusLabel(order.payment_status)}
                      </p>
                    </div>
                  </div>

                  {/* Pay Again Button (if payment failed/pending) */}
                  {order.payment_status !== 'completed' && order.payment_status !== 'failed' && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <button
                        onClick={() => {
                          // Re-initiate payment logic
                        }}
                        className="w-full py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                      >
                        {t('orders.complete_payment') || 'Complete Payment'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center">
            <span className="text-6xl mb-6 block opacity-40">📦</span>
            <h2 className="text-xl font-bold text-white mb-3">
              {t('orders.no_orders') || 'No orders yet'}
            </h2>
            <p className="text-white/40 mb-8">
              {t('orders.no_orders_message') || "You haven't placed any orders yet."}
            </p>
            <Link to="/shop" className="btn-primary btn-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {t('orders.start_shopping') || 'Start Shopping'}
            </Link>
          </motion.div>
        )}

        {/* Continue Shopping */}
        {orders.length > 0 && (
          <div className="text-center mt-8">
            <Link to="/shop" className="text-sm text-white/40 hover:text-emerald-400 transition-colors">
              ← {t('cart.continue_shopping') || 'Continue Shopping'}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default OrderHistoryPage