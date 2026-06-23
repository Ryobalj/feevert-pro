// src/features/accounts/components/dashboard/ClientDashboard.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '../../../../app/api'
import { BookingItem, ConsultationItem, ProjectCard } from './index'

const ClientDashboard = ({ user, darkMode }) => {
  const { t } = useTranslation('admin')
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [consultations, setConsultations] = useState([])
  const [payments, setPayments] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsRes, consultationsRes, paymentsRes, projectsRes] = await Promise.all([
          api.get('/bookings/').catch(() => ({ data: { results: [] } })),
          api.get('/consultation-requests/').catch(() => ({ data: { results: [] } })),
          api.get('/payments/transactions/').catch(() => ({ data: { results: [] } })),
          api.get('/projects/').catch(() => ({ data: { results: [] } }))
        ])
        
        setBookings(bookingsRes.data?.results || bookingsRes.data || [])
        setConsultations(consultationsRes.data?.results || consultationsRes.data || [])
        setPayments(paymentsRes.data?.results || paymentsRes.data?.transactions || paymentsRes.data || [])
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
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">{t('client.loading')}</p>
        </div>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b?.status === 'pending').length
  const pendingConsultations = consultations.filter(c => c?.status === 'pending').length
  const completedPayments = payments.filter(p => p?.status === 'completed').length

  const stats = [
    { label: t('client.pending_bookings'), value: pendingBookings, icon: '📅', color: 'emerald', link: '/my-bookings' },
    { label: t('client.pending_consultations'), value: pendingConsultations, icon: '💬', color: 'amber', link: '/consultations' },
    { label: t('client.completed_payments'), value: completedPayments, icon: '💳', color: 'purple', link: '/payment-history' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 md:py-12"
    >
      <div className="container-main">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
                {t('client.welcome_back')}, <span className="gradient-text">{user?.full_name || user?.username}</span>
              </h1>
              <p className="mt-2 text-white/40 text-sm">
                {t('client.activity_overview')}
              </p>
            </div>
            {user?.date_joined && (
              <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
                {t('client.member_since')}{' '}
                <span className="text-white font-semibold">
                  {new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
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
              <Link to={stat.link} className="block">
                <StatCard stat={stat} />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Bookings */}
        <DashboardSection 
          title={t('client.recent_bookings')} 
          link="/my-bookings" 
          icon="📅" 
          delay={0.15}
          viewAllText={t('view_all')}
        >
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 3).map(booking => (
                <BookingItem key={booking.id} booking={booking} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage 
              message={t('client.no_bookings')} 
              link="/book-appointment" 
              linkText={t('client.book_appointment')} 
            />
          )}
        </DashboardSection>

        {/* Recent Consultations */}
        <DashboardSection 
          title={t('client.recent_consultations')} 
          link="/consultations" 
          icon="💬" 
          delay={0.2}
          viewAllText={t('view_all')}
        >
          {consultations.length > 0 ? (
            <div className="space-y-3">
              {consultations.slice(0, 3).map(consultation => (
                <ConsultationItem key={consultation.id} consultation={consultation} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage 
              message={t('client.no_consultations')} 
              link="/request-consultation" 
              linkText={t('client.request_consultation')} 
            />
          )}
        </DashboardSection>

        {/* Your Projects */}
        <DashboardSection 
          title={t('client.your_projects')} 
          link="/projects" 
          icon="📁" 
          delay={0.25}
          viewAllText={t('view_all')}
        >
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map(project => (
                <ProjectCard key={project.id} project={project} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage message={t('client.no_projects')} />
          )}
        </DashboardSection>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
        >
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">⚡</span>
            {t('client.quick_actions')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/book-appointment" 
              className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
              <span className="relative z-10">📅 {t('client.book_appointment')}</span>
            </Link>
            <Link 
              to="/request-consultation" 
              className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300"
            >
              💬 {t('client.request_consultation')}
            </Link>
            <Link 
              to="/profile" 
              className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300"
            >
              👤 {t('client.update_profile')}
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============ DASHBOARD SECTION ============
const DashboardSection = ({ title, link, icon, children, delay = 0, viewAllText = 'View all' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">{icon}</span>
        {title}
      </h2>
      <Link to={link} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 group/link">
        {viewAllText}
        <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
    {children}
  </motion.div>
)

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

// ============ EMPTY MESSAGE ============
const EmptyMessage = ({ message, link, linkText }) => (
  <div className="text-center py-8">
    <p className="text-white/30 text-sm mb-3">{message}</p>
    {link && linkText && (
      <Link to={link} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
        {linkText} →
      </Link>
    )}
  </div>
)

export default ClientDashboard