import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

// ============ ICON CONVERTER ============
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

// ============ HELPER FUNCTIONS ============
const getDisplayPrice = (service) => {
  if (service.price && parseFloat(service.price) > 0) {
    return `From ${service.currency || 'TZS'} ${parseInt(service.price).toLocaleString()}`
  }
  if (service.display_price && service.display_price !== 'Get Quote') {
    return service.display_price
  }
  if (service.price_type === 'range' && service.price_range_min && service.price_range_max) {
    return `${service.currency || 'TZS'} ${parseInt(service.price_range_min).toLocaleString()} - ${parseInt(service.price_range_max).toLocaleString()}`
  }
  if (service.price_type === 'quote') {
    return 'Get Quote'
  }
  return 'Contact for pricing'
}

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          api.get('/consultation-services/'),
          api.get('/consultation-categories/')
        ])
        setServices(Array.isArray(servicesRes.data?.results) ? servicesRes.data.results : servicesRes.data || [])
        setCategories(Array.isArray(categoriesRes.data?.results) ? categoriesRes.data.results : categoriesRes.data || [])
      } catch (error) { console.error('Error loading services:', error) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (categories.length === 0) return
    const params = new URLSearchParams(location.search)
    const categoryParam = params.get('category')
    if (categoryParam) {
      const matchedCategory = categories.find(cat => cat.slug === categoryParam || cat.id.toString() === categoryParam)
      setSelectedCategory(matchedCategory ? matchedCategory.id : 'all')
    }
  }, [location.search, categories])

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    if (categoryId === 'all') navigate('/services', { replace: true })
    else {
      const category = categories.find(c => c.id === categoryId)
      if (category) navigate(`/services?category=${category.slug || category.id}`, { replace: true })
    }
  }

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === parseInt(selectedCategory) || s.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading services...</p>
        </div>
      </div>
    )
  }

  const currentCategoryName = selectedCategory === 'all' 
    ? 'All Services' 
    : categories.find(c => c.id === selectedCategory)?.name || 'Services'

  // Get current category icon
  const currentCategoryIcon = selectedCategory !== 'all' 
    ? getIcon(categories.find(c => c.id === selectedCategory)?.icon)
    : '🛠️'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-16 md:py-24">
      <div className="container-main">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">
              {currentCategoryIcon} {selectedCategory === 'all' ? 'Comprehensive Solutions' : currentCategoryName}
            </span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            {selectedCategory === 'all' ? <>Our <span className="gradient-text">Services</span></> : <><span className="gradient-text">{currentCategoryName}</span> Services</>}
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            {selectedCategory === 'all' ? 'Comprehensive consultancy solutions tailored to your specific needs' : `Explore our ${currentCategoryName.toLowerCase()} services designed to help you succeed`}
          </p>
        </motion.div>

        {/* ============ CATEGORY FILTERS ============ */}
        {categories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-2 mb-12">
            {[{ id: 'all', name: 'All Services', icon: '🛠️' }, ...categories.map(c => ({ ...c, icon: getIcon(c.icon) }))].map(cat => (
              <motion.button key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                    : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                {cat.name}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ============ SERVICES GRID ============ */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div key={service.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.5 }}
                whileHover={{ y: -6 }}>
                <Link to={`/services/${service.id}`} className="block group h-full">
                  <div className="glass-card h-full flex flex-col relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
                    
                    <div className="p-6 flex flex-col h-full">
                      {/* Icon + Title */}
                      <div className="flex items-start gap-3 mb-4">
                        {service.icon && (
                          <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-xl blur-lg transition-all duration-500" />
                            <span className="relative text-2xl w-12 h-12 glass rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                              {getIcon(service.icon)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors duration-300">
                            {service.name}
                          </h3>
                          {service.category_name && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              {service.category_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-white/40 mb-5 flex-1 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-emerald-400 font-bold text-sm">
                          {getDisplayPrice(service)}
                        </span>
                        <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
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
          </motion.div>
        </AnimatePresence>

        {/* ============ EMPTY STATE ============ */}
        {filteredServices.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center">
            <div className="text-5xl mb-4 opacity-40">📂</div>
            <h3 className="text-xl font-bold text-white mb-2">No services found</h3>
            <p className="text-white/40 max-w-sm mx-auto">
              {selectedCategory === 'all' ? 'Check back later for new services.' : `No services available in ${currentCategoryName}.`}
            </p>
            {selectedCategory !== 'all' && (
              <button onClick={() => handleCategoryChange('all')}
                className="mt-6 px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300">
                View all services
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ServicesPage