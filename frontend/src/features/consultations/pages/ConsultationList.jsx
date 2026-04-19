import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ConsultationList = () => {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const res = await api.get('/consultation-requests/')
        setConsultations(res.data?.results || res.data || [])
      } catch (error) {
        console.error('Error loading consultations:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConsultations()
  }, [])

  const filteredConsultations = filter === 'all' 
    ? consultations 
    : consultations.filter(c => c.status === filter)

  const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'completed': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
      <div className="container-main max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              My <span className="gradient-text">Consultations</span>
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Track your consultation requests
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/request-consultation">
              <button className="glow-button px-5 py-2.5">
                New Request
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </motion.div>

        {filteredConsultations.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredConsultations.map((consultation) => (
              <motion.div key={consultation.id} variants={cardVariants}>
                <Link to={`/consultations/${consultation.id}`}>
                  <div className={`modern-card p-5 group cursor-pointer ${
                    darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {consultation.service_name || 'Consultation Request'}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(consultation.status)}`}>
                            {consultation.status?.replace('_', ' ') || 'pending'}
                          </span>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Preferred Date: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {consultation.preferred_date ? new Date(consultation.preferred_date).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Assigned To: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {consultation.assigned_to_name || 'Pending assignment'}
                            </span>
                          </div>
                        </div>
                        
                        {consultation.message && (
                          <p className={`text-sm mt-3 line-clamp-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {consultation.message}
                          </p>
                        )}
                      </div>
                      
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`modern-card p-12 text-center ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No {filter !== 'all' ? filter.replace('_', ' ') : ''} consultation requests found.
            </p>
            <Link to="/request-consultation">
              <button className="glow-button px-6 py-2.5">
                Request Consultation
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ConsultationList
