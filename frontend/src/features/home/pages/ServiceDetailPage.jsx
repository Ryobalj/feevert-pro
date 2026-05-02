import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

// ============ ICON CONVERTER ============
const iconMap = {
  ':bee:': '🐝', ':leaf:': '🌿', ':shield:': '🛡️',
  ':home:': '🏠', ':tools:': '🛠️', ':honey:': '🍯',
  ':books:': '📚', ':sunflower:': '🌻', ':clipboard:': '📋',
  ':search:': '🔍', ':recycle:': '♻️', ':globe:': '🌍',
  ':map:': '🗺️', ':scroll:': '📜', ':warning:': '⚠️',
  ':chart:': '📊', ':graduate:': '🎓', ':detective:': '🔎',
}

const getIcon = (icon) => {
  if (!icon) return '📌'
  return iconMap[icon] || icon
}

// ============ HELPERS ============
const getDisplayPrice = (service) => {
  if (service.display_price && service.display_price !== 'Get Quote') {
    return service.display_price
  }
  if (service.price_type === 'fixed' && service.price) {
    return `${service.currency || 'TZS'} ${parseFloat(service.price).toLocaleString()}`
  }
  if (service.price_type === 'range' && service.price_range_min && service.price_range_max) {
    return `${service.currency || 'TZS'} ${parseInt(service.price_range_min).toLocaleString()} - ${parseInt(service.price_range_max).toLocaleString()}`
  }
  if (service.price_type === 'hourly' && service.price) {
    return `${service.currency || 'TZS'} ${parseFloat(service.price).toLocaleString()}/hr`
  }
  if (service.price && parseFloat(service.price) > 0) {
    return `From ${service.currency || 'TZS'} ${parseInt(service.price).toLocaleString()}`
  }
  return 'Get Quote'
}

const getDuration = (minutes) => {
  if (!minutes || minutes === 0) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

// ============ IMAGE HERO CAROUSEL ============
const ServiceImageHero = ({ service }) => {
  const [currentImage, setCurrentImage] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [transitionType, setTransitionType] = useState('fade')

  const images = React.useMemo(() => {
    const imgs = []

    if (service.primary_image_url) {
      imgs.push(service.primary_image_url)
    }

    if (service.all_images && Array.isArray(service.all_images)) {
      service.all_images.forEach(img => {
        if (img.image_url && !imgs.includes(img.image_url)) {
          imgs.push(img.image_url)
        }
      })
    }

    if (imgs.length === 0 && service.gallery && Array.isArray(service.gallery)) {
      service.gallery.forEach(img => {
        const url = typeof img === 'string' ? img : img.image_url || img.image
        if (url && !imgs.includes(url)) imgs.push(url)
      })
    }

    if (imgs.length === 0 && service.image_url) {
      imgs.push(service.image_url)
    }

    return imgs
  }, [service])

  const transitions = [
    'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom-in', 'zoom-out',
  ]

  const changeImage = React.useCallback((newIndex, transition = null) => {
    const randomTransition = transition || transitions[Math.floor(Math.random() * transitions.length)]
    setTransitionType(randomTransition)
    setCurrentImage(newIndex)
  }, [])

  const nextImage = React.useCallback(() => {
    const newIndex = (currentImage + 1) % images.length
    changeImage(newIndex)
  }, [currentImage, images.length, changeImage])

  const prevImage = React.useCallback(() => {
    const newIndex = (currentImage - 1 + images.length) % images.length
    changeImage(newIndex)
  }, [currentImage, images.length, changeImage])

  React.useEffect(() => {
    if (!isHovering && images.length > 1) {
      const interval = setInterval(() => { nextImage() }, 6000)
      return () => clearInterval(interval)
    }
  }, [isHovering, images.length, nextImage])

  const getTransitionClasses = (isActive) => {
    if (!isActive) {
      switch (transitionType) {
        case 'slide-left': return 'opacity-0 translate-x-full'
        case 'slide-right': return 'opacity-0 -translate-x-full'
        case 'slide-up': return 'opacity-0 translate-y-full'
        case 'slide-down': return 'opacity-0 -translate-y-full'
        case 'zoom-in': return 'opacity-0 scale-125'
        case 'zoom-out': return 'opacity-0 scale-75'
        case 'fade':
        default: return 'opacity-0'
      }
    }
    return 'opacity-100 translate-x-0 translate-y-0 scale-100'
  }

  if (images.length === 0) return null

  return (
    <div
      className="relative aspect-[21/9] md:aspect-[21/7] rounded-2xl overflow-hidden mb-6 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${getTransitionClasses(index === currentImage)}`}
        >
          <img
            src={img}
            alt={`${service.name} - ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320] via-[#0d3320]/20 to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/60 text-[10px] font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {transitionType.replace('-', ' ')}
          </div>

          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium z-10">
            {currentImage + 1} / {images.length}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); changeImage(index) }}
                className={`rounded-full transition-all duration-300 ${
                  index === currentImage
                    ? 'bg-emerald-400 w-6 h-2 shadow-lg shadow-emerald-500/30'
                    : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                }`}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/60 hover:text-white"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/60 hover:text-white"
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

// ============ MAIN COMPONENT ============
const ServiceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadService = async () => {
      try {
        const res = await api.get(`/consultation-services/${id}/`)
        setService(res.data)
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/services')
      } finally {
        setLoading(false)
      }
    }
    loadService()
  }, [id, navigate])

  // Collect all images for lightbox
  const allGalleryImages = React.useMemo(() => {
    if (!service) return []
    const imgs = []

    if (service.primary_image_url) imgs.push(service.primary_image_url)

    if (service.all_images && Array.isArray(service.all_images)) {
      service.all_images.forEach(img => {
        if (img.image_url && !imgs.includes(img.image_url)) imgs.push(img.image_url)
      })
    }

    if (service.gallery && Array.isArray(service.gallery)) {
      service.gallery.forEach(img => {
        const url = typeof img === 'string' ? img : img.image_url || img.image
        if (url && !imgs.includes(url)) imgs.push(url)
      })
    }

    return imgs
  }, [service])

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length)
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % allGalleryImages.length)
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, allGalleryImages])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (selectedImageIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [selectedImageIndex])

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading service details..." />
      </div>
    )
  }

  if (!service) return null

  const duration = getDuration(service.duration_minutes)
  const hasDetails = (service.benefits && service.benefits.length > 0) ||
                     (service.deliverables && service.deliverables.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-12 md:py-20"
    >
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Services
        </motion.button>

        {/* IMAGE HERO CAROUSEL */}
        <ServiceImageHero service={service} />

        {/* ============ SERVICE HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-10 mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          <div className="flex items-start gap-5 mb-6">
            {service.icon && (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/10 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 glass rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                  {getIcon(service.icon)}
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
                    {service.name}
                  </h1>
                  {service.category_name && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {service.category_name}
                    </span>
                  )}
                </div>

                <Link
                  to="/request-consultation"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 group/req"
                >
                  Request
                  <svg className="w-4 h-4 group-hover/req:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-white/60 mb-6">
            {service.description}
          </p>

          {/* Price & Duration Cards */}
          <div className="flex flex-wrap gap-4">
            <div className="glass rounded-2xl px-6 py-4 group/price hover:border-emerald-400/30 transition-all duration-300">
              <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">
                {service.price_type === 'quote' ? 'Pricing' : 'Starting from'}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold gradient-text">
                {getDisplayPrice(service)}
              </p>
            </div>
            {duration && (
              <div className="glass rounded-2xl px-6 py-4 hover:border-emerald-400/30 transition-all duration-300">
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Duration</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {duration}
                </p>
              </div>
            )}
            {service.estimated_delivery_days > 0 && (
              <div className="glass rounded-2xl px-6 py-4 hover:border-emerald-400/30 transition-all duration-300">
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Delivery</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {service.estimated_delivery_days} day{service.estimated_delivery_days > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* IMAGE GALLERY GRID */}
        {allGalleryImages.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🖼️</span>
              Gallery
              <span className="text-xs text-white/30 font-normal ml-auto">{allGalleryImages.length} images</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {allGalleryImages.map((img, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  className="relative aspect-square cursor-pointer rounded-xl overflow-hidden group/img"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-700 items-center justify-center hidden">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ BENEFITS & DELIVERABLES ============ */}
        {hasDetails && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {service.benefits && service.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">✨</span>
                  Benefits
                </h3>
                <ul className="space-y-3">
                  {service.benefits.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-emerald-500/30 transition-colors">
                        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {service.deliverables && service.deliverables.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">📦</span>
                  Deliverables
                </h3>
                <ul className="space-y-3">
                  {service.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-amber-500/30 transition-colors">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* ============ FAQ & PREREQUISITES ============ */}
        <div className="grid md:grid-cols-2 gap-6">
          {service.faq && Array.isArray(service.faq) && service.faq.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">❓</span>
                Frequently Asked
              </h3>
              <div className="space-y-3">
                {service.faq.map((item, i) => (
                  <div key={i} className="glass rounded-xl p-4 hover:border-emerald-400/20 transition-all duration-300">
                    <p className="font-semibold text-white text-sm mb-1.5">{item.question}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {service.prerequisites && Array.isArray(service.prerequisites) && service.prerequisites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📋</span>
                Prerequisites
              </h3>
              <ul className="space-y-3">
                {service.prerequisites.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-emerald-500/30 transition-colors">
                      <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* ============ LIGHTBOX MODAL ============ */}
      <AnimatePresence>
        {selectedImageIndex !== null && allGalleryImages[selectedImageIndex] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:border-red-400/50 transition-all duration-300 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium z-10">
              {selectedImageIndex + 1} / {allGalleryImages.length}
            </div>

            {/* Previous */}
            {allGalleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/70 hover:text-white hover:scale-110 transition-all duration-300 z-10 border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next */}
            {allGalleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => (prev + 1) % allGalleryImages.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/70 hover:text-white hover:scale-110 transition-all duration-300 z-10 border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              key={allGalleryImages[selectedImageIndex]}
              src={allGalleryImages[selectedImageIndex]}
              alt="Service"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Dots */}
            {allGalleryImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {allGalleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index) }}
                    className={`rounded-full transition-all duration-300 ${
                      index === selectedImageIndex
                        ? 'bg-emerald-400 w-6 h-2'
                        : 'bg-white/40 w-2 h-2 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ServiceDetailPage