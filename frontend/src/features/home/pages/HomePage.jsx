import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader' // ✅ ADDED

// ============ ICON CONVERTER (same as ServicesPage) ============
const iconMap = {
  ':bee:': '🐝', ':leaf:': '🌿', ':shield:': '🛡️',
  ':home:': '🏠', ':tools:': '🛠️', ':honey:': '🍯',
  ':books:': '📚', ':sunflower:': '🌻', ':clipboard:': '📋',
  ':search:': '🔍', ':recycle:': '♻️', ':globe:': '🌍',
  ':map:': '🗺️', ':scroll:': '📜', ':warning:': '⚠️',
  ':chart:': '📊', ':graduate:': '🎓', ':detective:': '🔎',
  ':beehive:': '🐝', ':flower:': '🌻', ':earth:': '🌍',
  ':magnifier:': '🔍', ':document:': '📋', ':mortar:': '🎓',
}

const getIcon = (icon) => {
  if (!icon) return '📌'
  return iconMap[icon] || icon
}

// ============ ✅ FIXED IMAGE CAROUSEL (SAME LOGIC AS ServiceImageHero) ============
const CardImage = ({ item, type = 'service' }) => {
  const [currentImage, setCurrentImage] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const [transitionType, setTransitionType] = React.useState('fade')

  const images = React.useMemo(() => {
    const imgs = []

    const addImage = (url) => {
      if (url && typeof url === 'string' && url.length > 0 && !imgs.includes(url)) {
        imgs.push(url)
      }
    }

    const extractUrl = (field) => {
      if (!field) return null
      if (typeof field === 'string') return field
      if (typeof field === 'object') {
        if (field.url) return field.url
        if (field.image_url) return typeof field.image_url === 'string' ? field.image_url : field.image_url.url
        if (field.image) return typeof field.image === 'string' ? field.image : field.image.url
      }
      return null
    }

    if (type === 'project') {
      addImage(extractUrl(item.featured_image))
      addImage(extractUrl(item.image))
      addImage(item.image_url)
      if (item.gallery && Array.isArray(item.gallery)) {
        item.gallery.forEach(img => addImage(extractUrl(img)))
      }
    } else {
      // Service
      addImage(item.primary_image_url)
      addImage(extractUrl(item.image))
      addImage(item.image_url)
      if (item.all_images && Array.isArray(item.all_images)) {
        item.all_images.forEach(img => {
          addImage(extractUrl(img))
          if (img && typeof img === 'object') addImage(img.image_url)
        })
      }
      if (item.gallery && Array.isArray(item.gallery)) {
        item.gallery.forEach(img => {
          addImage(extractUrl(img))
          if (img && typeof img === 'object') addImage(img.image_url)
        })
      }
    }

    return imgs
  }, [item, type])

  const hasMultipleImages = images.length > 1
  const transitions = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom-in', 'zoom-out']

  // ✅ FIXED: Badilisha transition KABLA ya image (kama ServiceImageHero)
  const changeImage = React.useCallback((newIndex, transition = null) => {
    const randomTransition = transition || transitions[Math.floor(Math.random() * transitions.length)]
    setTransitionType(randomTransition)
    setCurrentImage(newIndex)
  }, [])

  const goNext = React.useCallback(() => {
    changeImage((currentImage + 1) % images.length)
  }, [currentImage, images.length, changeImage])

  const goPrev = React.useCallback(() => {
    changeImage((currentImage - 1 + images.length) % images.length)
  }, [currentImage, images.length, changeImage])

  React.useEffect(() => {
    if (!isHovering && hasMultipleImages) {
      const interval = setInterval(goNext, 5000)
      return () => clearInterval(interval)
    }
  }, [isHovering, hasMultipleImages, goNext])

  // ✅ FIXED: Sawa na ServiceImageHero
  const getTransitionClasses = (index) => {
    const isActive = index === currentImage

    if (isActive) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100'
    }

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

  if (images.length === 0) return null

  const heightClass = type === 'project' ? 'h-48' : 'h-40'

  return (
    <div
      className={`relative ${heightClass} overflow-hidden rounded-t-3xl`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${getTransitionClasses(index)}`}
        >
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105"
            style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320] via-[#0d3320]/30 to-transparent pointer-events-none" />

      {hasMultipleImages && (
        <>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeImage(i) }}
                className={`rounded-full transition-all duration-500 ${i === currentImage ? 'bg-emerald-400 w-4 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/80'}`}
              />
            ))}
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev() }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 hover:bg-black/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 hover:bg-black/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  )
}

// ============ MAIN HOME PAGE ============
const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState(null)
  const [services, setServices] = useState([])
  const [projects, setProjects] = useState([])
  const [team, setTeam] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [faqs, setFaqs] = useState([])
  const [partners, setPartners] = useState([])
  const [counters, setCounters] = useState({ projects: 0, clients: 0, years: 0 })

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [settingsRes, servicesRes, projectsRes, teamRes, testimonialsRes, faqRes, partnersRes] = await Promise.all([
          api.get('/site-settings/'),
          api.get('/consultation-services/'),
          api.get('/projects/'),
          api.get('/team-members/'),
          api.get('/testimonials/'),
          api.get('/faqs/'),
          api.get('/partners/')
        ])
        
        const extractData = (res) => {
          if (res.data?.results) return res.data.results
          if (Array.isArray(res.data)) return res.data
          return []
        }
        
        setSiteSettings(extractData(settingsRes)[0] || {})
        setServices(extractData(servicesRes))
        setProjects(extractData(projectsRes))
        setTeam(extractData(teamRes))
        setTestimonials(extractData(testimonialsRes))
        setFaqs(extractData(faqRes))
        setPartners(extractData(partnersRes))
        
        const targetProjects = extractData(projectsRes).length
        const targetClients = extractData(testimonialsRes).length
        const targetYears = extractData(settingsRes)[0]?.years_experience || 0
        
        if (targetProjects > 0 || targetClients > 0 || targetYears > 0) {
          const duration = 2000; const steps = 60; const interval = duration / steps
          let step = 0
          const timer = setInterval(() => {
            step++
            const progress = step / steps
            setCounters({
              projects: Math.floor(targetProjects * progress),
              clients: Math.floor(targetClients * progress),
              years: Math.floor(targetYears * progress)
            })
            if (step >= steps) { setCounters({ projects: targetProjects, clients: targetClients, years: targetYears }); clearInterval(timer) }
          }, interval)
          return () => clearInterval(timer)
        }
      } catch (error) { console.error('Error loading data:', error) }
      finally { setLoading(false) }
    }
    loadAllData()
  }, [])

  // ✅ ONLY CHANGE: Modern loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader variant="morph" size="lg" text="Loading homepage" />
      </div>
    )
  }

  const hasStats = counters.projects > 0 || counters.clients > 0 || counters.years > 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* ============ STATS SECTION ============ */}
      {hasStats && (
        <section className="relative py-14 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent" />
          <div className="absolute inset-0 bg-emerald-500/[0.02]" />
          
          <div className="container-main relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
              {counters.projects > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} className="glass-card group hover:border-emerald-400/20 transition-all duration-300">
                  <div className="p-5">
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform duration-300">📁</span>
                    <div className="text-2xl md:text-3xl font-extrabold gradient-text">{counters.projects}+</div>
                    <div className="text-xs text-white/40 mt-1 font-medium">Projects</div>
                    <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full" initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 2, ease: "easeOut" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              {counters.clients > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} className="glass-card group hover:border-emerald-400/20 transition-all duration-300">
                  <div className="p-5">
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform duration-300">😊</span>
                    <div className="text-2xl md:text-3xl font-extrabold gradient-text">{counters.clients}+</div>
                    <div className="text-xs text-white/40 mt-1 font-medium">Happy Clients</div>
                    <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full" initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.2, ease: "easeOut" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              {counters.years > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }} className="glass-card group hover:border-emerald-400/20 transition-all duration-300">
                  <div className="p-5">
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform duration-300">📅</span>
                    <div className="text-2xl md:text-3xl font-extrabold gradient-text">{counters.years}+</div>
                    <div className="text-xs text-white/40 mt-1 font-medium">Years Experience</div>
                    <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full" initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.4, ease: "easeOut" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ SERVICES SECTION ============ */}
      {services.length > 0 && (
        <section className="py-20 md:py-28 relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
          <div className="container-main relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, type: "spring" }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
                <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-sm font-medium text-white/80">🛠️ What We Offer</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">Our <span className="gradient-text">Services</span></h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Comprehensive solutions tailored to your needs</p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                  <Link to={`/services/${service.id}`} className="block group h-full">
                    <div className="glass-card h-full flex flex-col overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 p-0">
                      
                      {/* ✅ FIXED IMAGE CAROUSEL */}
                      <CardImage item={service} type="service" />

                      <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/30 group-hover:via-emerald-400/50 group-hover:to-emerald-400/30 transition-all duration-500" />
                      <div className="p-6 flex flex-col h-full">
                        {service.icon && (
                          <span className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                            {getIcon(service.icon)}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{service.name}</h3>
                        <p className="text-white/40 text-sm mb-4 flex-1 line-clamp-2 leading-relaxed">{service.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          {service.price && service.price !== '0.00' ? (
                            <span className="text-emerald-400 font-semibold text-sm">From TZS {parseInt(service.price).toLocaleString()}</span>
                          ) : <span className="text-white/20 text-xs">Contact for pricing</span>}
                          <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {services.length > 6 && (
              <div className="text-center mt-10">
                <Link to="/services" className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300">
                  View All Services
                  <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></motion.svg>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ PROJECTS SECTION ============ */}
      {projects.length > 0 && (
        <section className="py-20 md:py-28 relative">
          <div className="absolute inset-0 bg-emerald-500/[0.015]" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
          <div className="container-main relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, type: "spring" }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
                <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-sm font-medium text-white/80">📁 Our Portfolio</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">Featured <span className="gradient-text">Projects</span></h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Success stories from our clients</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {projects.slice(0, 4).map((project, i) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                  <Link to={`/projects/${project.id}`} className="block group h-full">
                    <div className="glass-card h-full flex flex-col overflow-hidden hover:border-emerald-400/30 transition-all duration-300 p-0">
                      
                      {/* ✅ FIXED PROJECT IMAGE CAROUSEL */}
                      <CardImage item={project} type="project" />

                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                        <p className="text-white/40 text-sm mb-4 flex-1 line-clamp-2 leading-relaxed">{project.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold">{project.category_name || 'Project'}</span>
                          <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">View <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {projects.length > 4 && (
              <div className="text-center mt-10">
                <Link to="/projects" className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300">
                  View All Projects
                  <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></motion.svg>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ TEAM SECTION ============ */}
      {team.length > 0 && (
        <section className="py-20 md:py-28 relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
          <div className="container-main relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, type: "spring" }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
                <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-sm font-medium text-white/80">👥 Our Experts</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">Meet Our <span className="gradient-text">Team</span></h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Passionate professionals dedicated to your success</p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {team.slice(0, 4).map((member, i) => (
                <motion.div key={member.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}>
                  <Link to={`/team/${member.id}`} className="block group">
                    <div className="glass-card text-center hover:border-emerald-400/30 transition-all duration-300">
                      <div className="p-5">
                        {member.profile_picture || member.photo || member.image ? (
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-emerald-400/40 group-hover:shadow-lg transition-all duration-300">
                            <img
                              src={member.profile_picture || member.photo || member.image}
                              alt={member.full_name || member.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 items-center justify-center hidden">
                              <span className="text-2xl font-bold text-white">{(member.full_name || '?').charAt(0)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-emerald-400/40 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300">
                            <span className="text-2xl font-bold text-white">{(member.full_name || '?').charAt(0)}</span>
                          </div>
                        )}
                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{member.full_name}</h3>
                        <p className="text-xs text-emerald-400/80 font-semibold uppercase tracking-wider mt-1">{member.role || member.position}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {team.length > 4 && (
              <div className="text-center mt-10">
                <Link to="/team" className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300">
                  Meet All Team Members
                  <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></motion.svg>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ TESTIMONIALS SECTION ============ */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-28 relative">
          <div className="absolute inset-0 bg-emerald-500/[0.015]" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
          <div className="container-main relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, type: "spring" }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
                <motion.span className="w-2 h-2 bg-amber-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-sm font-medium text-white/80">⭐ Client Love</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">What <span className="gradient-text">Clients</span> Say</h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Don't just take our word for it</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.slice(0, 3).map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}>
                  <div className="glass-card h-full flex flex-col relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300">
                    <div className="absolute -top-4 -right-2 text-8xl text-white/[0.02] font-serif select-none pointer-events-none group-hover:text-emerald-400/[0.04] transition-colors duration-500">❝</div>
                    <div className="p-6 flex flex-col h-full relative z-10">
                      <div className="flex gap-0.5 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < (t.rating || 5) ? 'text-amber-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        ))}
                      </div>
                      <p className="text-white/60 text-sm italic mb-5 flex-1 leading-relaxed">"{t.content?.substring(0, 150)}{t.content?.length > 150 ? '...' : ''}"</p>
                      <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-4" />
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10 group-hover:ring-emerald-400/30 transition-all">{t.client_name?.charAt(0) || 'C'}</div>
                        <div>
                          <h4 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">{t.client_name}</h4>
                          <p className="text-xs text-white/40">{t.client_role || 'Client'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FAQ SECTION ============ */}
      {faqs.length > 0 && (
        <section className="py-20 md:py-28 relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
          <div className="container-main max-w-2xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">Frequently Asked <span className="gradient-text">Questions</span></h2>
              <p className="text-white/50 text-lg">Got questions? We've got answers</p>
            </motion.div>
            
            <div className="space-y-3">
              {faqs.slice(0, 5).map((faq, i) => (
                <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300">
                    <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                    <div className="h-px bg-white/5 mb-3" />
                    <p className="text-white/50 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {faqs.length > 5 && (
              <div className="text-center mt-10">
                <Link to="/faq" className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300">
                  View All FAQs
                  <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></motion.svg>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ PARTNERS SECTION ============ */}
      {partners.length > 0 && (
        <section className="py-16 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
          <div className="container-main relative z-10">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
              <div className="inline-flex items-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">Trusted by Industry Leaders</span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
              </div>
            </motion.div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {partners.slice(0, 6).map((partner, i) => (
                <motion.div key={partner.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.08 }} className="glass px-6 py-3 rounded-2xl hover:border-emerald-400/30 transition-all duration-300">
                  <span className="text-white/50 hover:text-white font-bold text-sm transition-colors">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA SECTION ============ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a19] via-[#0d3320] to-[#104428]" />
        <motion.div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-400/10 rounded-full blur-[100px]" animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="container-main relative z-10 text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-8">
              <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-sm font-medium text-white/80">Let's Work Together</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-white/60 mb-10">Contact us today for a free consultation and let us help you achieve your goals.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="group relative bg-white text-[#0d3320] px-10 py-4 rounded-full font-bold text-lg shadow-2xl shadow-black/20 overflow-hidden hover:shadow-xl transition-all">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="relative z-10 flex items-center gap-2">Contact Us <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></motion.svg></span>
              </Link>
              <Link to="/services" className="group relative border-2 border-white/30 text-white px-10 py-4 rounded-full font-bold text-lg hover:border-white/60 transition-all">
                <span className="flex items-center gap-2">View Services <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></motion.svg></span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}

export default HomePage