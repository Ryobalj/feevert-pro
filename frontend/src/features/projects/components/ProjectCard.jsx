import React from 'react'
import { Link } from 'react-router-dom'

// ============ 🆕 PROJECT CARD IMAGE CAROUSEL (RANDOM TRANSITIONS) ============
const ProjectCardImage = ({ project }) => {
  const [currentImage, setCurrentImage] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const [transitionType, setTransitionType] = React.useState('fade')

  const gradients = [
    'from-emerald-400 via-green-500 to-teal-600',
    'from-green-400 via-emerald-500 to-cyan-600',
    'from-teal-400 via-cyan-500 to-emerald-600',
    'from-emerald-500 via-teal-500 to-green-600',
    'from-cyan-400 via-emerald-500 to-teal-600',
    'from-green-500 via-teal-400 to-emerald-600',
  ]
  const gradient = gradients[project.id ? project.id % gradients.length : 0]

  // Kusanya images zote
  const images = React.useMemo(() => {
    const imgs = []

    // Featured image
    if (project.featured_image) {
      const url = typeof project.featured_image === 'string' ? project.featured_image : project.featured_image.url || project.featured_image
      if (url) imgs.push(url)
    }

    // Main image
    if (project.image) {
      const url = typeof project.image === 'string' ? project.image : project.image.url || project.image
      if (url && !imgs.includes(url)) imgs.push(url)
    }

    // Gallery images
    if (project.all_images && Array.isArray(project.all_images)) {
      project.all_images.forEach(img => {
        const url = typeof img === 'string' ? img : img.image_url || img.image || img.url
        if (url && !imgs.includes(url)) imgs.push(url)
      })
    }

    // Fallback: jaribu gallery array
    if (imgs.length === 0 && project.gallery && Array.isArray(project.gallery)) {
      project.gallery.forEach(img => {
        const url = typeof img === 'string' ? img : img.image_url || img.image || img.url
        if (url && !imgs.includes(url)) imgs.push(url)
      })
    }

    return imgs
  }, [project])

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

  // Auto-slide effect (kila sekunde 3.5)
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
      <div className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/8 group-hover:scale-150 transition-transform duration-600 delay-100" />

        {/* Icon */}
        <svg className="w-16 h-16 text-white/30 group-hover:scale-110 group-hover:text-white/50 transition-all duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>

        {/* Featured badge */}
        {project.is_featured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white shadow-lg z-20">
            ⭐ Featured
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className="aspect-[16/10] overflow-hidden relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Images zote zenye random transitions */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            getTransitionClasses(index === currentImage)
          }`}
        >
          <img
            src={img}
            alt={`${project.title} - ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      ))}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Featured badge */}
      {project.is_featured && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white shadow-lg z-20">
          ⭐ Featured
        </span>
      )}

      {/* Counter (top right, below featured badge if present) */}
      {images.length > 1 && (
        <div className={`absolute right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 ${
          project.is_featured ? 'top-10' : 'top-3'
        }`}>
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
                  ? 'bg-emerald-400 w-5 h-2 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/50 w-2 h-2 hover:bg-white/80'
              }`}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows (visible on hover) */}
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

// ============ MAIN PROJECT CARD ============
const ProjectCard = ({ project }) => {
  return (
    <Link to={`/projects/${project.id}`} className="block group h-full">
      <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        
        {/* ============ 🆕 IMAGE CAROUSEL WITH RANDOM TRANSITIONS ============ */}
        <ProjectCardImage project={project} />

        {/* ============ CONTENT ============ */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category Badge */}
          {project.category_name && (
            <div className="mb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {project.category_name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300 line-clamp-1">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/40 mb-4 line-clamp-2 flex-1 leading-relaxed">
            {project.description}
          </p>

          {/* ============ FOOTER ============ */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            {/* Client Name */}
            {project.client_name ? (
              <span className="text-xs text-white/30 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white/50 font-medium">{project.client_name}</span>
              </span>
            ) : (
              <span className="text-xs text-white/20">FeeVert Project</span>
            )}

            {/* View Arrow */}
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
              View
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProjectCard