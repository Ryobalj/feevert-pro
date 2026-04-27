import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const TeamList = () => {
  const [team, setTeam] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamRes, deptsRes] = await Promise.all([
          api.get('/team-members/'),
          api.get('/departments/')
        ])
        setTeam(teamRes.data?.results || teamRes.data || [])
        setDepartments(deptsRes.data?.results || deptsRes.data || [])
      } catch (error) { console.error('Error loading team:', error) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  // Filter + Search
  const filteredTeam = team.filter(m => {
    const matchesDept = selectedDept === 'all' || m.department === parseInt(selectedDept)
    const matchesSearch = !searchQuery || 
      (m.full_name || m.name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.role || m.position)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDept && matchesSearch
  })

  const currentDeptName = selectedDept === 'all' ? 'All Team' : departments.find(d => d.id === selectedDept)?.name || 'Department'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading team...</p>
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
            <span className="text-sm font-medium text-white/80">👥 Our Team</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Meet Our <span className="gradient-text">Team</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Passionate professionals dedicated to your success
          </p>
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
              placeholder="Search by name, role, or department..."
              className="w-full pl-12 pr-4 py-3.5 glass text-white placeholder:text-white/30 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
          </div>

          {/* Department Filters */}
          {departments.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {[{ id: 'all', name: 'All Team' }, ...departments].map(dept => (
                <motion.button key={dept.id} onClick={() => setSelectedDept(dept.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedDept === dept.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                  }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  {dept.name}
                </motion.button>
              ))}
              {(selectedDept !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedDept('all'); setSearchQuery('') }}
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
            <motion.div key={selectedDept + searchQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredTeam.map((member, index) => (
                <TeamGridCard key={member.id} member={member} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center max-w-lg mx-auto">
              <div className="text-5xl mb-4 opacity-40">👥</div>
              <h3 className="text-xl font-bold text-white mb-2">No team members found</h3>
              <p className="text-white/40">
                {searchQuery ? `No team members matching "${searchQuery}".` : `No team members in ${currentDeptName}.`}
              </p>
              {(selectedDept !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedDept('all'); setSearchQuery('') }}
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

// ============ TEAM GRID CARD ============
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
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
          
          <div className="p-5 flex flex-col items-center w-full">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-md transition-all duration-500" />
              
              {member.profile_picture || member.photo ? (
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500">
                  <img src={member.profile_picture || member.photo} alt={member.full_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                </div>
              ) : null}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500 shadow-lg ${member.profile_picture || member.photo ? 'hidden' : 'flex'}`}>
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {(member.full_name || member.name || '?').charAt(0)}
                </span>
              </div>
            </div>

            {/* Name */}
            <h3 className="font-bold text-white text-sm md:text-base mb-1 group-hover:text-emerald-400 transition-colors duration-300 truncate w-full">
              {member.full_name || member.name}
            </h3>

            {/* Role */}
            <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">
              {member.role || member.position || 'Team Member'}
            </p>

            {/* Department */}
            {member.department_name && (
              <p className="text-[10px] text-white/30">
                {member.department_name}
              </p>
            )}

            {/* Hover arrow */}
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