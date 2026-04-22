// src/features/accounts/components/dashboard/ConsultantDashboard.jsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../app/api'
import { StatsCard, BookingItem, ConsultationItem } from './index'

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
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main">
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Consultant Dashboard
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome back, {user?.full_name || user?.username}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard label="Assigned Consultations" value={consultations.length} icon="💬" color="blue" />
          <StatsCard label="Upcoming Bookings" value={bookings.length} icon="📅" color="green" />
          <StatsCard label="Active Projects" value={projects.length} icon="📁" color="purple" />
        </div>

        <div className={`modern-card p-6 mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Assigned Consultations
          </h2>
          <div className="space-y-3">
            {consultations.slice(0, 5).map(consultation => (
              <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} showClient />
            ))}
          </div>
        </div>

        <div className={`modern-card p-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Upcoming Bookings
          </h2>
          <div className="space-y-3">
            {bookings.slice(0, 5).map(booking => (
              <BookingItem key={booking.id} booking={booking} darkMode={darkMode} showClient />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ConsultantDashboard