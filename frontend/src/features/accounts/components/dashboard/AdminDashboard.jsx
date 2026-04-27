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
        
        setUsers(Array.isArray(usersRes.data?.results) ? usersRes.data.results : Array.isArray(usersRes.data) ? usersRes.data : [])
        setConsultations(Array.isArray(consultationsRes.data?.results) ? consultationsRes.data.results : Array.isArray(consultationsRes.data) ? consultationsRes.data : [])
        setBookings(Array.isArray(bookingsRes.data?.results) ? bookingsRes.data.results : Array.isArray(bookingsRes.data) ? bookingsRes.data : [])
        setPayments(Array.isArray(paymentsRes.data?.results) ? paymentsRes.data.results : Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
      } catch (error) {
        console.error('Error loading admin dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pendingConsultations = consultations.filter(c => c?.status === 'pending').length
  const pendingBookings = bookings.filter(b => b?.status === 'pending').length
  const totalRevenue = payments.filter(p => p?.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const stats = [
    { label: 'Total Users', value: users.length, icon: '👥', color: 'emerald', link: '/admin/users' },
    { label: 'Pending Consultations', value: pendingConsultations, icon: '💬', color: 'amber' },
    { label: 'Pending Bookings', value: pendingBookings, icon: '📅', color: 'green' },
    { label: 'Total Revenue', value: `TZS ${totalRevenue.toLocaleString()}`, icon: '💰', color: 'purple' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 md:py-12"
    >
      <div className="container-main">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="mt-2 text-white/40 text-sm">
                System overview and management
              </p>
            </div>
            {/* Welcome badge */}
            <div className="glass px-4 py-2 rounded-full text-sm text-white/60">
              Welcome back, <span className="text-white font-semibold">{user?.full_name || user?.username || 'Admin'}</span>
            </div>
          </div>
        </motion.div>

        {/* ============ STATS GRID ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              {stat.link ? (
                <Link to={stat.link} className="block">
                  <StatCard stat={stat} />
                </Link>
              ) : (
                <StatCard stat={stat} />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ============ MAIN CONTENT GRID ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Consultations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">💬</span>
                Recent Consultations
              </h2>
              <Link to="/consultations" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                View all →
              </Link>
            </div>
            {consultations.length > 0 ? (
              <div className="space-y-3">
                {consultations.slice(0, 5).map(consultation => (
                  <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} showClient />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/30 text-sm">No consultations yet</div>
            )}
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📅</span>
                Recent Bookings
              </h2>
              <Link to="/my-bookings" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                View all →
              </Link>
            </div>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <BookingItem key={booking.id} booking={booking} darkMode={darkMode} showClient />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/30 text-sm">No bookings yet</div>
            )}
          </motion.div>
        </div>

        {/* ============ QUICK ACTIONS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
        >
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">⚡</span>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users" className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              <span className="relative z-10">👥 Manage Users</span>
            </Link>
            <Link to="/admin/roles" className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300">
              🔑 Manage Roles
            </Link>
            <Link to="/admin/settings" className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300">
              ⚙️ Site Settings
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============ Stat Card Component ============
const StatCard = ({ stat }) => {
  const colorMap = {
    emerald: 'from-emerald-400 to-green-600',
    amber: 'from-amber-400 to-orange-500',
    green: 'from-green-400 to-emerald-600',
    purple: 'from-purple-400 to-violet-600',
    blue: 'from-blue-400 to-cyan-600',
  }

  return (
    <div className="glass-card group hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[stat.color] || colorMap.emerald} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {stat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-extrabold text-white truncate">
              {stat.value}
            </div>
            <div className="text-xs text-white/40 font-medium mt-0.5">
              {stat.label}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${colorMap[stat.color] || colorMap.emerald} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard