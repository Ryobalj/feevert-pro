// src/features/shop/context/CartContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useAuth()

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/shop/cart/')
      setCart(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch cart on mount and when auth changes
  useEffect(() => {
    fetchCart()
  }, [fetchCart, isAuthenticated])

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true)
      const res = await api.post('/shop/cart/add/', {
        product_id: productId,
        quantity: quantity
      })
      setCart(res.data)
      setError(null)
      return { success: true }
    } catch (err) {
      console.error('Error adding to cart:', err)
      const message = err.response?.data?.error || 'Failed to add to cart'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true)
      const res = await api.post('/shop/cart/update_quantity/', {
        item_id: itemId,
        quantity: quantity
      })
      setCart(res.data)
      setError(null)
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError('Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true)
      const res = await api.post('/shop/cart/remove/', {
        item_id: itemId
      })
      setCart(res.data)
      setError(null)
    } catch (err) {
      console.error('Error removing from cart:', err)
      setError('Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true)
      const res = await api.post('/shop/cart/clear/')
      setCart(res.data)
      setError(null)
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  // Check if product is in cart
  const isInCart = (productId) => {
    if (!cart?.items) return false
    return cart.items.some(item => item.product?.id === productId)
  }

  // Get cart item count
  const cartCount = cart?.total_items || 0

  // Get cart total
  const cartTotal = cart?.total || 0

  const value = {
    cart,
    loading,
    error,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    fetchCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartContext