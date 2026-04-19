import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const RequestConsultation = () => {
  const [services, setServices] = useState([])
  const [formData, setFormData] = useState({
    service: '', preferred_date: '', message: '', budget_range: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await api.get('/consultation-services/')
        setServices(res.data?.results || res.data || [])
      } catch (error) {
        console.error('Error loading services:', error)
      } finally {
        setFetching(false)
      }
    }
    loadServices()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await api.post('/consultation-requests/', formData)
      setSubmitted(true)
      setTimeout(() => navigate('/consultations'), 2000)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Error submitting request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Request <span className="gradient-text">Consultation</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Fill out the form and we'll get back to you shortly
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`modern-card p-8 text-center ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <div className={`text-5xl mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              ✓
            </div>
            <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Request Submitted!
            </h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thank you for your request. We'll contact you soon.
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Redirecting to consultations...
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`modern-card p-6 md:p-8 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Service *
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                  <option value="">Choose a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.price && `- TZS ${parseInt(service.price).toLocaleString()}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Preferred Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Budget Range (optional)
                </label>
                <input
                  type="text"
                  value={formData.budget_range}
                  onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                  placeholder="e.g., 500,000 - 1,000,000 TZS"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Additional Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows="4"
                  placeholder="Tell us more about your needs..."
                  className={`w-full px-4 py-3 rounded-lg border resize-y ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`glow-button w-full py-3 text-base ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default RequestConsultation
