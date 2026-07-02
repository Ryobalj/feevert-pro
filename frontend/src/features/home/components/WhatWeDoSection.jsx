// src/features/home/components/WhatWeDoSection.jsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/ui/Icon'

const WhatWeDoSection = ({ data }) => {
  const { t } = useTranslation('home')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentRelatedIndex, setCurrentRelatedIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [direction, setDirection] = useState(1)
  const [mainImageFailed, setMainImageFailed] = useState(false)
  const [relatedImageFailed, setRelatedImageFailed] = useState(false)

  const slides = data?.slides || []
  const hasSlides = slides.length > 0
  const currentSlideData = slides[currentSlide] || {}
  // The main image is the whole-section background for this record's turn -
  // it does not change until the record itself changes.
  const mainImage = currentSlideData.image || null
  // Related images cycle inside the smaller slide box, each with its own
  // title/caption. Records with no related images just show the main image
  // there too, captioned with the record's own title/subtitle.
  const relatedImages = currentSlideData.related_images || []
  const currentRelated = relatedImages[currentRelatedIndex] || null
  const innerImage = currentRelated?.image || mainImage
  const innerTitle = currentRelated?.title || currentSlideData.title
  const innerCaption = currentRelated?.caption || currentSlideData.subtitle

  // Auto-advance between records
  useEffect(() => {
    if (!hasSlides || isHovering) return
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, data?.slide_interval || 15000)
    return () => clearInterval(interval)
  }, [slides.length, hasSlides, isHovering, data?.slide_interval])

  // Reset the related-image cycle whenever the active record changes
  useEffect(() => {
    setCurrentRelatedIndex(0)
  }, [currentSlide])

  // Reset the broken-image fallbacks whenever the shown image changes
  useEffect(() => {
    setMainImageFailed(false)
  }, [mainImage])

  useEffect(() => {
    setRelatedImageFailed(false)
  }, [innerImage])

  // Mini-slideshow through the current record's own related images
  useEffect(() => {
    if (relatedImages.length <= 1 || isHovering) return
    const interval = setInterval(() => {
      setCurrentRelatedIndex((prev) => (prev + 1) % relatedImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [relatedImages.length, isHovering, currentSlide])

  // If no data, don't render
  if (!data?.has_data) return null

  // Each slide carries its own header text + services - the whole section
  // (badge, title, description, services grid) switches together with the slide.
  const headerData = hasSlides ? currentSlideData : (data || {})
  const services = (hasSlides ? currentSlideData.services : data?.services) || []
  const hasServices = services.length > 0

  // Slide transition variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  }
  
  return (
    <section className="dark-surface py-20 md:py-28 relative overflow-hidden">
      {/* ============ BACKGROUND IMAGE WITH OVERLAY ============ */}
      <div className="absolute inset-0 z-0">
        {/* Background Image */}
        {mainImage && !mainImageFailed ? (
          <img
            key={currentSlide}
            src={mainImage}
            alt="Background"
            className="w-full h-full object-cover"
            onError={() => setMainImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]" />
        )}
        
        {/* Transparent Overlay - Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19]/80 via-[#0d3320]/70 to-[#104428]/80 backdrop-blur-sm" />
        
        {/* Overlay Gradient for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Animated glow effects - KWA MNG'AO ZAIDI */}
        <motion.div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-300/5 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
      </div>
      
      <div className="container-main relative z-10">
        
        {/* ============ HEADER (switches with the current slide) ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4 bg-black/30 backdrop-blur-md border border-white/20 shadow-lg shadow-black/20">
            <motion.span
              className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={hasSlides ? `badge-${currentSlide}` : 'badge-static'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xs font-bold text-white uppercase tracking-wider"
              >
                {headerData.subtitle || t('what_we_do.badge') || 'What We Do'}
              </motion.span>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.h2
              key={hasSlides ? `title-${currentSlide}` : 'title-static'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-2xl"
            >
              {headerData.title || t('what_we_do.title') || 'What We Do'}
            </motion.h2>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: '80px' }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="h-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mx-auto mt-4 shadow-lg shadow-emerald-500/20"
          />

          <AnimatePresence mode="wait">
            <motion.p
              key={hasSlides ? `desc-${currentSlide}` : 'desc-static'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mt-4 drop-shadow-lg"
            >
              {headerData.description || ''}
            </motion.p>
          </AnimatePresence>
        </motion.div>
        
        {/* ============ HERO SLIDES WITH GLASS EFFECT ============ */}
        {hasSlides && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden glass-card p-1 max-w-5xl mx-auto border border-white/20 shadow-2xl shadow-black/40 bg-white/5 backdrop-blur-md"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.25, 0.1, 0.25, 1],
                    type: "tween"
                  }}
                  className="absolute inset-0 w-full h-full"
                >
                  {innerImage && !relatedImageFailed && (
                    <AnimatePresence mode="sync">
                      <motion.img
                        key={innerImage}
                        src={innerImage}
                        alt={innerTitle || 'Slide'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => setRelatedImageFailed(true)}
                      />
                    </AnimatePresence>
                  )}

                  {/* Slide Overlay - Glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Slide Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                    {currentSlideData.icon && (
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-2 block drop-shadow-lg"
                      >
                        <Icon name={currentSlideData.icon} size="text-3xl md:text-4xl" />
                      </motion.span>
                    )}
                    <AnimatePresence mode="wait">
                      {innerTitle && (
                        <motion.h3
                          key={`inner-title-${currentSlide}-${currentRelatedIndex}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: 0.1 }}
                          className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-2xl"
                        >
                          {innerTitle}
                        </motion.h3>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {innerCaption && (
                        <motion.p
                          key={`inner-caption-${currentSlide}-${currentRelatedIndex}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: 0.15 }}
                          className="text-white/90 text-sm md:text-base max-w-xl drop-shadow-lg"
                        >
                          {innerCaption}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {currentSlideData.cta_text && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Link
                          to={currentSlideData.cta_link || '/services'}
                          className="inline-flex items-center gap-2 mt-4 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors group/link drop-shadow-lg"
                        >
                          {currentSlideData.cta_text}
                          <motion.svg 
                            className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </motion.svg>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Slide Indicators */}
              {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentSlide ? 1 : -1)
                        setCurrentSlide(i)
                      }}
                      className={`rounded-full transition-all duration-500 ${
                        i === currentSlide
                          ? 'bg-emerald-400 w-8 h-1.5 shadow-lg shadow-emerald-400/50'
                          : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Navigation Arrows */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setDirection(-1)
                      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/70 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-10 border border-white/10"
                    aria-label="Previous slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setDirection(1)
                      setCurrentSlide((prev) => (prev + 1) % slides.length)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/70 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-10 border border-white/10"
                    aria-label="Next slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Slide counter */}
              {slides.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white/90 z-10 border border-white/10">
                  {currentSlide + 1} / {slides.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* ============ SERVICES GRID ============ */}
        {hasServices && (
          <motion.div
            key={hasSlides ? `services-${currentSlide}` : 'services-static'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto"
          >
            {services.slice(0, 4).map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass-card p-4 text-center group hover:border-emerald-400/40 transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-black/20"
              >
                <motion.div
                  className="mb-2 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon name={service.icon} size="text-2xl md:text-3xl" />
                </motion.div>
                <h4 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors drop-shadow-md">
                  {service.title}
                </h4>
                <p className="text-white/60 text-xs mt-1 leading-relaxed line-clamp-2">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* ============ CTA (switches with the current slide) ============ */}
        {headerData.cta_text && (
          <motion.div
            key={hasSlides ? `cta-${currentSlide}` : 'cta-static'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <Link
              to={headerData.cta_link || '/services'}
              className="group relative inline-flex items-center gap-3 border-2 border-white/30 text-white px-8 py-3 rounded-full font-bold hover:border-emerald-400/60 transition-all duration-300 hover:bg-white/10 backdrop-blur-sm shadow-lg shadow-black/20"
            >
              {headerData.cta_text}
              <motion.svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default WhatWeDoSection