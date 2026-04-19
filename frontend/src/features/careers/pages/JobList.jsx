import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsRes, categoriesRes] = await Promise.all([
          api.get('/jobs/'),
          api.get('/job-categories/')
        ])
        
        setJobs(jobsRes.data?.results || jobsRes.data || [])
        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) {
        console.error('Error loading jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredJobs = jobs.filter(job => {
    if (selectedCategory !== 'all' && job.category !== parseInt(selectedCategory)) return false
    if (selectedType !== 'all' && job.employment_type !== selectedType) return false
    return job.is_active !== false
  })

  const employmentTypes = [...new Set(jobs.map(j => j.employment_type).filter(Boolean))]

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Join Our <span className="gradient-text">Team</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Explore career opportunities and grow with us
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            {employmentTypes.map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </motion.div>

        {/* Jobs List */}
        {filteredJobs.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredJobs.map((job) => (
              <motion.div key={job.id} variants={cardVariants}>
                <Link to={`/careers/${job.id}`}>
                  <div className={`modern-card p-6 group cursor-pointer ${
                    darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm mb-3">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {job.location}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {job.employment_type_display || job.employment_type}
                          </span>
                          {job.category_name && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            }`}>
                              {job.category_name}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm line-clamp-2 mb-3 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {job.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {job.deadline && (
                          <p className={`text-xs mb-2 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Deadline: {new Date(job.deadline).toLocaleDateString()}
                          </p>
                        )}
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          View Details →
                        </span>
                      </div>
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
            className="text-center py-12"
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No open positions matching your criteria.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default JobList
