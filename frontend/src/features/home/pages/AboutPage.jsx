import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const AboutPage = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const res = await api.get('/about-sections/')
        const data = res.data?.results?.[0] || res.data?.[0] || null
        setAbout(data)
      } catch (error) {
        console.error('Error loading about:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAbout()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main">
        {/* Page Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            About <span className="gradient-text">FeeVert</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {about?.title || 'Learn more about our mission, vision, and values'}
          </p>
        </motion.div>

        {/* Content Card */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className={`modern-card p-8 md:p-10 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}>
            {/* Description */}
            <div className="mb-10">
              <p className={`text-lg leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {about?.description || 'FeeVert Solution Limited is a professional consultancy firm dedicated to providing high-quality services in Agriculture, Environment, and Occupational Health & Safety across Tanzania.'}
              </p>
            </div>

            {/* Mission & Vision Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mission */}
              <motion.div
                whileHover={{ y: -4 }}
                className={`p-6 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600 hover:border-green-700' 
                    : 'bg-green-50/80 border-green-100 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Our Mission
                  </h3>
                </div>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {about?.mission || 'To empower businesses and communities through expert consultancy that drives sustainable growth and environmental stewardship.'}
                </p>
              </motion.div>

              {/* Vision */}
              <motion.div
                whileHover={{ y: -4 }}
                className={`p-6 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600 hover:border-green-700' 
                    : 'bg-emerald-50/80 border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">👁️</span>
                  <h3 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Our Vision
                  </h3>
                </div>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {about?.vision || 'To be Tanzania\'s most trusted consultancy partner, recognized for excellence in agricultural innovation, environmental protection, and workplace safety.'}
                </p>
              </motion.div>
            </div>

            {/* Stats if available */}
            {about?.stats && Array.isArray(about.stats) && about.stats.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className={`text-xl font-semibold text-center mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Our Impact in Numbers
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {about.stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="p-4"
                    >
                      <div className={`text-2xl md:text-3xl font-bold gradient-text mb-1`}>
                        {stat.number || '0'}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.label || 'Stat'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Why Choose Us Section */}
        {about?.why_choose_us && Array.isArray(about.why_choose_us) && about.why_choose_us.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mt-12"
          >
            <h2 className={`text-2xl md:text-3xl font-bold text-center mb-8 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Why Choose <span className="gradient-text">FeeVert</span>?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-5">
              {about.why_choose_us.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -3 }}
                  className={`p-5 rounded-xl border transition-all ${
                    darkMode 
                      ? 'bg-gray-800/60 border-gray-700 hover:border-green-600' 
                      : 'bg-white/80 border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-3">{item.icon || '✅'}</div>
                  <h4 className={`font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title || 'Feature'}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.description || 'Description'}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default AboutPage
