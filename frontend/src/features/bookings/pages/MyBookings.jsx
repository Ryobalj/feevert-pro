// src/features/bookings/pages/MyBookings.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useBookings } from '../hooks'
import { BookingCard, BookingFilters, EmptyBookingState } from '../components'

const MyBookings = () => {
  const { darkMode } = useTheme()
  const { 
    bookings, 
    allBookings,
    loading, 
    filter, 
    searchQuery,
    stats, 
    setFilter, 
    setSearchQuery, 
    refetch, 
    clearFilters,
    isEmpty,
    hasActiveFilter,
    error 
  } = useBookings()

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  // ============ ERROR ============
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-md"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <button onClick={refetch} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.06 } 
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-10 md:py-16"
    >
      <div className="container-main max-w-4xl">
        {/* ============ PAGE HEADER ============ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
              My <span className="gradient-text">Bookings</span>
            </h1>
            <p className="text-white/40 text-sm">Manage your appointments</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            {/* Refresh button */}
            <button 
              onClick={refetch}
              className="glass p-2.5 rounded-full text-white/50 hover:text-white hover:border-emerald-400/30 transition-all duration-300"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* New Booking */}
            <Link to="/book-appointment" className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="relative z-10">New Booking</span>
            </Link>
          </motion.div>
        </div>

        {/* ============ STATS BAR ============ */}
        {allBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-6"
          >
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
            {stats.upcoming > 0 && (
              <div className="glass px-4 py-2 rounded-full text-sm text-blue-400/70">
                <span className="text-blue-400 font-semibold">{stats.upcoming}</span> upcoming
              </div>
            )}
          </motion.div>
        )}

        {/* ============ SEARCH + FILTERS ============ */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-6"
        >
          {/* Search */}
          <div className="relative max-w-xs">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings..."
              className="w-full pl-11 pr-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <BookingFilters 
              currentFilter={filter} 
              onFilterChange={setFilter} 
              darkMode={darkMode} 
            />
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* ============ BOOKINGS LIST ============ */}
        <AnimatePresence mode="wait">
          {!isEmpty ? (
            <motion.div 
              key={filter + searchQuery}
              variants={containerVariants} 
              initial="hidden" 
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {bookings.map((booking, index) => (
                <motion.div 
                  key={booking.id} 
                  variants={cardVariants}
                  transition={{ delay: index * 0.04 }}
                >
                  <BookingCard booking={booking} darkMode={darkMode} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <EmptyBookingState filter={filter} darkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default MyBookings