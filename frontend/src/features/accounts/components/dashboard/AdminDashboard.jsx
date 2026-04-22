// src/features/accounts/components/dashboard/AdminDashboard.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../../app/api'
import { StatsCard, BookingItem, ConsultationItem } from './index'

const AdminDashboard = ({ user, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [consultations, setConsultations] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, consultationsRes, bookingsRes, paymentsRes] = await Promise.all([
          api.get('/users/').catch(() => ({ data: { results: [] } })),
          api.get('/consultation-requests/').catch(() => ({ data: { results: [] } })),
          api.get('/bookings/').catch(() => ({ data: { results: [] } })),
          api.get('/payments/transactions/').catch(() => ({ data: { results: [] } }))
        ])
        
        setUsers(usersRes.data?.results || usersRes.data || [])
        setConsultations(consultationsRes.data?.results || consultationsRes.data || [])
        setBookings(bookingsRes.data?.results || bookingsRes.data || [])
        setPayments(paymentsRes.data?.results || paymentsRes.data || [])
      } catch (error) {
        console.error('Error loading admin dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>
  }

  const pendingConsultations = consultations.filter(c => c.status === 'pending').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main">
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Admin Dashboard
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            System overview and management
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Users" value={users.length} icon="👥" color="blue" link="/admin/users" />
          <StatsCard label="Pending Consultations" value={pendingConsultations} icon="💬" color="yellow" />
          <StatsCard label="Pending Bookings" value={pendingBookings} icon="📅" color="green" />
          <StatsCard label="Total Revenue" value={`TZS ${totalRevenue.toLocaleString()}`} icon="💰" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`modern-card p-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Consultations
            </h2>
            <div className="space-y-3">
              {consultations.slice(0, 5).map(consultation => (
                <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} showClient />
              ))}
            </div>
          </div>

          <div className={`modern-card p-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Bookings
            </h2>
            <div className="space-y-3">
              {bookings.slice(0, 5).map(booking => (
                <BookingItem key={booking.id} booking={booking} darkMode={darkMode} showClient />
              ))}
            </div>
          </div>
        </div>

        <div className={`modern-card p-6 mt-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionLink to="/admin/users" color="blue" darkMode={darkMode}>Manage Users</QuickActionLink>
            <QuickActionLink to="/admin/roles" color="purple" darkMode={darkMode}>Manage Roles</QuickActionLink>
            <QuickActionLink to="/admin/settings" darkMode={darkMode}>Site Settings</QuickActionLink>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const QuickActionLink = ({ to, color, darkMode, children }) => {
  const colors = {
    blue: darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700',
    purple: darkMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'
  }
  return (
    <Link to={to} className={`px-5 py-2.5 rounded-lg font-medium text-white ${colors[color] || (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}>
      {children}
    </Link>
  )
}

export default AdminDashboard