import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import api from '../../../app/api'

const Dashboard = () => {
  const [stats, setStats] = useState({ bookings: 0, consultations: 0, payments: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentConsultations, setRecentConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [bookingsRes, consultationsRes, paymentsRes] = await Promise.all([
          api.get('/bookings/'),
          api.get('/consultation-requests/'),
          api.get('/payments/transactions/')
        ])
        
        const bookings = bookingsRes.data?.results || bookingsRes.data || []
        const consultations = consultationsRes.data?.results || consultationsRes.data || []
        const payments = paymentsRes.data?.results || paymentsRes.data || []
        
        setStats({
          bookings: bookings.length,
          consultations: consultations.length,
          payments: payments.filter(p => p.status === 'completed').length
        })
        
        setRecentBookings(bookings.slice(0, 3))
        setRecentConsultations(consultations.slice(0, 3))
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const statCards = [
    { label: 'Total Bookings', value: stats.bookings, link: '/my-bookings', color: 'from-blue-600 to-blue-800' },
    { label: 'Consultations', value: stats.consultations, link: '/consultations', color: 'from-green-600 to-green-800' },
    { label: 'Completed Payments', value: stats.payments, link: '/payment-history', color: 'from-purple-600 to-purple-800' }
  ]

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome back,{' '}
            <span className="gradient-text">{user?.full_name || user?.username}</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Here's an overview of your account
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-5 mb-8"
        >
          {statCards.map((stat, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Link to={stat.link}>
                <div className={`modern-card p-6 group cursor-pointer ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                }`}>
                  <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <span className="text-white text-xl font-bold">{stat.value}</span>
                  </div>
                  <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.label}
                  </h3>
                  <p className={`text-sm group-hover:text-green-600 dark:group-hover:text-green-400 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    View details →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Bookings
              </h2>
              <Link to="/my-bookings" className={`text-sm ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                View all →
              </Link>
            </div>
            
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Link to={`/bookings/${booking.id}`} key={booking.id}>
                    <div className={`p-4 rounded-lg transition-colors ${
                      darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {booking.service_name || 'Consultation'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(booking.slot?.date || booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No bookings yet.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Consultations
              </h2>
              <Link to="/consultations" className={`text-sm ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                View all →
              </Link>
            </div>
            
            {recentConsultations.length > 0 ? (
              <div className="space-y-3">
                {recentConsultations.map((consultation) => (
                  <Link to={`/consultations/${consultation.id}`} key={consultation.id}>
                    <div className={`p-4 rounded-lg transition-colors ${
                      darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {consultation.service_name || 'Consultation'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(consultation.preferred_date || consultation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          consultation.status === 'confirmed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : consultation.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No consultations yet.
              </p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`modern-card p-6 mt-6 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <h2 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/book-appointment" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-green-700 text-white hover:bg-green-600' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}>
              Book Appointment
            </Link>
            <Link to="/request-consultation" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              Request Consultation
            </Link>
            <Link to="/profile" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              Update Profile
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard
