// src/features/home/components/LandingPage.jsx

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

const LandingPage = () => {
  const [heroes, setHeroes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [settings, setSettings] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [transitionType, setTransitionType] = useState('fade')
  const intervalRef = useRef(null)
  
  const { darkMode, currentTheme } = useTheme()

  // ✅ Random transition types
  const transitions = [
    'fade',
    'slide-left',
    'slide-right',
    'slide-up',
    'slide-down',
    'zoom-in',
    'zoom-out',
    'flip',
    'rotate',
    'blur',
  ]

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
        
        const heroData = extractData(heroRes).filter(h => h.is_active !== false)
        
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

  const hasSlideshow = heroes.length > 1

  // ✅ Auto-slide with random transitions
  useEffect(() => {
    if (!hasSlideshow) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    
    intervalRef.current = setInterval(() => {
      const randomTransition = transitions[Math.floor(Math.random() * transitions.length)]
      setTransitionType(randomTransition)
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroes.length)
      }, 100)
      
    }, 8000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasSlideshow, heroes.length])

  const currentHero = heroes[currentIndex] || heroes[0]
  const hasImage = currentHero?.background_image_url && currentHero.background_image_url.length > 0

  // ✅ Only pause slideshow, NOT transitions
  const handleMouseEnter = () => {
    setIsHovering(true)
    setIsPaused(true)
  }
  
  const handleMouseLeave = () => {
    setIsHovering(false)
    setIsPaused(false)
  }
  
  const goToSlide = (index) => {
    const randomTransition = transitions[Math.floor(Math.random() * transitions.length)]
    setTransitionType(randomTransition)
    setCurrentIndex(index)
  }

  // ✅ Get transition duration based on hover state
  const getTransitionDuration = () => {
    return isHovering ? 4.0 : 2.5
  }

  // ✅ Get transition variants based on type
  const getTransitionVariants = () => {
    const duration = getTransitionDuration()
    
    switch(transitionType) {
      case 'slide-left':
        return {
          initial: { opacity: 0.3, x: '100%', scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0.3, x: '-100%', scale: 0.95 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'slide-right':
        return {
          initial: { opacity: 0.3, x: '-100%', scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0.3, x: '100%', scale: 0.95 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'slide-up':
        return {
          initial: { opacity: 0.3, y: '100%', scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0.3, y: '-100%', scale: 0.95 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'slide-down':
        return {
          initial: { opacity: 0.3, y: '-100%', scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0.3, y: '100%', scale: 0.95 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'zoom-in':
        return {
          initial: { opacity: 0, scale: 1.4 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'zoom-out':
        return {
          initial: { opacity: 0, scale: 0.6 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.4 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'flip':
        return {
          initial: { opacity: 0.3, rotateY: 90, scale: 0.8 },
          animate: { opacity: 1, rotateY: 0, scale: 1 },
          exit: { opacity: 0.3, rotateY: -90, scale: 0.8 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'rotate':
        return {
          initial: { opacity: 0.3, rotate: -15, scale: 0.9 },
          animate: { opacity: 1, rotate: 0, scale: 1 },
          exit: { opacity: 0.3, rotate: 15, scale: 0.9 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'blur':
        return {
          initial: { opacity: 0, filter: 'blur(20px)', scale: 1.05 },
          animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
          exit: { opacity: 0, filter: 'blur(20px)', scale: 1.05 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] }
        }
    }
  }

  // ✅ Get text color based on background image
  const getHeaderColor = () => {
    // Kama ni Brand Theme (darkMode = false, hakuna image)
    const isBrandTheme = !darkMode && !hasImage && currentTheme === 'brand'
    
    if (isBrandTheme) {
      return 'text-[#f5f0e8]'
    }
    
    if (!hasImage) {
      return darkMode ? 'text-emerald-400' : 'text-[#0d5c3e]'
    }
    const overlay = currentHero?.background_overlay || 0.5
    if (overlay > 0.4) {
      return 'text-white'
    }
    return 'text-[#0d5c3e]'
  }

  // ✅ Get subtitle color
  const getSubtitleColor = () => {
    const isBrandTheme = !darkMode && !hasImage && currentTheme === 'brand'
    
    if (isBrandTheme) {
      return 'text-[#f5f0e8]/70'
    }
    
    if (!hasImage) {
      return darkMode ? 'text-white/70' : 'text-black/70'
    }
    const overlay = currentHero?.background_overlay || 0.5
    if (overlay > 0.4) {
      return 'text-white/70'
    }
    return 'text-black/70'
  }

  // ✅ Get badge color
  const getBadgeColor = () => {
    const isBrandTheme = !darkMode && !hasImage && currentTheme === 'brand'
    
    if (isBrandTheme) {
      return 'text-[#f5f0e8]/80'
    }
    
    if (!hasImage) {
      return darkMode ? 'text-white/80' : 'text-black/80'
    }
    const overlay = currentHero?.background_overlay || 0.5
    if (overlay > 0.4) {
      return 'text-white/80'
    }
    return 'text-black/80'
  }

  // ✅ Get primary button styles - INATEGEMEA THEME
  const getPrimaryButtonStyles = () => {
    // Kama ni Brand Theme
    const isBrandTheme = currentTheme === 'brand' && !darkMode && !hasImage
    
    // 1. KAMA NI BRAND THEME - BUTTON YA DARK GREEN
    if (isBrandTheme) {
      return 'bg-[#0d5c3e] text-[#f5f0e8] hover:bg-[#1a7a54] hover:text-white border-2 border-[#f5f0e8]/20'
    }
    
    // 2. KAMA NI DARK THEME - BUTTON YA DARK GREEN (sawa na brand)
    if (darkMode) {
      return 'bg-[#0d5c3e] text-[#e8e8e8] hover:bg-[#1a7a54] hover:text-white border-2 border-[#34d399]/20'
    }
    
    // 3. KAMA NI IMAGE OVERLAY > 0.4 - BUTTON NYEUPE
    if (hasImage && currentHero?.background_overlay > 0.4) {
      return 'bg-white text-[#0d3320] hover:bg-emerald-400/90 hover:text-[#0d3320]'
    }
    
    // 4. DEFAULT - WHITE THEME
    return 'bg-[#0d5c3e] text-white hover:bg-[#1a7a54] hover:text-white'
  }

  // ✅ Get secondary button styles - INATEGEMEA THEME
  const getSecondaryButtonStyles = () => {
    const isBrandTheme = currentTheme === 'brand' && !darkMode && !hasImage
    
    // 1. KAMA NI BRAND THEME
    if (isBrandTheme) {
      return 'border-[#f5f0e8]/40 text-[#f5f0e8] hover:border-[#f5f0e8] hover:bg-[#f5f0e8]/10 hover:text-white'
    }
    
    // 2. KAMA NI DARK THEME
    if (darkMode) {
      return 'border-[#34d399]/40 text-[#34d399] hover:border-[#34d399] hover:bg-[#34d399]/10 hover:text-white'
    }
    
    // 3. KAMA NI IMAGE OVERLAY > 0.4
    if (hasImage && currentHero?.background_overlay > 0.4) {
      return 'border-white/50 text-white hover:border-white hover:bg-white/10 hover:text-white'
    }
    
    // 4. DEFAULT - WHITE THEME
    return 'border-[#0d5c3e]/40 text-[#0d5c3e] hover:border-[#0d5c3e] hover:bg-[#0d5c3e]/10 hover:text-[#0d5c3e]'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d3320]">
        <Loader variant="morph" size="lg" text="Loading" />
      </div>
    )
  }

  const variants = getTransitionVariants()
  const headerColor = getHeaderColor()
  const subtitleColor = getSubtitleColor()
  const badgeColor = getBadgeColor()
  const primaryBtnStyles = getPrimaryButtonStyles()
  const secondaryBtnStyles = getSecondaryButtonStyles()

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
      {hasImage ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={hasSlideshow ? currentIndex : 'static'}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            className="absolute inset-0 z-0"
          >
            <img 
              src={currentHero.background_image_url}
              alt={currentHero.title || 'FeeVert'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `
                  <div class="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]"></div>
                `
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, 
                  rgba(0,0,0,${currentHero?.background_overlay || 0.5}) 0%, 
                  rgba(0,0,0,${(currentHero?.background_overlay || 0.5) * 0.6}) 40%, 
                  rgba(0,0,0,${(currentHero?.background_overlay || 0.5) * 0.7}) 70%, 
                  rgba(0,0,0,${(currentHero?.background_overlay || 0.5) * 1.2}) 100%
                )`,
                opacity: 1,
              }}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]" />
          
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

          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
      )}

      {/* ============ CONTENT ============ */}
      <div className="container-main relative z-10 py-12 flex flex-col items-center justify-center min-h-screen text-center px-4">
        
        {/* Logo */}
        {!hasImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="mb-6 relative"
          >
            <motion.div 
              className="absolute -inset-8 bg-emerald-400/15 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {!imgError ? (
              <img 
                src="/logo-2520.png" 
                alt="FeeVert"
                className="relative w-32 md:w-40 lg:w-52 h-auto object-contain mx-auto drop-shadow-2xl"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className={`relative text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg ${headerColor}`}>
                FeeVert
              </span>
            )}
          </motion.div>
        )}

        {/* Glass Badge */}
        {(!hasImage || !currentHero?.title) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-4"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className={`text-sm font-medium ${badgeColor}`}>
              {settings?.site_tagline || "Tanzania's Trusted Consultancy"}
            </span>
          </motion.div>
        )}

        {/* ============ HEADER - UPPERCASE ============ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hasSlideshow ? currentIndex : 'static'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-4"
          >
            <h1 className={`text-3xl md:text-5xl lg:text-7xl font-extrabold max-w-4xl leading-tight drop-shadow-lg uppercase ${headerColor}`}>
              {currentHero?.title || (
                <>EXPERT <span className="gradient-text">CONSULTANCY</span> FOR A SUSTAINABLE FUTURE</>
              )}
            </h1>
          </motion.div>
        </AnimatePresence>

        {/* ============ SUBTITLE ============ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hasSlideshow ? currentIndex + '-sub' : 'static-sub'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mb-8"
          >
            <p className={`text-base md:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow ${subtitleColor}`}>
              {currentHero?.subtitle || settings?.site_tagline || 'Expert Consultancy for a Sustainable Future'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ============ CTA BUTTONS - FIXED ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Primary Button - Always visible */}
          <Link to={currentHero?.cta_link || '/home'}>
            <motion.button
              className={`group relative px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-2xl shadow-black/20 overflow-hidden transition-all duration-300 ${primaryBtnStyles}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ pointerEvents: 'none' }}
              />
              <span className="relative z-10 flex items-center gap-2 uppercase">
                {currentHero?.cta_text || 'Get Started'}
                <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
          </Link>

          {/* Secondary Button - Always visible */}
          <Link to="/services">
            <motion.button
              className={`group relative px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg backdrop-blur-sm overflow-hidden transition-all duration-300 border-2 ${secondaryBtnStyles}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              <span className="relative z-10 flex items-center gap-2 uppercase">
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
          <div className="flex gap-2 mt-10">
            {heroes.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white h-3 w-8 shadow-lg shadow-white/30' 
                    : 'bg-white/30 hover:bg-white/60 h-3 w-3'
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
          className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-10"
        >
          {['ISO Certified', '5+ Years Experience', '48+ Clients'].map((text, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className={`flex items-center gap-2 text-xs md:text-sm font-medium group cursor-default ${subtitleColor}`}
            >
              <span className="text-emerald-400">✅</span>
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
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors">
            Scroll
          </span>
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center group-hover:border-white/40 transition-colors">
            <motion.div
              className="w-1 h-2.5 bg-emerald-400 rounded-full mt-2"
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