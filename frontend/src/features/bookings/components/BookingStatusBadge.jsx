// src/features/bookings/components/BookingStatusBadge.jsx

import React from 'react'

const STATUS_CONFIG = {
  confirmed: { icon: '✅', label: 'Confirmed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending: { icon: '⏳', label: 'Pending', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { icon: '✔️', label: 'Completed', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  cancelled: { icon: '❌', label: 'Cancelled', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
  in_progress: { icon: '🔄', label: 'In Progress', classes: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  approved: { icon: '✅', label: 'Approved', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  rejected: { icon: '🚫', label: 'Rejected', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const BookingStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { 
    icon: '📋', 
    label: (status || 'unknown').replace('_', ' '), 
    classes: 'bg-white/10 text-white/50 border-white/10' 
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.classes} flex-shrink-0`}>
      <span>{config.icon}</span>
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  )
}

export default BookingStatusBadge