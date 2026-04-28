import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// ============ 🆕 SERVICE CARD IMAGE CAROUSEL (RANDOM TRANSITIONS) ============
const ServiceCardImage = ({ service }) => {
  const [currentImage, setCurrentImage] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const [transitionType, setTransitionType] = React.useState('fade')

  // Kusanya images zote
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
        if (url && !imgs.includes(url)) {
          imgs.push(url)
        }
      })
    }

    return imgs
  }, [service])

  // Transitions mbalimbali
  const transitions = [
    'fade',
    'slide-left',
    'slide-right',
    'slide-up',
    'slide-down',
    'zoom-in',
    'zoom-out',
  ]

  // Badilisha image na transition randomly
  const changeImage = React.useCallback((newIndex, transition = null) => {
    const randomTransition = transition || transitions[Math.floor(Math.random() * transitions.length)]
    setTransitionType(randomTransition)
    setCurrentImage(newIndex)
  }, [])

  // Next image
  const nextImage = React.useCallback(() => {
    const newIndex = (currentImage + 1) % images.length
    changeImage(newIndex)
  }, [currentImage, images.length, changeImage])

  // Previous image
  const prevImage = React.useCallback(() => {
    const newIndex = (currentImage - 1 + images.length) % images.length
    changeImage(newIndex)
  }, [currentImage, images.length, changeImage])

  // Auto-slide effect
  React.useEffect(() => {
    if (!isHovering && images.length > 1) {
      const interval = setInterval(() => {
        nextImage()
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [isHovering, images.length, nextImage])

  // Transition classes
  const getTransitionClasses = (isActive) => {
    if (!isActive) {
      // Exit animations
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

  // Kama hakuna images, onyesha gradient placeholder
  if (images.length === 0) {
    return (
      <div className="relative h-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 flex items-center justify-center">
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full bg-emerald-400/5 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/8 group-hover:scale-150 transition-transform duration-600 delay-100" />
          <span className="text-5xl relative z-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
            {service.icon || '🛠️'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative h-44 overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Images zote */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            getTransitionClasses(index === currentImage)
          }`}
        >
          <img
            src={img}
            alt={`${service.name} - ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320] via-[#0d3320]/30 to-transparent pointer-events-none" />

      {/* Transition type indicator (juu kulia) */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {currentImage + 1}/{images.length}
        </div>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                changeImage(index)
              }}
              className={`rounded-full transition-all duration-300 ${
                index === currentImage
                  ? 'bg-emerald-400 w-5 h-2 shadow-glow'
                  : 'bg-white/50 w-2 h-2 hover:bg-white/80'
              }`}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevImage()
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/70 hover:text-white hover:scale-110 border border-white/10"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextImage()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/70 hover:text-white hover:scale-110 border border-white/10"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

// ============ MAIN SERVICES SECTION ============
const ServicesSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayedServices = data.slice(0, 6)

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle top gradient blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      
      <div className="container-main relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">🛠️ What We Offer</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Our Core{' '}
            <span className="gradient-text">Services</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Comprehensive solutions tailored to your needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <Link to={`/services/${service.id}`} className="block group h-full">
                <div className="glass-card h-full flex flex-col relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 p-0">
                  
                  {/* 🆕 IMAGE CAROUSEL WITH RANDOM TRANSITIONS */}
                  <ServiceCardImage service={service} />

                  {/* Top accent line */}
                  <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/30 group-hover:via-emerald-400/50 group-hover:to-emerald-400/30 transition-all duration-500" />

                  <div className="p-6 flex flex-col h-full">
                    {/* Icon with glow */}
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-xl transition-all duration-500 scale-150" />
                      <div className="relative w-14 h-14 rounded-2xl glass flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                        {service.icon || '📌'}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1 line-clamp-3">
                      {service.description}
                    </p>

                    {/* Price + Arrow */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {service.price && parseFloat(service.price) > 0 ? (
                        <span className="text-emerald-400 font-bold text-sm">
                          From TZS {parseInt(service.price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">Contact for pricing</span>
                      )}

                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all ml-auto">
                        Learn more
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        {data.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link 
              to="/services" 
              className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-base hover:border-emerald-400/50 transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300" />
              <span className="relative z-10">View All Services</span>
              <motion.svg 
                className="w-5 h-5 relative z-10" 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
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

export default ServicesSection