import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsRes, categoriesRes] = await Promise.all([
          api.get('/jobs/'),
          api.get('/job-categories/')
        ])
        setJobs(jobsRes.data?.results || jobsRes.data || [])
        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) { console.error('Error loading jobs:', error) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  // Filter + Search
  const filteredJobs = jobs.filter(job => {
    if (selectedCategory !== 'all' && job.category !== parseInt(selectedCategory)) return false
    if (selectedType !== 'all' && job.employment_type !== selectedType) return false
    if (job.is_active === false) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q) ||
        job.category_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const employmentTypes = [...new Set(jobs.map(j => j.employment_type).filter(Boolean))]
  const activeJobs = jobs.filter(j => j.is_active !== false)
  const featuredJobs = activeJobs.filter(j => j.is_featured)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-4xl">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">💼 We're Hiring!</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Join Our <span className="gradient-text">Team</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Explore career opportunities and grow with us
          </p>
        </motion.div>

        {/* ============ SEARCH + FILTERS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-4 mb-8">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, location, or keyword..."
              className="w-full pl-12 pr-4 py-3.5 glass text-white placeholder:text-white/30 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap justify-center gap-3">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 glass text-white rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm cursor-pointer">
              <option value="all" className="bg-[#0d3320]">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0d3320]">{cat.name}</option>
              ))}
            </select>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 glass text-white rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm cursor-pointer">
              <option value="all" className="bg-[#0d3320]">All Types</option>
              {employmentTypes.map(type => (
                <option key={type} value={type} className="bg-[#0d3320]">{type.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
            {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
              <button onClick={() => { setSelectedCategory('all'); setSelectedType('all'); setSearchQuery('') }}
                className="px-4 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* ============ STATS BAR ============ */}
        {activeJobs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
              <span className="text-white font-semibold">{activeJobs.length}</span> open position{activeJobs.length !== 1 ? 's' : ''}
            </div>
            {featuredJobs.length > 0 && (
              <div className="glass px-4 py-2 rounded-full text-sm text-amber-400/70">
                <span className="text-amber-400 font-semibold">{featuredJobs.length}</span> featured
              </div>
            )}
          </motion.div>
        )}

        {/* ============ JOBS LIST ============ */}
        <AnimatePresence mode="wait">
          {filteredJobs.length > 0 ? (
            <motion.div key={selectedCategory + selectedType + searchQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {filteredJobs.map((job, index) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}>
                  <Link to={`/careers/${job.id}`} className="block group">
                    <div className="glass-card p-0 overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                      <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title + Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
                                {job.title}
                              </h3>
                              {job.is_featured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            
                            {/* Meta */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
                                <svg className="w-3.5 h-3.5 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {job.location || 'Various'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                {job.employment_type_display || job.employment_type?.replace(/_/g, ' ')}
                              </span>
                              {job.category_name && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                  {job.category_name}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-white/40 line-clamp-2 mb-3 leading-relaxed">{job.description}</p>
                          </div>
                          
                          {/* Right Column */}
                          <div className="text-right flex-shrink-0">
                            {job.deadline && (
                              <p className="text-xs text-white/40 mb-2">
                                📆 {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 justify-end group-hover:gap-2 transition-all">
                              View Details
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center">
              <div className="text-5xl mb-4 opacity-40">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No positions found</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {searchQuery ? `No jobs matching "${searchQuery}".` : 'No open positions matching your criteria.'}
              </p>
              {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedCategory('all'); setSelectedType('all'); setSearchQuery('') }}
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

export default JobList