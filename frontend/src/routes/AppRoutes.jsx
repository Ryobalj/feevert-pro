import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import HomePage from '../features/home/pages/HomePage'
import LoginPage from '../features/accounts/pages/LoginPage'
import RegisterPage from '../features/accounts/pages/RegisterPage'
import Dashboard from '../features/accounts/pages/Dashboard'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default AppRoutes
