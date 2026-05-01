import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useCart } from '../context/CartContext'

const CartPage = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, cartCount, cartTotal } = useCart()
  const [updatingItem, setUpdatingItem] = useState(null)
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId)
      return
    }
    setUpdatingItem(itemId)
    await updateQuantity(itemId, newQuantity)
    setUpdatingItem(null)
  }

  const handleRemoveItem = async (itemId) => {
    setUpdatingItem(itemId)
    await removeFromCart(itemId)
    setUpdatingItem(null)
  }

  if (loading && !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-16 md:py-24">
        <div className="container-main max-w-2xl">
          <div className="glass-card p-12 text-center">
            <span className="text-6xl mb-6 block opacity-40">🛒</span>
            <h2 className="text-2xl font-bold text-white mb-3">Your cart is empty</h2>
            <p className="text-white/40 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/shop" className="btn-primary btn-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-4xl">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Shopping <span className="gradient-text">Cart</span>
          </h1>
          <p className="text-white/40">{cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
        </motion.div>

        {/* Cart Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-4 mb-8">
          {cart.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card p-4 flex items-center gap-4 relative ${updatingItem === item.id ? 'opacity-50' : ''}`}
            >
              {/* Product Image */}
              <Link to={`/shop/products/${item.product?.slug}`} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 glass">
                {item.product?.primary_image_url ? (
                  <img src={item.product.primary_image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center text-2xl">
                    🍯
                  </div>
                )}
              </Link>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/shop/products/${item.product?.slug}`}>
                  <h3 className="font-bold text-white hover:text-emerald-400 transition-colors truncate">
                    {item.product?.name}
                  </h3>
                </Link>
                <p className="text-sm text-white/40 mt-0.5">
                  TZS {item.product?.current_price?.toLocaleString()} each
                </p>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:border-emerald-400/30 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-white font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:border-emerald-400/30 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Subtotal + Remove */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold gradient-text text-sm">TZS {item.subtotal?.toLocaleString()}</p>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors mt-2"
                >
                  Remove
                </button>
              </div>
              
              {/* Loading overlay */}
              {updatingItem === item.id && (
                <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Cart Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Subtotal ({cartCount} items)</span>
              <span className="text-white font-medium">TZS {cart.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Shipping</span>
              <span className="text-white/30">Calculated at checkout</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="gradient-text">TZS {cartTotal?.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => clearCart()}
              className="px-4 py-2.5 rounded-full text-sm text-white/40 hover:text-red-400 transition-colors"
            >
              Clear Cart
            </button>
            
            <Link
              to="/shop/checkout"
              className="flex-1 btn-primary btn-lg justify-center"
            >
              Proceed to Checkout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Continue Shopping */}
        <div className="text-center mt-8">
          <Link to="/shop" className="text-sm text-white/40 hover:text-emerald-400 transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default CartPage