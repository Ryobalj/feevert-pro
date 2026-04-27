import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ConsultationList = () => {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const res = await api.get('/consultation-requests/')
        setConsultations(res.data?.results || res.data || [])
      } catch (error) { console.error('Error loading consultations:', error) }
      finally { setLoading(false) }
    }
    loadConsultations()
  }, [])

  // Filter + Search
  const filteredConsultations = consultations.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        c.service_name?.toLowerCase().includes(q) ||
        c.message?.toLowerCase().includes(q) ||
        c.assigned_to_name?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const statuses = [
    { value: 'all', icon: '📋', label: 'All' },
    { value: 'pending', icon: '⏳', label: 'Pending' },
    { value: 'confirmed', icon: '✅', label: 'Confirmed' },
    { value: 'in_progress', icon: '🔄', label: 'In Progress' },
    { value: 'completed', icon: '✔️', label: 'Completed' },
    { value: 'cancelled', icon: '❌', label: 'Cancelled' },
  ]

  const statusBadges = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  }

  // Stats
  const stats = {
    total: consultations.length,
    pending: consultations.filter(c => c.status === 'pending').length,
    confirmed: consultations.filter(c => c.status === 'confirmed').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading consultations...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-4xl">
        {/* ============ PAGE HEADER ============ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
              My <span className="gradient-text">Consultations</span>
            </h1>
            <p className="text-white/40 text-sm">Track your consultation requests</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/request-consultation" className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="relative z-10">New Request</span>
            </Link>
          </motion.div>
        </div>

        {/* ============ STATS BAR ============ */}
        {consultations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-6">
            <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
              <span className="text-white font-semibold">{stats.total}</span> total
            </div>
            {stats.pending > 0 && (
              <div className="glass px-4 py-2 rounded-full text-sm text-amber-400/70">
                <span className="text-amber-400 font-semibold">{stats.pending}</span> pending
              </div>
            )}
            {stats.confirmed > 0 && (
              <div className="glass px-4 py-2 rounded-full text-sm text-emerald-400/70">
                <span className="text-emerald-400 font-semibold">{stats.confirmed}</span> confirmed
              </div>
            )}
          </motion.div>
        )}

        {/* ============ SEARCH + FILTERS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative max-w-xs">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search consultations..."
              className="w-full pl-11 pr-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm" />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {statuses.map(status => (
              <motion.button key={status.value} onClick={() => setFilter(status.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-300 flex items-center gap-1.5 ${
                  filter === status.value
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <span>{status.icon}</span>
                {status.label}
              </motion.button>
            ))}
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* ============ CONSULTATIONS LIST ============ */}
        <AnimatePresence mode="wait">
          {filteredConsultations.length > 0 ? (
            <motion.div key={filter + searchQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {filteredConsultations.map((consultation, index) => (
                <motion.div key={consultation.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}>
                  <Link to={`/consultations/${consultation.id}`} className="block group">
                    <div className="glass-card p-0 overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                      <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
                      
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title + Status */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg flex-shrink-0">💬</span>
                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
                                  {consultation.service_name || 'Consultation Request'}
                                </h3>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusBadges[consultation.status] || 'bg-white/10 text-white/50 border-white/10'}`}>
                                <span>{statuses.find(s => s.value === consultation.status)?.icon || '📋'}</span>
                                {(consultation.status || 'pending').replace('_', ' ')}
                              </span>
                            </div>
                            
                            {/* Info Grid */}
                            <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-white/50 text-xs">Date:</span>
                                <span className="text-white/70 text-sm font-medium">
                                  {consultation.preferred_date ? new Date(consultation.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-white/50 text-xs">Assigned:</span>
                                <span className="text-white/70 text-sm font-medium">
                                  {consultation.assigned_to_name || 'Pending'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Message Preview */}
                            {consultation.message && (
                              <p className="text-sm text-white/40 line-clamp-1 leading-relaxed">
                                {consultation.message}
                              </p>
                            )}
                          </div>
                          
                          {/* Arrow */}
                          <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:gap-2 flex-shrink-0">
                            View
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </span>
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
              <div className="text-5xl mb-4 opacity-40">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No {filter !== 'all' ? filter.replace('_', ' ') : ''} consultation requests found
              </h3>
              <p className="text-white/40 max-w-sm mx-auto mb-6">
                {filter !== 'all' 
                  ? `You don't have any ${filter.replace('_', ' ')} consultations yet.`
                  : "You haven't made any consultation requests yet."}
              </p>
              <Link to="/request-consultation" className="btn-primary btn-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Request Consultation
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ConsultationList