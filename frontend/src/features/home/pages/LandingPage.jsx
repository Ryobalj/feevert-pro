// src/features/home/components/LandingPage.jsx

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'
import useAutoRefresh from '../../../app/useAutoRefresh'

const LandingPage = () => {
  // Refetches when the tab comes back to the front, and on a slow timer —
  // otherwise a page left open keeps showing yesterday's content.
  const refresh = useAutoRefresh()
  const { t } = useTranslation('home')
  const [heroes, setHeroes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [settings, setSettings] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef(null)

  // ✅ Get theme but IGNORE it - Force dark mode for landing page
  const { currentTheme } = useTheme()
  // Force dark mode - always use dark theme colors
  const darkMode = true
  const isDark = true

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
  }, [refresh])

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
      setCurrentIndex((prev) => (prev + 1) % heroes.length)
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
    setCurrentIndex(index)
  }

  // ✅ Soft, slow crossfade for hero background images (no dramatic
  // slide/flip/rotate/zoom - just a gentle dissolve with a subtle
  // Ken Burns-style scale so transitions never feel abrupt).
  const getTransitionVariants = () => {
    const duration = isHovering ? 3.5 : 2.2
    return {
      initial: { opacity: 0, scale: 1.04 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1 },
      transition: { duration, ease: 'easeInOut' }
    }
  }

  // ✅ FORCE WHITE TEXT - Always use white text regardless of theme
  const getHeaderColor = () => {
    return 'text-white'
  }

  const getSubtitleColor = () => {
    return 'text-white/70'
  }

  const getBadgeColor = () => {
    return 'text-white/80'
  }

  // ✅ FORCE DARK MODE BUTTON STYLES - Always dark theme
  const getPrimaryButtonStyles = () => {
    // Kama kuna image na overlay kubwa - button nyeupe
    if (hasImage && currentHero?.background_overlay > 0.4) {
      return 'bg-white text-[#0d3320] hover:bg-emerald-400/90 hover:text-[#0d3320]'
    }
    // DARK MODE BUTTON - Always this style
    return 'bg-[#0d5c3e] text-white hover:bg-[#1a7a54] hover:text-white border-2 border-[#34d399]/20'
  }

  // ✅ FORCE DARK MODE SECONDARY BUTTON STYLES
  const getSecondaryButtonStyles = () => {
    if (hasImage && currentHero?.background_overlay > 0.4) {
      return 'border-white/50 text-white hover:border-white hover:bg-white/10 hover:text-white'
    }
    // DARK MODE SECONDARY BUTTON - Always this style
    return 'border-[#34d399]/40 text-[#34d399] hover:border-[#34d399] hover:bg-[#34d399]/10 hover:text-white'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d3320]">
        <Loader variant="morph" size="lg" text={t('home.loading') || 'Loading'} />
      </div>
    )
  }

  const variants = getTransitionVariants()
  const headerColor = getHeaderColor()
  const subtitleColor = getSubtitleColor()
  const badgeColor = getBadgeColor()
  const primaryBtnStyles = getPrimaryButtonStyles()
  const secondaryBtnStyles = getSecondaryButtonStyles()

  // Trust indicators data with translation keys
  const trustIndicators = [
    { key: 'hero.trust.experience' },
    { key: 'hero.trust.clients' }
  ]

  return (
    <>
      {/* ✅ BACKGROUND FIXED - BRIGHT with glow, not pure black */}
      <div className="fixed inset-0 z-0 bg-[#0d3320]">
        {hasImage ? (
          <AnimatePresence>
            <motion.div
              key={hasSlideshow ? currentIndex : 'static'}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              className="absolute inset-0 w-full h-full"
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
          <div className="absolute inset-0 w-full h-full">
            {/* ✅ Bright gradient - not too dark */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]" />
            
            {/* ✅ Glow effects - bright */}
            <motion.div 
              className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-emerald-500/20 rounded-full blur-[150px]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-green-400/15 rounded-full blur-[130px]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-300/10 rounded-full blur-[100px]"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />

            {/* ✅ Floating particles - bright */}
            <motion.div 
              className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400/50 rounded-full blur-[2px]"
              animate={{ y: [0, -40, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-green-300/60 rounded-full blur-[2px]"
              animate={{ y: [0, -35, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div 
              className="absolute top-1/3 right-1/4 w-2 h-2 bg-teal-300/50 rounded-full blur-[2px]"
              animate={{ y: [0, -30, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* ✅ Grid pattern - subtle */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
        )}
      </div>

      {/* ✅ CONTENT - Scrollable on top of fixed background with landing-page class */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="landing-page relative z-10 min-h-screen flex flex-col items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container-main relative z-10 py-12 flex flex-col items-center justify-center min-h-screen text-center px-4">
          
          {/* Logo */}
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

          {/* Glass Badge */}
          {(!hasImage || !currentHero?.title) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-4 bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <motion.span 
                className="w-2 h-2 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className={`text-sm font-medium ${badgeColor}`}>
                {settings?.site_tagline || t('hero.badge') || "Tanzania's Trusted Consultancy"}
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
                  <>{t('hero.title_part1') || 'EXPERT'} <span className="text-emerald-400">{t('hero.title_part2') || 'CONSULTANCY'}</span> {t('hero.title_part3') || 'FOR A SUSTAINABLE FUTURE'}</>
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
                {currentHero?.subtitle || settings?.site_tagline || t('hero.subtitle') || 'Expert Consultancy for a Sustainable Future'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ============ CTA BUTTONS ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Primary Button */}
            <Link to={currentHero?.cta_link || '/home'}>
              <motion.button
                className={`group relative px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 ${primaryBtnStyles}`}
                // ✅ REMOVE hover scale effect - just keep tap
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ pointerEvents: 'none' }}
                />
                <span className="relative z-10 flex items-center gap-2 uppercase">
                  {currentHero?.cta_text || t('hero.cta_primary') || 'Get Started'}
                  <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
              </motion.button>
            </Link>

          </motion.div>

          {/* Slide Indicators - Dark mode style */}
          {hasSlideshow && (
            <div className="flex gap-2 mt-10">
              {heroes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-emerald-400 h-3 w-8 shadow-lg shadow-emerald-400/30' 
                      : 'bg-white/20 hover:bg-white/40 h-3 w-3'
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
            {trustIndicators.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className={`flex items-center gap-2 text-xs md:text-sm font-medium group cursor-default ${subtitleColor}`}
              >
                <span className="text-emerald-400">✅</span>
                <span className="group-hover:text-white transition-colors">
                  {t(item.key)}
                </span>
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
            <span className="text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
              {t('hero.scroll') || 'Scroll'}
            </span>
            <div className="w-5 h-8 rounded-full border-2 border-white/15 flex justify-center group-hover:border-white/30 transition-colors">
              <motion.div
                className="w-1 h-2.5 bg-emerald-400 rounded-full mt-2"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  )
}

export default LandingPage