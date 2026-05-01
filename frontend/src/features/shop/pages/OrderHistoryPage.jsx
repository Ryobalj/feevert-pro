import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const OrderHistoryPage = () => {
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
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const statusConfig = {
    pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: 'Pending Payment' },
    paid: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '💳', label: 'Paid' },
    processing: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: 'Processing' },
    shipped: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '🚚', label: 'Shipped' },
    delivered: { badge: 'bg-green-500/15 text-green-400 border-green-500/20', icon: '✅', label: 'Delivered' },
    cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: 'Cancelled' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading orders...</p>
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
            My <span className="gradient-text">Orders</span>
          </h1>
          <p className="text-white/40">Track your order history</p>
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
                        Order #{order.order_number}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
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
                        <span className="text-white/40">TZS {item.subtotal?.toLocaleString()}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-white/30">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <span className="text-xs text-white/40">Total</span>
                      <p className="text-sm font-bold gradient-text">TZS {order.total?.toLocaleString()}</p>
                    </div>
                    
                    {/* Payment Status */}
                    <div className="text-right">
                      <span className="text-xs text-white/40">Payment</span>
                      <p className={`text-xs font-semibold ${
                        order.payment_status === 'completed' ? 'text-emerald-400' :
                        order.payment_status === 'failed' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}
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
                        Complete Payment
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
            <h2 className="text-xl font-bold text-white mb-3">No orders yet</h2>
            <p className="text-white/40 mb-8">You haven't placed any orders yet.</p>
            <Link to="/shop" className="btn-primary btn-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Start Shopping
            </Link>
          </motion.div>
        )}

        {/* Continue Shopping */}
        {orders.length > 0 && (
          <div className="text-center mt-8">
            <Link to="/shop" className="text-sm text-white/40 hover:text-emerald-400 transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default OrderHistoryPage