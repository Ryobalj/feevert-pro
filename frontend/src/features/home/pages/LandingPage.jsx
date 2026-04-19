import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const LandingPage = () => {
  const [hero, setHero] = useState(null)
  const [settings, setSettings] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const { darkMode } = useTheme()
  const { scrollY } = useScroll()
  const containerRef = useRef(null)
  
  const logoOpacity = useTransform(scrollY, [0, 300], [1, 0.3])
  const logoScale = useTransform(scrollY, [0, 300], [1, 0.9])
  const logoY = useTransform(scrollY, [0, 300], [0, -50])
  const taglineOpacity = useTransform(scrollY, [0, 200], [1, 0])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [heroRes, settingsRes] = await Promise.all([
          api.get('/hero-sections/'),
          api.get('/site-settings/')
        ])
        
        const extractData = (res) => {
          if (res.data?.results) return res.data.results
          if (Array.isArray(res.data)) return res.data
          return []
        }
        
        setHero(extractData(heroRes)[0] || null)
        setSettings(extractData(settingsRes)[0] || null)
      } catch (error) {
        console.error('Error loading landing data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-green-50'}`}>
        <motion.div 
          className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen flex flex-col items-center justify-center overflow-hidden relative transition-colors duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'
      }`}
      ref={containerRef}
    >
      {/* Animated Grid Pattern */}
      <div className={`absolute inset-0 animated-grid ${
        darkMode ? 'opacity-10' : 'opacity-20'
      }`}></div>
      
      {/* Large Glow Orbs - Green Theme */}
      <motion.div 
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-green-500 rounded-full opacity-20 blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: darkMode ? [0.15, 0.25, 0.15] : [0.2, 0.3, 0.2],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-emerald-500 rounded-full opacity-20 blur-[130px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: darkMode ? [0.15, 0.2, 0.15] : [0.15, 0.25, 0.15],
          x: [0, -60, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-400 rounded-full opacity-15 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: darkMode ? [0.1, 0.18, 0.1] : [0.12, 0.2, 0.12],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      
      {/* Small Accent Orbs */}
      <motion.div 
        className="absolute top-1/4 right-1/4 w-32 h-32 bg-green-300 rounded-full opacity-30 blur-[50px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: darkMode ? [0.2, 0.35, 0.2] : [0.25, 0.4, 0.25],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />
      
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-teal-400 rounded-full opacity-25 blur-[60px]"
        animate={{
          scale: [1, 1.25, 1],
          opacity: darkMode ? [0.15, 0.3, 0.15] : [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      <div className="container-main relative z-10 py-12 flex flex-col items-center justify-center min-h-screen">
        {/* Logo with Glow Ring */}
        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale, y: logoY }}
          className="mb-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="relative"
          >
            {/* Pulsing Glow Ring */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-2xl ${
                darkMode ? 'bg-green-500 opacity-30' : 'bg-green-400 opacity-40'
              }`}
              style={{ transform: 'scale(1.3)' }}
              animate={{
                boxShadow: darkMode 
                  ? [
                      '0 0 40px 10px rgba(34, 197, 94, 0.3)',
                      '0 0 80px 20px rgba(34, 197, 94, 0.5)',
                      '0 0 40px 10px rgba(34, 197, 94, 0.3)'
                    ]
                  : [
                      '0 0 40px 10px rgba(45, 106, 79, 0.2)',
                      '0 0 80px 20px rgba(45, 106, 79, 0.4)',
                      '0 0 40px 10px rgba(45, 106, 79, 0.2)'
                    ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Secondary Glow Ring */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-3xl ${
                darkMode ? 'bg-emerald-400 opacity-20' : 'bg-emerald-300 opacity-30'
              }`}
              style={{ transform: 'scale(1.6)' }}
              animate={{
                boxShadow: darkMode 
                  ? [
                      '0 0 60px 15px rgba(16, 185, 129, 0.2)',
                      '0 0 100px 30px rgba(16, 185, 129, 0.35)',
                      '0 0 60px 15px rgba(16, 185, 129, 0.2)'
                    ]
                  : [
                      '0 0 60px 15px rgba(45, 106, 79, 0.15)',
                      '0 0 100px 30px rgba(45, 106, 79, 0.3)',
                      '0 0 60px 15px rgba(45, 106, 79, 0.15)'
                    ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            {!imgError ? (
              <motion.img 
                src="/logo-2520.png" 
                alt="FeeVert Solution Limited"
                className="w-56 md:w-80 lg:w-96 h-auto object-contain mx-auto relative z-10 drop-shadow-2xl"
                onError={() => setImgError(true)}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            ) : (
              <motion.span 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold gradient-text relative z-10 ${
                  darkMode ? 'drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'drop-shadow-[0_0_30px_rgba(45,106,79,0.3)]'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                FeeVert
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          style={{ opacity: taglineOpacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-10"
        >
          <motion.p
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`text-lg md:text-xl lg:text-2xl text-center max-w-2xl px-4 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {hero?.subtitle || settings?.site_tagline || 'Expert Consultancy for a Sustainable Future'}
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/home">
            <motion.button
              className={`glow-button text-lg px-10 py-4 relative overflow-hidden group ${
                darkMode ? 'shadow-[0_0_30px_rgba(34,197,94,0.4)]' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center">
                Get Started
                <motion.span 
                  className="ml-2 inline-block"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              />
            </motion.button>
          </Link>
          <Link to="/services">
            <motion.button
              className={`outline-button text-lg px-10 py-4 relative overflow-hidden group ${
                darkMode ? 'border-gray-600 text-gray-300 hover:border-green-500 hover:text-green-400' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">View Services</span>
              <motion.div
                className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
              />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12"
        >
          {[
            { text: 'ISO Certified', delay: 0 },
            { text: '5+ Years Experience', delay: 0.1 },
            { text: '48+ Clients', delay: 0.2 }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + item.delay }}
              whileHover={{ scale: 1.1 }}
              className={`flex items-center gap-2 text-sm cursor-default ${
                darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
              } transition-colors`}
            >
              <motion.span 
                className="w-1.5 h-1.5 bg-green-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <motion.span 
              className={`text-xs uppercase tracking-wider transition-colors ${
                darkMode 
                  ? 'text-gray-500 group-hover:text-green-400' 
                  : 'text-gray-500 group-hover:text-green-700'
              }`}
              whileHover={{ y: -2 }}
            >
              Scroll
            </motion.span>
            <div className={`w-5 h-8 rounded-full border-2 flex justify-center transition-colors ${
              darkMode 
                ? 'border-gray-600 group-hover:border-green-500' 
                : 'border-gray-300 group-hover:border-green-600'
            }`}>
              <motion.div
                className="w-1 h-1.5 bg-green-600 rounded-full mt-1.5"
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default LandingPage
