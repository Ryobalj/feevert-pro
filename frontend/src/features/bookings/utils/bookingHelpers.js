// src/features/bookings/utils/bookingHelpers.js

import i18n from 'i18next'

/**
 * Format a date string to a readable format
 * @param {string} date - Date string
 * @param {string} format - 'full', 'short', 'month', 'relative'
 * @returns {string} Formatted date
 */
export const formatBookingDate = (date, format = 'full') => {
  if (!date) return i18n.t('booking.na', { ns: 'booking' }) || 'N/A'
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return i18n.t('booking.na', { ns: 'booking' }) || 'N/A'

  // Get current language
  const lang = i18n.language || 'en'
  
  // Format based on language
  const formatMap = {
    full: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    month: {
      year: 'numeric',
      month: 'long',
    },
    day: {
      weekday: 'long',
      day: 'numeric',
    },
  }

  return dateObj.toLocaleDateString(lang, formatMap[format] || formatMap.full)
}

/**
 * Format time slot
 * @param {object} slot - Time slot object with start_time and end_time
 * @returns {string} Formatted time
 */
export const formatBookingTime = (slot) => {
  if (!slot?.start_time) return i18n.t('booking.na', { ns: 'booking' }) || 'N/A'
  return slot.end_time ? `${slot.start_time} - ${slot.end_time}` : slot.start_time
}

/**
 * Format slot duration in minutes
 * @param {object} slot - Time slot object
 * @returns {string} Duration string
 */
export const formatDuration = (slot) => {
  if (!slot?.start_time || !slot?.end_time) return ''
  
  const [startH, startM] = slot.start_time.split(':').map(Number)
  const [endH, endM] = slot.end_time.split(':').map(Number)
  const minutes = (endH * 60 + endM) - (startH * 60 + startM)
  
  const t = i18n.getFixedT(null, 'booking')
  
  if (minutes < 60) return `${minutes} ${t('time.min')}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins > 0) return `${hours}${t('time.hr')} ${mins}${t('time.min')}`
  return `${hours}${t('time.hr')}`
}

/**
 * Check if booking can be cancelled
 * @param {string} status - Booking status
 * @returns {boolean}
 */
export const canCancel = (status) => ['pending', 'confirmed'].includes(status)

/**
 * Check if booking can be rescheduled
 * @param {string} status - Booking status
 * @returns {boolean}
 */
export const canReschedule = (status) => ['pending', 'confirmed'].includes(status)

/**
 * Check if booking is in the past
 * @param {object} booking - Booking object
 * @returns {boolean}
 */
export const isPastBooking = (booking) => {
  if (!booking?.slot?.date) return false
  const bookingDate = new Date(booking.slot.date)
  
  if (booking.slot.end_time) {
    const [endH, endM] = booking.slot.end_time.split(':').map(Number)
    bookingDate.setHours(endH, endM, 0, 0)
  }
  
  return bookingDate < new Date()
}

/**
 * Check if booking is upcoming (within 24 hours)
 * @param {object} booking - Booking object
 * @returns {boolean}
 */
export const isUpcoming = (booking) => {
  if (!booking?.slot?.date) return false
  const bookingDate = new Date(booking.slot.date)
  
  if (booking.slot.start_time) {
    const [startH, startM] = booking.slot.start_time.split(':').map(Number)
    bookingDate.setHours(startH, startM, 0, 0)
  }
  
  const diffMs = bookingDate - new Date()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours > 0 && diffHours <= 24
}

/**
 * Get relative time string
 * @param {string} date - Date string
 * @returns {string} Relative time (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diffMs = target - now
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  
  const t = i18n.getFixedT(null, 'booking')
  
  // Future
  if (diffDays > 0) {
    return `${t('time.in')} ${diffDays} ${t('time.day')}${diffDays > 1 ? 's' : ''}`
  }
  // Past
  if (diffDays < 0) {
    const days = Math.abs(diffDays)
    return `${days} ${t('time.day')}${days > 1 ? 's' : ''} ${t('time.ago')}`
  }
  // Hours
  if (diffHours > 0) {
    return `${t('time.in')} ${diffHours} ${t('time.hour')}${diffHours > 1 ? 's' : ''}`
  }
  if (diffHours < 0) {
    const hours = Math.abs(diffHours)
    return `${hours} ${t('time.hour')}${hours > 1 ? 's' : ''} ${t('time.ago')}`
  }
  // Minutes
  if (diffMinutes > 0) {
    return `${t('time.in')} ${diffMinutes} ${t('time.min')}`
  }
  if (diffMinutes < 0) {
    const mins = Math.abs(diffMinutes)
    return `${mins} ${t('time.min')} ${t('time.ago')}`
  }
  return t('time.now')
}

/**
 * Get status display info
 * @param {string} status - Booking status
 * @returns {object} { icon, label, color }
 */
export const getStatusInfo = (status) => {
  const t = i18n.getFixedT(null, 'booking')
  
  const statusMap = {
    pending: { icon: '⏳', label: t('status.pending'), color: 'amber' },
    confirmed: { icon: '✅', label: t('status.confirmed'), color: 'emerald' },
    completed: { icon: '✔️', label: t('status.completed'), color: 'blue' },
    cancelled: { icon: '❌', label: t('status.cancelled'), color: 'red' },
    in_progress: { icon: '🔄', label: t('status.in_progress'), color: 'purple' },
    approved: { icon: '✅', label: t('status.approved'), color: 'emerald' },
    rejected: { icon: '🚫', label: t('status.rejected'), color: 'red' },
  }
  return statusMap[status] || { 
    icon: '📋', 
    label: status?.replace('_', ' ') || t('status.unknown'), 
    color: 'gray' 
  }
}

/**
 * Sort bookings by date
 * @param {array} bookings - Array of bookings
 * @param {string} order - 'asc' or 'desc'
 * @returns {array} Sorted bookings
 */
export const sortBookingsByDate = (bookings, order = 'asc') => {
  return [...bookings].sort((a, b) => {
    const dateA = a.slot?.date ? new Date(a.slot.date) : new Date(0)
    const dateB = b.slot?.date ? new Date(b.slot.date) : new Date(0)
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}

/**
 * Filter bookings by search query
 * @param {array} bookings - Array of bookings
 * @param {string} query - Search query
 * @returns {array} Filtered bookings
 */
export const searchBookings = (bookings, query) => {
  if (!query?.trim()) return bookings
  const q = query.toLowerCase().trim()
  return bookings.filter(b => 
    b.service_name?.toLowerCase().includes(q) ||
    b.consultant_name?.toLowerCase().includes(q) ||
    b.notes?.toLowerCase().includes(q) ||
    b.status?.toLowerCase().includes(q)
  )
}

/**
 * Get booking summary text
 * @param {object} booking - Booking object
 * @returns {string} Summary text
 */
export const getBookingSummary = (booking) => {
  if (!booking) return ''
  const parts = []
  if (booking.service_name) parts.push(booking.service_name)
  if (booking.slot?.date) parts.push(formatBookingDate(booking.slot.date, 'short'))
  if (booking.slot) parts.push(formatBookingTime(booking.slot))
  return parts.join(' • ')
}