import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ServiceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadService = async () => {
      try {
        const res = await api.get(`/consultation-services/${id}/`)
        setService(res.data)
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/services')
      } finally {
        setLoading(false)
      }
    }
    loadService()
  }, [id, navigate])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!service) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
          }`}
        >
          ← Back to Services
        </motion.button>

        {/* Service Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 md:p-10 mb-8 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <div className="flex items-start gap-4 mb-4">
            {service.icon && (
              <span className="text-4xl">{service.icon}</span>
            )}
            <h1 className={`text-3xl md:text-4xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {service.name}
            </h1>
          </div>
          
          <p className={`text-lg leading-relaxed mb-6 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {service.description}
          </p>

          <div className="flex flex-wrap gap-6 items-center">
            {service.price && (
              <div>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Starting from</p>
                <p className="text-2xl font-bold gradient-text">
                  TZS {parseInt(service.price).toLocaleString()}
                </p>
              </div>
            )}
            {service.duration_minutes && (
              <div>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {service.duration_minutes} minutes
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Additional Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* FAQ */}
          {service.faq && Array.isArray(service.faq) && service.faq.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`modern-card p-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {service.faq.map((item, i) => (
                  <div key={i}>
                    <p className={`font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {item.question}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Prerequisites */}
          {service.prerequisites && Array.isArray(service.prerequisites) && service.prerequisites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`modern-card p-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Prerequisites
              </h3>
              <ul className="space-y-2">
                {service.prerequisites.map((item, i) => (
                  <li key={i} className={`flex items-start gap-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <span className="text-green-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Link to="/request-consultation">
            <button className="glow-button text-lg px-10 py-4">
              Request This Service
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ServiceDetailPage
