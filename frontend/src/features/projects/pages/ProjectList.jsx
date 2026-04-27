import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { darkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, categoriesRes] = await Promise.all([
          api.get('/projects/'),
          api.get('/project-categories/')
        ])
        setProjects(Array.isArray(projectsRes.data?.results) ? projectsRes.data.results : projectsRes.data || [])
        setCategories(Array.isArray(categoriesRes.data?.results) ? categoriesRes.data.results : categoriesRes.data || [])
      } catch (error) { console.error('Error loading projects:', error) }
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
    if (categoryId === 'all') navigate('/projects', { replace: true })
    else {
      const category = categories.find(c => c.id === categoryId)
      if (category) navigate(`/projects?category=${category.slug || category.id}`, { replace: true })
    }
  }

  // Filter + Search
  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === parseInt(selectedCategory) || p.category === selectedCategory
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const currentCategoryName = selectedCategory === 'all' ? 'All Projects' : categories.find(c => c.id === selectedCategory)?.name || 'Projects'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">
              📁 {selectedCategory === 'all' ? 'Our Portfolio' : currentCategoryName}
            </span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            {selectedCategory === 'all' ? <>Our <span className="gradient-text">Projects</span></> : <><span className="gradient-text">{currentCategoryName}</span> Projects</>}
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            {selectedCategory === 'all' ? 'Success stories that demonstrate our expertise and commitment' : `Explore our ${currentCategoryName.toLowerCase()} projects`}
          </p>
          
          {/* Stats */}
          {projects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
                <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
              </div>
              {selectedCategory !== 'all' && (
                <div className="glass px-4 py-2 rounded-full text-sm text-emerald-400/70">
                  in {currentCategoryName}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ SEARCH + FILTERS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-4 mb-10">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, client, or description..."
              className="w-full pl-12 pr-4 py-3.5 glass text-white placeholder:text-white/30 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {[{ id: 'all', name: 'All Projects' }, ...categories].map(cat => (
                <motion.button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                  }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  {cat.name}
                </motion.button>
              ))}
              {(selectedCategory !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ PROJECTS GRID ============ */}
        <AnimatePresence mode="wait">
          {filteredProjects.length > 0 ? (
            <motion.div key={selectedCategory + searchQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <ProjectGridCard key={project.id} project={project} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center max-w-lg mx-auto">
              <div className="text-5xl mb-4 opacity-40">📁</div>
              <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {searchQuery ? `No projects matching "${searchQuery}".` : `No projects available in ${currentCategoryName}.`}
              </p>
              {(selectedCategory !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                  className="mt-6 px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300">
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ============ PROJECT GRID CARD ============
const ProjectGridCard = ({ project, index }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.4 }} whileHover={{ y: -4 }}>
    <Link to={`/projects/${project.id}`} className="block group h-full">
      <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        {/* Image / Gradient Header */}
        {project.featured_image || project.gallery?.[0] ? (
          <div className="aspect-[16/10] overflow-hidden relative">
            <img src={project.featured_image || project.gallery[0]} alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            {project.status && (
              <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-lg ${
                project.status === 'completed' ? 'bg-emerald-500 text-white' : project.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
            <span className="text-4xl relative z-10">📁</span>
            {project.status && (
              <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-lg ${
                project.status === 'completed' ? 'bg-emerald-500 text-white' : project.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        {/* Content */}
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
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/40 mb-4 line-clamp-2 flex-1 leading-relaxed">
            {project.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              {project.client_name ? (
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {project.client_name}
                </span>
              ) : (
                <span className="text-xs text-white/20">FeeVert Project</span>
              )}
            </div>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              View
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
)

export default ProjectList