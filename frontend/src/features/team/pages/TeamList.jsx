import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

const TeamList = () => {
  const [team, setTeam] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // ✅ ADDED: Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // ✅ FIXED: Load departments once (no pagination needed)
        const deptsRes = await api.get('/departments/')
        setDepartments(deptsRes.data?.results || deptsRes.data || [])
        
        // ✅ FIXED: Load team with pagination
        await loadTeam()
      } catch (error) { 
        console.error('Error loading team:', error)
      } finally { 
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ✅ ADDED: Function to load team with pagination and filters
  const loadTeam = async (page = 1) => {
    try {
      let url = `/team-members/?page=${page}&page_size=12`  // ← 12 per page
      
      // Add department filter if selected
      if (selectedDept !== 'all') {
        url += `&department=${selectedDept}`
      }
      
      // Add search filter
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      const teamRes = await api.get(url)
      
      setTeam(teamRes.data?.results || teamRes.data || [])
      setTotalCount(teamRes.data?.count || 0)
      
      // Calculate total pages
      const pageSize = 12
      const pages = Math.ceil((teamRes.data?.count || 0) / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading team page:', error)
    }
  }

  // ✅ ADDED: Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    loadTeam(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ✅ ADDED: Handle department filter change
  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId)
    loadTeam(1, deptId, searchQuery)
  }

  // ✅ ADDED: Handle search
  const handleSearch = (query) => {
    setSearchQuery(query)
    loadTeam(1, selectedDept, query)
  }

  // Filter + Search (now handled by API)
  const filteredTeam = team  // API already filters

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading team..." />
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
            <span className="text-sm font-medium text-white/80">👥 Our Team</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Meet Our <span className="gradient-text">Team</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Passionate professionals dedicated to your success
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-white/30 mt-4">
              Showing {team.length} of {totalCount} team members
            </p>
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
            <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, role, or department..."
              className="w-full pl-12 pr-4 py-3.5 glass text-white placeholder:text-white/30 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
          </div>

          {/* Department Filters */}
          {departments.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <motion.button onClick={() => handleDeptChange('all')}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedDept === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                All Team
              </motion.button>
              {departments.map(dept => (
                <motion.button key={dept.id} onClick={() => handleDeptChange(dept.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedDept === dept.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                  }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  {dept.name}
                </motion.button>
              ))}
              {(selectedDept !== 'all' || searchQuery) && (
                <button onClick={() => { handleDeptChange('all'); handleSearch('') }}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ TEAM GRID ============ */}
        <AnimatePresence mode="wait">
          {filteredTeam.length > 0 ? (
            <>
              <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredTeam.map((member, index) => (
                  <TeamGridCard key={member.id} member={member} index={index} />
                ))}
              </motion.div>
              
              {/* ✅ ADDED: Pagination Controls */}
              {totalPages > 1 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                  className="flex justify-center items-center gap-2 mt-12">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl glass text-sm font-semibold transition-all duration-300 ${
                      currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-emerald-400/40 hover:scale-105'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1
                      // Show current page, first, last, and neighbors
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 ${
                              currentPage === pageNum 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' 
                                : 'glass text-white/60 hover:text-white hover:border-white/30'
                            }`}>
                            {pageNum}
                          </button>
                        )
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="text-white/30 px-1">...</span>
                      }
                      return null
                    })}
                  </div>
                  
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl glass text-sm font-semibold transition-all duration-300 ${
                      currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:border-emerald-400/40 hover:scale-105'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center max-w-lg mx-auto">
              <div className="text-5xl mb-4 opacity-40">👥</div>
              <h3 className="text-xl font-bold text-white mb-2">No team members found</h3>
              <p className="text-white/40">
                {searchQuery ? `No team members matching "${searchQuery}".` : `No team members in this department.`}
              </p>
              {(selectedDept !== 'all' || searchQuery) && (
                <button onClick={() => { handleDeptChange('all'); handleSearch('') }}
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

// ============ TEAM GRID CARD (same as before) ============
const TeamGridCard = ({ member, index }) => {
  const gradients = [
    'from-emerald-400 to-green-600',
    'from-green-400 to-emerald-600',
    'from-teal-400 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-green-500 to-emerald-500',
    'from-cyan-400 to-emerald-500',
  ]
  const gradient = gradients[member.id ? member.id % gradients.length : 0]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }} whileHover={{ y: -4 }}>
      <Link to={`/team/${member.id}`} className="block group h-full">
        <div className="glass-card text-center h-full flex flex-col items-center relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
          
          <div className="p-5 flex flex-col items-center w-full">
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-md transition-all duration-500" />
              
              {member.profile_image_url ? (
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500">
                  <img src={member.profile_image_url} alt={member.full_name || member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { 
                      e.target.style.display = 'none'
                      e.target.parentElement.nextElementSibling.style.display = 'flex'
                    }} />
                </div>
              ) : null}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500 shadow-lg ${member.profile_image_url ? 'hidden' : 'flex'}`}>
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {(member.full_name || member.name || '?').charAt(0)}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-white text-sm md:text-base mb-1 group-hover:text-emerald-400 transition-colors duration-300 truncate w-full">
              {member.full_name || member.name}
            </h3>

            <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">
              {member.role || member.position || 'Team Member'}
            </p>

            {member.department_name && (
              <p className="text-[10px] text-white/30">
                {member.department_name}
              </p>
            )}

            <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default TeamList