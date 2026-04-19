import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ConsultationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadConsultation = async () => {
      try {
        const res = await api.get(`/consultation-requests/${id}/`)
        setConsultation(res.data)
      } catch (error) {
        console.error('Error loading consultation:', error)
        navigate('/consultations')
      } finally {
        setLoading(false)
      }
    }
    loadConsultation()
  }, [id, navigate])

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

  if (!consultation) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'}`}
        >
          ← Back to Consultations
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-6 md:p-8 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          <div className="flex items-start justify-between mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Consultation Details
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(consultation.status)}`}>
              {(consultation.status || 'pending').replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Service</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {consultation.service_name || 'Consultation Service'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assigned To</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {consultation.assigned_to_name || 'Pending assignment'}
                </p>
              </div>
            </div>

            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Preferred Date</p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {consultation.preferred_date ? new Date(consultation.preferred_date).toLocaleString() : 'N/A'}
              </p>
            </div>

            {consultation.budget_range && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Budget Range</p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{consultation.budget_range}</p>
              </div>
            )}

            {consultation.message && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Message</p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{consultation.message}</p>
              </div>
            )}

            {consultation.admin_notes && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Response</p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{consultation.admin_notes}</p>
              </div>
            )}

            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Requested On</p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {consultation.created_at ? new Date(consultation.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ConsultationDetail
