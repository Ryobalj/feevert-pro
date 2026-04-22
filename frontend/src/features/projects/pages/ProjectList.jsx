import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ProjectList = () => {
  const [projects, setProjects] = useState([])
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
        const [projectsRes, categoriesRes] = await Promise.all([
          api.get('/projects/'),
          api.get('/project-categories/')
        ])
        
        const projectsData = projectsRes.data?.results || projectsRes.data || []
        const categoriesData = categoriesRes.data?.results || categoriesRes.data || []
        
        setProjects(Array.isArray(projectsData) ? projectsData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error('Error loading projects:', error)
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
        setSelectedCategory('all')
      }
    }
  }, [location.search, categories])

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    
    // Update URL without page reload
    if (categoryId === 'all') {
      navigate('/projects', { replace: true })
    } else {
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        navigate(`/projects?category=${category.slug || category.id}`, { replace: true })
      }
    }
  }

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === parseInt(selectedCategory) || p.category === selectedCategory)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  // Get current category name for display
  const currentCategoryName = selectedCategory === 'all' 
    ? 'All Projects' 
    : categories.find(c => c.id === selectedCategory)?.name || 'Projects'

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
              <>Our <span className="gradient-text">Projects</span></>
            ) : (
              <><span className="gradient-text">{currentCategoryName}</span> Projects</>
            )}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {selectedCategory === 'all' 
              ? 'Success stories that demonstrate our expertise and commitment'
              : `Explore our ${currentCategoryName.toLowerCase()} projects and see how we've helped our clients`
            }
          </p>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
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
              All Projects
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
            Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${currentCategoryName}`}
          </motion.p>
        )}

        {/* Projects Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={cardVariants}>
              <Link to={`/projects/${project.id}`}>
                <div className={`modern-card h-full group cursor-pointer overflow-hidden ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                }`}>
                  {/* Project Image */}
                  <div className="relative h-48 mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-xl">
                    {project.featured_image || project.gallery?.[0] ? (
                      <img 
                        src={project.featured_image || project.gallery[0]} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ${
                        project.featured_image || project.gallery?.[0] ? 'hidden' : 'flex'
                      }`}
                    >
                      <span className="text-4xl">📁</span>
                    </div>
                    {project.status && (
                      <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'completed' 
                          ? 'bg-green-600 text-white' 
                          : project.status === 'in_progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-xl font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {project.title}
                    </h3>
                  </div>
                  
                  <p className={`text-sm mb-4 line-clamp-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {project.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {project.category_name || 'Project'}
                      </span>
                      {project.client_name && (
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {project.client_name}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      View details →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No projects found
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedCategory === 'all' 
                ? 'Check back later for new projects.' 
                : `No projects available in ${currentCategoryName}. Try another category.`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleCategoryChange('all')}
                className="mt-4 text-green-600 dark:text-green-400 hover:underline"
              >
                View all projects →
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ProjectList