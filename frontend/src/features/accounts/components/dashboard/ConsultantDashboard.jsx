// src/features/accounts/components/dashboard/ConsultantDashboard.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../../app/api'
import { BookingItem, ConsultationItem } from './index'

const ConsultantDashboard = ({ user, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [consultations, setConsultations] = useState([])
  const [bookings, setBookings] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [consultationsRes, bookingsRes, projectsRes] = await Promise.all([
          api.get('/consultation-requests/?assigned_to=me').catch(() => ({ data: { results: [] } })),
          api.get('/bookings/?consultant=me').catch(() => ({ data: { results: [] } })),
          api.get('/projects/').catch(() => ({ data: { results: [] } }))
        ])
        
        setConsultations(consultationsRes.data?.results || consultationsRes.data || [])
        setBookings(bookingsRes.data?.results || bookingsRes.data || [])
        setProjects(projectsRes.data?.results || projectsRes.data || [])
      } catch (error) {
        console.error('Error loading consultant dashboard:', error)
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
          <p className="text-white/50 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Assigned Consultations', value: consultations.length, icon: '💬', color: 'emerald' },
    { label: 'Upcoming Bookings', value: bookings.length, icon: '📅', color: 'amber' },
    { label: 'Active Projects', value: projects.length, icon: '📁', color: 'purple' },
  ]

  const pendingConsultations = consultations.filter(c => c?.status === 'pending').length
  const upcomingBookings = bookings.filter(b => b?.status === 'confirmed' || b?.status === 'pending').length

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 md:py-12"
    >
      <div className="container-main">
        {/* ============ WELCOME HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
                Consultant <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="mt-2 text-white/40 text-sm">
                Welcome back, {user?.full_name || user?.username}
              </p>
            </div>
            {/* Status badge */}
            <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
              <span className="text-emerald-400 font-semibold">{pendingConsultations}</span> pending •{' '}
              <span className="text-amber-400 font-semibold">{upcomingBookings}</span> upcoming
            </div>
          </div>
        </motion.div>

        {/* ============ STATS GRID ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <StatCard stat={stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* ============ ASSIGNED CONSULTATIONS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">💬</span>
              Assigned Consultations
            </h2>
            <Link to="/consultations" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 group/link">
              View all
              <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {consultations.length > 0 ? (
            <div className="space-y-3">
              {consultations.slice(0, 5).map(consultation => (
                <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} showClient />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">No consultations assigned yet</div>
          )}
        </motion.div>

        {/* ============ UPCOMING BOOKINGS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📅</span>
              Upcoming Bookings
            </h2>
            <Link to="/my-bookings" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 group/link">
              View all
              <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map(booking => (
                <BookingItem key={booking.id} booking={booking} darkMode={darkMode} showClient />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">No upcoming bookings</div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============ STAT CARD ============
const StatCard = ({ stat }) => {
  const colorMap = {
    emerald: 'from-emerald-400 to-green-600',
    amber: 'from-amber-400 to-orange-500',
    purple: 'from-purple-400 to-violet-600',
    blue: 'from-blue-400 to-cyan-600',
    green: 'from-green-400 to-emerald-600',
  }

  return (
    <div className="glass-card group/card hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[stat.color] || colorMap.emerald} flex items-center justify-center text-xl shadow-lg group-hover/card:scale-110 transition-transform duration-300`}>
            {stat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-extrabold text-white">
              {stat.value}
            </div>
            <div className="text-xs text-white/40 font-medium mt-0.5">
              {stat.label}
            </div>
          </div>
        </div>
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

export default ConsultantDashboard