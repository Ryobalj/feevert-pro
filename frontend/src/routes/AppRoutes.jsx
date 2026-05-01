import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import HomePage from '../features/home/pages/HomePage'
import LoginPage from '../features/accounts/pages/LoginPage'
import RegisterPage from '../features/accounts/pages/RegisterPage'
import Dashboard from '../features/accounts/pages/Dashboard'

// Shop imports
import ShopPage from '../features/shop/pages/ShopPage'
import ProductDetailPage from '../features/shop/pages/ProductDetailPage'
import CartPage from '../features/shop/pages/CartPage'
import CheckoutPage from '../features/shop/pages/CheckoutPage'
import OrderHistoryPage from '../features/shop/pages/OrderHistoryPage'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Shop routes */}
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/products/:slug" element={<ProductDetailPage />} />
      <Route path="/shop/cart" element={<CartPage />} />
      <Route path="/shop/checkout" element={
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      } />
      <Route path="/shop/orders" element={
        <ProtectedRoute>
          <OrderHistoryPage />
        </ProtectedRoute>
      } />
      
      {/* Dashboard (protected) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* 404 Not Found */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-12 text-center">
            <span className="text-6xl mb-6 block opacity-40">🔍</span>
            <h2 className="text-2xl font-bold text-white mb-3">404 - Page Not Found</h2>
            <p className="text-white/40 mb-6">The page you're looking for doesn't exist.</p>
            <a href="/" className="btn-primary">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default AppRoutes