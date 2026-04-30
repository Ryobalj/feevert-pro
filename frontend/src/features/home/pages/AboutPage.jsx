import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

// ============ 🆕 IMAGE CAROUSEL (SAME AS HOMEPAGE) ============
const CardImage = ({ images, alt, heightClass = 'h-40' }) => {
  const [currentImage, setCurrentImage] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const [transitionType, setTransitionType] = React.useState('fade')

  const hasMultipleImages = images && images.length > 1
  const transitions = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom-in', 'zoom-out']

  const changeImage = React.useCallback((newIndex, transition = null) => {
    setTransitionType(transition || transitions[Math.floor(Math.random() * transitions.length)])
    setCurrentImage(newIndex)
  }, [])

  const goNext = React.useCallback(() => changeImage((currentImage + 1) % images.length), [currentImage, images?.length, changeImage])
  const goPrev = React.useCallback(() => changeImage((currentImage - 1 + images.length) % images.length), [currentImage, images?.length, changeImage])

  React.useEffect(() => {
    if (!isHovering && hasMultipleImages) {
      const interval = setInterval(goNext, 5000)
      return () => clearInterval(interval)
    }
  }, [isHovering, hasMultipleImages, goNext])

  const getTransitionClasses = (index) => {
    if (index === currentImage) return 'opacity-100 translate-x-0 translate-y-0 scale-100'
    switch (transitionType) {
      case 'slide-left': return 'opacity-0 translate-x-full'
      case 'slide-right': return 'opacity-0 -translate-x-full'
      case 'slide-up': return 'opacity-0 translate-y-full'
      case 'slide-down': return 'opacity-0 -translate-y-full'
      case 'zoom-in': return 'opacity-0 scale-125'
      case 'zoom-out': return 'opacity-0 scale-75'
      default: return 'opacity-0'
    }
  }

  if (!images || images.length === 0) return null

  return (
    <div className={`relative ${heightClass} overflow-hidden`} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      {images.map((img, index) => (
        <div key={index} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${getTransitionClasses(index)}`}>
          <img src={img} alt={alt || ''} className="w-full h-full object-cover group-hover:scale-105" style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }} loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 to-transparent pointer-events-none" />
      {hasMultipleImages && (
        <>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeImage(i) }} className={`rounded-full transition-all duration-500 ${i === currentImage ? 'bg-emerald-400 w-4 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/80'}`} />
            ))}
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev() }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 hover:bg-black/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext() }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 hover:bg-black/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  )
}

// ============ IMAGE COMPONENT (ORIGINAL) ============
const AboutImage = ({ src, alt, className = '' }) => {
  if (!src) return null
  
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={(e) => { e.target.style.display = 'none' }}
    />
  )
}

const AboutPage = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const res = await api.get('/about-sections/')
        const data = res.data?.results?.[0] || res.data?.[0] || null
        setAbout(data)
        setError(false)
      } catch (err) {
        console.error('Error loading about:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadAbout()
  }, [])

  // ✅ LOADER
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader variant="morph" size="lg" text="Loading" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to load content</h2>
          <p className="text-white/50 mb-6">Please check your connection and try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!about) return null

  const headerImages = []
  if (about.image_url) headerImages.push(about.image_url)
  if (about.image) {
    const url = typeof about.image === 'string' ? about.image : about.image.url || about.image
    if (url && !headerImages.includes(url)) headerImages.push(url)
  }

  const getCardImages = (item) => {
    const imgs = []
    if (!item) return imgs
    if (item.image) {
      const url = typeof item.image === 'string' ? item.image : item.image.url || item.image
      if (url) imgs.push(url)
    }
    if (item.image_url) imgs.push(item.image_url)
    return imgs
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
          {about.title && (
            <p className="text-lg text-white/50 max-w-2xl mx-auto">{about.title}</p>
          )}
        </motion.div>

        {/* ============ FEATURED IMAGE ============ */}
        {headerImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden glass-card !p-0">
              {headerImages.length > 1 ? (
                <CardImage images={headerImages} alt="About FeeVert" heightClass="h-full" />
              ) : (
                <>
                  <AboutImage src={headerImages[0]} alt="About FeeVert" className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ============ MAIN CONTENT ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-4xl mx-auto"
        >
          {/* Description */}
          {about.description && (
            <div className="glass-card p-8 md:p-10 mb-12">
              <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-transparent rounded-full mb-8" />
              <p className="text-lg md:text-xl leading-relaxed text-white/70">{about.description}</p>
            </div>
          )}

          {/* Mission & Vision */}
          {(about.mission || about.vision) && (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {about.mission && (
                <motion.div
                  whileHover={{ y: -6 }}
                  className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-green-600 group-hover:w-2 transition-all duration-300" />
                  <div className="p-6 pl-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">🎯</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">Our Mission</h3>
                    </div>
                    <p className="text-white/60 leading-relaxed">{about.mission}</p>
                  </div>
                </motion.div>
              )}

              {about.vision && (
                <motion.div
                  whileHover={{ y: -6 }}
                  className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-600 group-hover:w-2 transition-all duration-300" />
                  <div className="p-6 pl-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">👁️</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">Our Vision</h3>
                    </div>
                    <p className="text-white/60 leading-relaxed">{about.vision}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Core Values */}
          {about.core_values?.length > 0 && (
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
                {about.core_values.map((value, index) => {
                  const cardImgs = getCardImages(value)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -4 }}
                      className="glass-card text-center group hover:border-emerald-400/20 transition-all duration-300 overflow-hidden p-0"
                    >
                      {cardImgs.length > 0 && (
                        cardImgs.length > 1 ? (
                          <CardImage images={cardImgs} alt={value.title} heightClass="h-32" />
                        ) : (
                          <div className="h-32 overflow-hidden">
                            <AboutImage src={cardImgs[0]} alt={value.title} className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/80 to-transparent" />
                          </div>
                        )
                      )}
                      
                      <div className="p-5 relative">
                        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300 ${cardImgs.length > 0 ? '-mt-10' : ''}`}>
                          {value.icon || '💎'}
                        </div>
                        <h4 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">{value.title}</h4>
                        <p className="text-sm text-white/40 leading-relaxed">{value.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          {about.stats?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 mb-12"
            >
              <h3 className="text-xl font-bold text-white text-center mb-8">Our Impact in Numbers</h3>
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
                    {stat.icon && (
                      <div className="text-2xl mb-2">{stat.icon}</div>
                    )}
                    <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">{stat.number}+</div>
                    <div className="text-sm text-white/40 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Why Choose Us */}
          {about.why_choose_us?.length > 0 && (
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
                {about.why_choose_us.map((item, index) => {
                  const cardImgs = getCardImages(item)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -6 }}
                      className="glass-card text-center group hover:border-emerald-400/30 transition-all duration-300 overflow-hidden p-0"
                    >
                      {cardImgs.length > 0 && (
                        cardImgs.length > 1 ? (
                          <CardImage images={cardImgs} alt={item.title} heightClass="h-32" />
                        ) : (
                          <div className="h-32 overflow-hidden">
                            <AboutImage src={cardImgs[0]} alt={item.title} className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                          </div>
                        )
                      )}
                      
                      <div className="p-6 relative">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300 ${cardImgs.length > 0 ? '-mt-10' : ''}`}>
                          {item.icon || '✅'}
                        </div>
                        <h4 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">{item.title}</h4>
                        <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AboutPage