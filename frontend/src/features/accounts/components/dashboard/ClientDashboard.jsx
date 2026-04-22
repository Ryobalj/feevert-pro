// src/features/accounts/components/dashboard/ClientDashboard.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../../app/api'
import { StatsCard, BookingItem, ConsultationItem, ProjectCard } from './index'

const ClientDashboard = ({ user, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [consultations, setConsultations] = useState([])
  const [payments, setPayments] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsRes, consultationsRes, paymentsRes, projectsRes] = await Promise.all([
          api.get('/my-bookings/').catch(() => ({ data: { results: [] } })),
          api.get('/consultations/').catch(() => ({ data: { results: [] } })),
          api.get('/payment-history/').catch(() => ({ data: { results: [] } })),
          api.get('/projects/').catch(() => ({ data: { results: [] } }))
        ])
        
        setBookings(bookingsRes.data?.results || bookingsRes.data || [])
        setConsultations(consultationsRes.data?.results || consultationsRes.data || [])
        setPayments(paymentsRes.data?.results || paymentsRes.data || [])
        setProjects(projectsRes.data?.results || projectsRes.data || [])
      } catch (error) {
        console.error('Error loading client dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const pendingConsultations = consultations.filter(c => c.status === 'pending').length
  const completedPayments = payments.filter(p => p.status === 'completed').length

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main">
        <WelcomeHeader user={user} darkMode={darkMode} />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard label="Pending Bookings" value={pendingBookings} icon="📅" link="/my-bookings" color="blue" />
          <StatsCard label="Pending Consultations" value={pendingConsultations} icon="💬" link="/consultations" color="green" />
          <StatsCard label="Completed Payments" value={completedPayments} icon="💳" link="/payment-history" color="purple" />
        </div>

        <Section title="Recent Bookings" link="/my-bookings" darkMode={darkMode}>
          {bookings.slice(0, 3).map(booking => (
            <BookingItem key={booking.id} booking={booking} darkMode={darkMode} />
          ))}
        </Section>

        <Section title="Recent Consultations" link="/consultations" darkMode={darkMode}>
          {consultations.slice(0, 3).map(consultation => (
            <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} />
          ))}
        </Section>

        <Section title="Your Projects" link="/projects" darkMode={darkMode}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map(project => (
              <ProjectCard key={project.id} project={project} darkMode={darkMode} />
            ))}
          </div>
        </Section>

        <QuickActions darkMode={darkMode} />
      </div>
    </motion.div>
  )
}

const WelcomeHeader = ({ user, darkMode }) => (
  <div className="mb-8">
    <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      Welcome back, <span className="gradient-text">{user?.full_name || user?.username}</span>
    </h1>
    <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      Here's an overview of your activity
    </p>
  </div>
)

const Section = ({ title, link, darkMode, children }) => (
  <div className={`modern-card p-6 mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
    <div className="flex items-center justify-between mb-4">
      <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      <Link to={link} className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} hover:underline`}>
        View all →
      </Link>
    </div>
    {children}
  </div>
)

const QuickActions = ({ darkMode }) => (
  <div className={`modern-card p-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
    <div className="flex flex-wrap gap-3">
      <QuickActionLink to="/book-appointment" primary darkMode={darkMode}>Book Appointment</QuickActionLink>
      <QuickActionLink to="/request-consultation" darkMode={darkMode}>Request Consultation</QuickActionLink>
      <QuickActionLink to="/profile" darkMode={darkMode}>Update Profile</QuickActionLink>
    </div>
  </div>
)

const QuickActionLink = ({ to, primary, darkMode, children }) => (
  <Link 
    to={to} 
    className={`px-5 py-2.5 rounded-lg font-medium ${
      primary 
        ? (darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-600 text-white hover:bg-green-700')
        : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
    }`}
  >
    {children}
  </Link>
)

export default ClientDashboard