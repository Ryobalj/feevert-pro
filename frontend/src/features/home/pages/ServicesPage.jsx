import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          api.get('/consultation-services/'),
          api.get('/consultation-categories/')
        ])
        
        const servicesData = servicesRes.data?.results || servicesRes.data || []
        const categoriesData = categoriesRes.data?.results || categoriesRes.data || []
        
        setServices(Array.isArray(servicesData) ? servicesData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error('Error loading services:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Read category from URL query parameter (runs after categories are loaded)
  useEffect(() => {
    if (categories.length === 0) return
    
    const params = new URLSearchParams(location.search)
    const categoryParam = params.get('category')
    
    if (categoryParam) {
      // Try to match by slug or id
      const matchedCategory = categories.find(cat => 
        cat.slug === categoryParam || cat.id.toString() === categoryParam
      )
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.id)
      } else {
        // If category not found, default to 'all'
        setSelectedCategory('all')
      }
    }
  }, [location.search, categories])

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    
    // Update URL without page reload
    if (categoryId === 'all') {
      navigate('/services', { replace: true })
    } else {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        navigate(`/services?category=${category.slug || category.id}`, { replace: true })
      }
    }
  }

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === parseInt(selectedCategory) || s.category === selectedCategory)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  // Get current category name for display
  const currentCategoryName = selectedCategory === 'all' 
    ? 'All Services' 
    : categories.find(c => c.id === selectedCategory)?.name || 'Services'

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {selectedCategory === 'all' ? (
              <>Our <span className="gradient-text">Services</span></>
            ) : (
              <><span className="gradient-text">{currentCategoryName}</span> Services</>
            )}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {selectedCategory === 'all' 
              ? 'Comprehensive consultancy solutions tailored to your specific needs'
              : `Explore our ${currentCategoryName.toLowerCase()} services designed to help you succeed`
            }
          </p>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white shadow-md'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Services
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-green-600 text-white shadow-md'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Results count */}
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm mb-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Showing {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${currentCategoryName}`}
          </motion.p>
        )}

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredServices.map((service) => (
            <motion.div key={service.id} variants={cardVariants}>
              <Link to={`/services/${service.id}`}>
                <div className={`modern-card h-full group cursor-pointer ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={`text-xl font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {service.name}
                        </h3>
                        {service.category_name && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {service.category_name}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-4 line-clamp-3 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        {service.price && parseFloat(service.price) > 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            From TZS {parseInt(service.price).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            Contact for pricing
                          </span>
                        )}
                        <span className={`text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          Learn more →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No services found
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedCategory === 'all' 
                ? 'Check back later for new services.' 
                : `No services available in ${currentCategoryName}. Try another category.`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleCategoryChange('all')}
                className="mt-4 text-green-600 dark:text-green-400 hover:underline"
              >
                View all services →
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ServicesPage