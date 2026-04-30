import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader' // ✅ ADDED

const LandingPage = () => {
  const [heroes, setHeroes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [settings, setSettings] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)
  
  const { darkMode } = useTheme()

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
        
        const heroData = extractData(heroRes).filter(h => h.is_active)
        setHeroes(heroData.length > 0 ? heroData : [null])
        setSettings(extractData(settingsRes)[0] || null)
      } catch (error) {
        console.error('Error loading landing data:', error)
        setHeroes([null])
        setSettings(null)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const heroesWithBg = heroes.filter(h => h?.background_image_url)
  const hasSlideshow = heroesWithBg.length > 1

  useEffect(() => {
    if (!hasSlideshow || isPaused) return
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroesWithBg.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [hasSlideshow, isPaused, heroesWithBg.length])

  const currentHero = hasSlideshow ? heroesWithBg[currentIndex] : heroes[0]

  const handleMouseEnter = () => hasSlideshow && setIsPaused(true)
  const handleMouseLeave = () => hasSlideshow && setIsPaused(false)
  const goToSlide = (index) => setCurrentIndex(index)

  // ✅ ONLY CHANGE: Modern loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d3320]">
        <Loader variant="morph" size="lg" text="Loading" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ============ BACKGROUND LAYER ============ */}
      {currentHero?.background_image_url ? (
        /* Slideshow with images */
        <AnimatePresence mode="wait">
          <motion.div
            key={hasSlideshow ? currentIndex : 'static'}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={currentHero.background_image_url}
              alt={currentHero.title || 'FeeVert'}
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"
              style={{ opacity: currentHero?.background_overlay || 0.5 }}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Jungle Green with animations */
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]" />
          
          {/* Large Glow Orbs */}
          <motion.div 
            className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-emerald-500/15 rounded-full blur-[150px]"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-[130px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-300/8 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Floating particles */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400/40 rounded-full blur-[2px]"
            animate={{ y: [0, -40, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-green-300/50 rounded-full blur-[2px]"
            animate={{ y: [0, -35, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/4 w-2 h-2 bg-teal-300/40 rounded-full blur-[2px]"
            animate={{ y: [0, -30, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
      )}

      {/* ============ CONTENT ============ */}
      <div className="container-main relative z-10 py-12 flex flex-col items-center justify-center min-h-screen text-center">
        {/* Logo with Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="mb-8 relative"
        >
          {/* Logo glow ring */}
          {!currentHero?.background_image_url && (
            <motion.div 
              className="absolute -inset-8 bg-emerald-400/15 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          
          {!imgError ? (
            <img 
              src="/logo-2520.png" 
              alt="FeeVert"
              className="relative w-44 md:w-56 lg:w-72 h-auto object-contain mx-auto drop-shadow-2xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={`relative text-4xl md:text-5xl lg:text-6xl font-bold ${currentHero?.background_image_url ? 'text-white' : 'gradient-text'} drop-shadow-lg`}>
              FeeVert
            </span>
          )}
        </motion.div>

        {/* Glass Badge */}
        {!currentHero?.background_image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">
              {settings?.site_tagline || 'Tanzania\'s Trusted Consultancy'}
            </span>
          </motion.div>
        )}

        {/* Title & Tagline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hasSlideshow ? currentIndex : 'static'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold max-w-3xl mb-4 leading-tight text-white">
              {currentHero?.title || (
                <>Expert <span className="gradient-text">Consultancy</span> for a Sustainable Future</>
              )}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/60 leading-relaxed">
              {currentHero?.subtitle || settings?.site_tagline || 'Expert Consultancy for a Sustainable Future'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/home">
            <motion.button
              className="group relative bg-white text-[#0d3320] px-10 py-4 rounded-full font-bold text-lg shadow-2xl shadow-black/20 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {currentHero?.cta_text || 'Get Started'}
                <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
          </Link>
          <Link to="/services">
            <motion.button
              className="group relative border-2 border-white/40 text-white px-10 py-4 rounded-full font-bold text-lg backdrop-blur-sm overflow-hidden"
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.8)' }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                View Services
                <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Slide Indicators */}
        {hasSlideshow && (
          <div className="flex gap-2 mt-12">
            {heroesWithBg.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white h-2.5 w-8 shadow-lg shadow-white/30' 
                    : 'bg-white/30 hover:bg-white/60 h-2.5 w-2.5'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-12"
        >
          {['ISO Certified', '5+ Years Experience', '48+ Clients'].map((text, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-3 text-white/60 text-sm font-medium group cursor-default"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center group-hover:bg-emerald-400/40 transition-colors">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="group-hover:text-white/90 transition-colors">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs uppercase tracking-wider text-white/40 group-hover:text-white/70 transition-colors">
            Scroll
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center group-hover:border-white/40 transition-colors">
            <motion.div
              className="w-1.5 h-3 bg-emerald-400 rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LandingPage