// src/features/accounts/pages/Dashboard.jsx

import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../../../context/ThemeContext'
import {
  ClientDashboard,
  ConsultantDashboard,
  EmployeeDashboard,
  AdminDashboard
} from '../components/dashboard'

const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth()
  const { darkMode } = useTheme()

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // ============ NOT AUTHENTICATED ============
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // ============ ROLE CHECK ============
  const roleName = (user.role_name || user.role?.name || 'client').toLowerCase().trim()
  const dashboardProps = { user, darkMode }

  // ============ NO ROLE / UNKNOWN ROLE ============
  if (!roleName || !['admin', 'consultant', 'normal employee', 'client'].includes(roleName)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center max-w-md"
        >
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Account Pending</h2>
          <p className="text-white/50 mb-6">
            Your account is being set up. Please wait for admin approval or contact support.
          </p>
          <Link to="/contact" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contact Support
          </Link>
        </motion.div>
      </div>
    )
  }

  // ============ RENDER APPROPRIATE DASHBOARD ============
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {roleName === 'admin' && <AdminDashboard {...dashboardProps} />}
      {roleName === 'consultant' && <ConsultantDashboard {...dashboardProps} />}
      {roleName === 'normal employee' && <EmployeeDashboard {...dashboardProps} />}
      {(roleName === 'client' || !['admin', 'consultant', 'normal employee'].includes(roleName)) && (
        <ClientDashboard {...dashboardProps} />
      )}
    </motion.div>
  )
}

export default Dashboard