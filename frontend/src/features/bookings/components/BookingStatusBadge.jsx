// src/features/bookings/components/BookingStatusBadge.jsx

import React from 'react'
import { useTranslation } from 'react-i18next'

const STATUS_CONFIG = {
  confirmed: { icon: '✅', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending: { icon: '⏳', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { icon: '✔️', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  cancelled: { icon: '❌', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
  in_progress: { icon: '🔄', classes: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  approved: { icon: '✅', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  rejected: { icon: '🚫', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const BookingStatusBadge = ({ status }) => {
  const { t } = useTranslation('booking')

  // Map status to translation keys
  const getStatusLabel = (status) => {
    const statusMap = {
      confirmed: t('status.confirmed'),
      pending: t('status.pending'),
      completed: t('status.completed'),
      cancelled: t('status.cancelled'),
      in_progress: t('status.in_progress'),
      approved: t('status.approved'),
      rejected: t('status.rejected')
    }
    return statusMap[status] || status?.replace('_', ' ') || 'Unknown'
  }

  const config = STATUS_CONFIG[status] || { 
    icon: '📋', 
    classes: 'bg-white/10 text-white/50 border-white/10' 
  }

  const label = getStatusLabel(status)

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.classes} flex-shrink-0`}>
      <span>{config.icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}

export default BookingStatusBadge