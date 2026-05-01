// src/features/shop/components/CartDrawer.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, loading, updateQuantity, removeFromCart, cartCount, cartTotal } = useCart()

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId)
      return
    }
    await updateQuantity(itemId, newQuantity)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50"
          >
            <div className="h-full glass-card !rounded-l-3xl !rounded-r-none flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛒</span>
                  <h3 className="text-lg font-bold text-white">
                    Your Cart
                    {cartCount > 0 && (
                      <span className="ml-2 text-sm font-normal text-white/40">({cartCount} items)</span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loading && !cart ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="spinner" />
                  </div>
                ) : !cart || !cart.items || cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <span className="text-5xl mb-4 opacity-40">🛒</span>
                    <p className="text-white/50 mb-2">Your cart is empty</p>
                    <button
                      onClick={onClose}
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Continue Shopping →
                    </button>
                  </div>
                ) : (
                  cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 rounded-2xl glass hover:border-white/10 transition-all"
                    >
                      {/* Product Image */}
                      <Link
                        to={`/shop/products/${item.product?.slug}`}
                        onClick={onClose}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 glass"
                      >
                        {item.product?.primary_image_url ? (
                          <img
                            src={item.product.primary_image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center text-xl">
                            🍯
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/shop/products/${item.product?.slug}`}
                          onClick={onClose}
                          className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors truncate block"
                        >
                          {item.product?.name}
                        </Link>
                        <p className="text-xs text-white/40 mt-0.5">
                          TZS {item.product?.current_price?.toLocaleString()}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md glass flex items-center justify-center text-white/50 hover:text-white text-xs transition-all"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-white text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-md glass flex items-center justify-center text-white/50 hover:text-white text-xs transition-all"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-xs text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold gradient-text">
                          TZS {item.subtotal?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cart && cart.items && cart.items.length > 0 && (
                <div className="p-5 border-t border-white/5 space-y-4">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Total</span>
                    <span className="text-lg font-bold gradient-text">
                      TZS {cartTotal?.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      to="/shop/cart"
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-full glass text-center text-sm text-white/70 hover:text-white hover:border-white/20 transition-all"
                    >
                      View Cart
                    </Link>
                    <Link
                      to="/shop/checkout"
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-center text-sm font-semibold transition-all"
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer