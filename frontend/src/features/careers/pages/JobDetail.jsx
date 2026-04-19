import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', cover_letter: '', cv_file: null })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}/`)
        setJob(res.data)
      } catch (error) {
        console.error('Error loading job:', error)
        navigate('/careers')
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const data = new FormData()
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key])
    })
    data.append('job', id)
    
    try {
      await api.post('/job-applications/', data)
      setSubmitted(true)
      setFormData({ full_name: '', email: '', phone: '', cover_letter: '', cv_file: null })
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error submitting application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!job) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
          }`}
        >
          ← Back to Careers
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`modern-card p-6 md:p-8 mb-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {job.title}
              </h1>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {job.location}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {job.employment_type_display || job.employment_type}
                </span>
                {job.experience_level && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    {job.experience_level_display || job.experience_level}
                  </span>
                )}
              </div>

              <div className="prose prose-green max-w-none">
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Job Description
                  </h3>
                  <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {job.description}
                  </p>
                </div>

                {job.requirements && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Requirements
                    </h3>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {job.requirements}
                    </p>
                  </div>
                )}

                {job.responsibilities && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Responsibilities
                    </h3>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {job.responsibilities}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`modern-card p-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Job Overview
              </h3>
              
              <div className="space-y-3">
                {job.salary_range_min && job.salary_range_max && (
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salary Range</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {job.salary_currency || 'TZS'} {parseInt(job.salary_range_min).toLocaleString()} - {parseInt(job.salary_range_max).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {job.vacancies_count && (
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vacancies</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {job.vacancies_count} position{job.vacancies_count > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                {job.deadline && (
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Application Deadline</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {job.remote_option && (
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Work Mode</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {job.remote_option_display || job.remote_option}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`modern-card p-6 md:p-8 mt-6 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Apply for this position
          </h2>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-700 dark:text-green-300 text-center"
            >
              Application submitted successfully! We'll review your application and get back to you soon.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cover Letter
                </label>
                <textarea
                  value={formData.cover_letter}
                  onChange={(e) => setFormData({...formData, cover_letter: e.target.value})}
                  rows="4"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500 resize-y`}
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  CV / Resume *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({...formData, cv_file: e.target.files[0]})}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className={`glow-button w-full py-3 ${submitting ? 'opacity-70' : ''}`}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default JobDetail
