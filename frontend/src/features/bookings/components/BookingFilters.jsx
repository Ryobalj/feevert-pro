// src/features/bookings/components/BookingFilters.jsx

import React from 'react'
import { motion } from 'framer-motion'
import { BOOKING_STATUSES } from '../utils/constants'

const statusIcons = {
  all: '📋',
  pending: '⏳',
  confirmed: '✅',
  completed: '✔️',
  cancelled: '❌',
}

const BookingFilters = ({ currentFilter, onFilterChange, darkMode }) => (
  <div className="flex flex-wrap gap-2">
    {BOOKING_STATUSES.map((status) => (
      <motion.button
        key={status}
        onClick={() => onFilterChange(status)}
        className={`px-4 py-2.5 rounded-full text-sm font-semibold capitalize transition-all duration-300 ${
          currentFilter === status
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
            : 'glass text-white/60 hover:text-white hover:border-white/30'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="flex items-center gap-1.5">
          {statusIcons[status] && (
            <span className="text-xs">{statusIcons[status]}</span>
          )}
          {status}
        </span>
        {/* Active indicator dot */}
        {currentFilter === status && (
          <motion.span
            layoutId="activeFilter"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.button>
    ))}
  </div>
)

export default BookingFilters