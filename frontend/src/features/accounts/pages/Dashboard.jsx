// src/features/accounts/pages/Dashboard.jsx

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../../../context/ThemeContext'
import {
  ClientDashboard,
  ConsultantDashboard,
  EmployeeDashboard,
  AdminDashboard
} from '../components/dashboard'

const Dashboard = () => {
  const { user, loading } = useAuth()
  const { darkMode } = useTheme()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  const roleName = user.role_name || user.role?.name || 'client'

  const dashboardProps = { user, darkMode }

  switch (roleName) {
    case 'admin':
      return <AdminDashboard {...dashboardProps} />
    case 'consultant':
      return <ConsultantDashboard {...dashboardProps} />
    case 'Normal Employee':
      return <EmployeeDashboard {...dashboardProps} />
    default:
      return <ClientDashboard {...dashboardProps} />
  }
}

export default Dashboard