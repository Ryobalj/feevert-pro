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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-16 md:py-24"
    >
      <div className="container-main">
        {/* ============ PAGE HEADER ============ */}
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
            <span className="text-sm font-medium text-white/80">Our Story</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            About <span className="gradient-text">FeeVert</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            {about?.title || 'Learn more about our mission, vision, and values'}
          </p>
        </motion.div>

        {/* ============ MAIN CONTENT ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-4xl mx-auto"
        >
          {/* Description Card */}
          <div className="glass-card p-8 md:p-10 mb-12">
            {/* Decorative top line */}
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-transparent rounded-full mb-8" />
            
            <p className="text-lg md:text-xl leading-relaxed text-white/70">
              {about?.description || 'FeeVert Solution Limited is a professional consultancy firm dedicated to providing high-quality services in Agriculture, Environment, and Occupational Health & Safety across Tanzania.'}
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Mission */}
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-green-600 group-hover:w-2 transition-all duration-300" />
              <div className="p-6 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    🎯
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                    Our Mission
                  </h3>
                </div>
                <p className="text-white/60 leading-relaxed">
                  {about?.mission || 'To empower businesses and communities through expert consultancy that drives sustainable growth and environmental stewardship.'}
                </p>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              whileHover={{ y: -6 }}
              className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-600 group-hover:w-2 transition-all duration-300" />
              <div className="p-6 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    👁️
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                    Our Vision
                  </h3>
                </div>
                <p className="text-white/60 leading-relaxed">
                  {about?.vision || "To be Tanzania's most trusted consultancy partner, recognized for excellence in agricultural innovation, environmental protection, and workplace safety."}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Core Values */}
          {about?.core_values && Array.isArray(about.core_values) && about.core_values.length > 0 && (
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Our Core <span className="gradient-text">Values</span>
                </h3>
                <div className="h-0.5 w-16 bg-emerald-400/30 mx-auto rounded-full" />
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {about.core_values.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="glass-card text-center group hover:border-emerald-400/20 transition-all duration-300"
                  >
                    <div className="p-5">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                        {value.icon || '💎'}
                      </div>
                      <h4 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                        {value.title}
                      </h4>
                      <p className="text-sm text-white/40 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {about?.stats && Array.isArray(about.stats) && about.stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 mb-12"
            >
              <h3 className="text-xl font-bold text-white text-center mb-8">
                Our Impact in Numbers
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {about.stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.05 }}
                    className="p-4"
                  >
                    <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">
                      {stat.number || '0'}+
                    </div>
                    <div className="text-sm text-white/40 font-medium">
                      {stat.label || 'Stat'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Why Choose Us */}
          {about?.why_choose_us && Array.isArray(about.why_choose_us) && about.why_choose_us.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Why Choose <span className="gradient-text">FeeVert</span>?
                </h2>
                <div className="h-0.5 w-16 bg-emerald-400/30 mx-auto rounded-full" />
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {about.why_choose_us.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -6 }}
                    className="glass-card text-center group hover:border-emerald-400/30 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                        {item.icon || '✅'}
                      </div>
                      <h4 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                        {item.title || 'Feature'}
                      </h4>
                      <p className="text-sm text-white/40 leading-relaxed">
                        {item.description || 'Description'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AboutPage