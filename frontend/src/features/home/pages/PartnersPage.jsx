import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const PartnersPage = () => {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const res = await api.get('/partners/')
        setPartners(res.data?.results || res.data || [])
      } catch (error) {
        console.error('Error loading partners:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPartners()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
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
      <div className="container-main max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Our <span className="gradient-text">Partners</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            We collaborate with leading organizations to deliver exceptional value
          </p>
        </motion.div>

        {/* Partners Grid */}
        {partners.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {partners.map((partner) => (
              <motion.div key={partner.id} variants={cardVariants}>
                <div className={`modern-card p-6 h-full text-center group ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                }`}>
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="h-16 md:h-20 w-auto mx-auto object-contain mb-4 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <h3 className={`font-semibold text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                    partner.logo ? 'hidden' : 'block'
                  } ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {partner.name}
                  </h3>
                  {partner.logo && (
                    <h3 className={`font-semibold text-sm mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {partner.name}
                    </h3>
                  )}
                  {partner.description && (
                    <p className={`text-xs mt-2 line-clamp-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {partner.description}
                    </p>
                  )}
                  {partner.website_url && (
                    <a 
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-block mt-3 text-xs font-medium hover:underline ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`}
                    >
                      Visit website
                    </a>
                  )}
                </div>
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
              No partners found.
            </p>
          </motion.div>
        )}

        {/* Become a Partner CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`modern-card p-8 mt-12 text-center ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Become a Partner
          </h2>
          <p className={`mb-6 max-w-xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Interested in collaborating with us? Let's create something great together.
          </p>
          <a 
            href="/contact"
            className="glow-button inline-block px-8 py-3"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PartnersPage
