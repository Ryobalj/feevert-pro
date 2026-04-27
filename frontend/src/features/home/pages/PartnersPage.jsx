import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading partners...</p>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-16 md:py-24"
    >
      <div className="container-main max-w-5xl">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">🤝 Our Network</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Our <span className="gradient-text">Partners</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            We collaborate with leading organizations to deliver exceptional value
          </p>
        </motion.div>

        {/* ============ PARTNERS GRID ============ */}
        {partners.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {partners.map((partner, index) => (
              <motion.div 
                key={partner.id} 
                variants={cardVariants}
                whileHover={{ y: -6 }}
              >
                <div className="glass-card h-full text-center flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
                  
                  <div className="p-6 w-full">
                    {/* Logo or Fallback */}
                    {partner.logo ? (
                      <div className="relative mb-4">
                        {/* Glow behind logo */}
                        <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-2xl blur-xl transition-all duration-500" />
                        <img 
                          src={partner.logo} 
                          alt={partner.name}
                          className="relative h-16 md:h-20 w-auto mx-auto object-contain opacity-50 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-500"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      </div>
                    ) : null}
                    
                    {/* Fallback Avatar */}
                    <div className={`${partner.logo ? 'hidden' : 'flex'} w-16 h-16 mx-auto mb-4 rounded-2xl glass items-center justify-center group-hover:border-emerald-400/30 group-hover:scale-110 transition-all duration-300`}>
                      <span className="text-2xl font-bold text-emerald-400">
                        {partner.name?.charAt(0) || 'P'}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-white text-sm mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                      {partner.name}
                    </h3>

                    {/* Description */}
                    {partner.description && (
                      <p className="text-xs text-white/40 line-clamp-2 mb-3 leading-relaxed">
                        {partner.description}
                      </p>
                    )}

                    {/* Website Link */}
                    {partner.website_url && (
                      <a 
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
                      >
                        Visit website
                        <svg className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="text-5xl mb-4 opacity-40">🤝</div>
            <h3 className="text-xl font-bold text-white mb-2">No partners yet</h3>
            <p className="text-white/40">
              We're building our partner network. Check back soon!
            </p>
          </motion.div>
        )}

        {/* ============ BECOME A PARTNER CTA ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 md:p-10 mt-14 text-center relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-400/5 rounded-full blur-[100px] group-hover:bg-emerald-400/10 transition-all duration-500" />
          
          <div className="relative z-10">
            <motion.div 
              className="text-5xl mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🚀
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Become a Partner
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">
              Interested in collaborating with us? Let's create something great together.
            </p>
            <Link 
              to="/contact" 
              className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="relative z-10">Contact Us</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PartnersPage