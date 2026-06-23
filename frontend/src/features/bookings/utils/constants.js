// src/features/bookings/utils/constants.js

import i18n from 'i18next'

// ============ BOOKING STATUSES ============
export const BOOKING_STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

// ============ STATUS STYLES ============
export const STATUS_STYLES = {
  confirmed: 'badge-success',
  pending: 'badge-warning',
  completed: 'badge-primary',
  cancelled: 'badge-danger',
  in_progress: 'badge-primary',
  approved: 'badge-success',
  rejected: 'badge-danger',
  default: 'badge-primary',
}

// ============ STATUS CONFIG (Detailed) - LAZY LOADING ============
// Tumia functions badala ya objects moja kwa moja
export const getStatusConfig = () => {
  const t = i18n.t.bind(i18n) // ✅ Bind i18n.t
  
  return {
    pending: {
      icon: '⏳',
      label: t('booking:status.pending'),
      color: 'amber',
      bgClass: 'bg-amber-500/15',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/20',
    },
    confirmed: {
      icon: '✅',
      label: t('booking:status.confirmed'),
      color: 'emerald',
      bgClass: 'bg-emerald-500/15',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/20',
    },
    completed: {
      icon: '✔️',
      label: t('booking:status.completed'),
      color: 'blue',
      bgClass: 'bg-blue-500/15',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/20',
    },
    cancelled: {
      icon: '❌',
      label: t('booking:status.cancelled'),
      color: 'red',
      bgClass: 'bg-red-500/15',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/20',
    },
    in_progress: {
      icon: '🔄',
      label: t('booking:status.in_progress'),
      color: 'purple',
      bgClass: 'bg-purple-500/15',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/20',
    },
    approved: {
      icon: '✅',
      label: t('booking:status.approved'),
      color: 'emerald',
      bgClass: 'bg-emerald-500/15',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/20',
    },
    rejected: {
      icon: '🚫',
      label: t('booking:status.rejected'),
      color: 'red',
      bgClass: 'bg-red-500/15',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/20',
    },
  }
}

// ============ STATUS ICONS ============
export const STATUS_ICONS = {
  all: '📋',
  pending: '⏳',
  confirmed: '✅',
  completed: '✔️',
  cancelled: '❌',
  in_progress: '🔄',
  approved: '✅',
  rejected: '🚫',
}

// ============ EMPTY STATE MESSAGES - LAZY LOADING ============
export const getEmptyBookingMessages = () => {
  const t = i18n.t.bind(i18n) // ✅ Bind i18n.t
  
  return {
    all: {
      icon: '📋',
      title: t('booking:empty.all.title'),
      description: t('booking:empty.all.description'),
      action: t('booking:empty.all.action'),
      link: '/book-appointment',
    },
    pending: {
      icon: '⏳',
      title: t('booking:empty.pending.title'),
      description: t('booking:empty.pending.description'),
      action: t('booking:empty.pending.action'),
      link: '/services',
    },
    confirmed: {
      icon: '✅',
      title: t('booking:empty.confirmed.title'),
      description: t('booking:empty.confirmed.description'),
      action: t('booking:empty.confirmed.action'),
      link: '/book-appointment',
    },
    completed: {
      icon: '✔️',
      title: t('booking:empty.completed.title'),
      description: t('booking:empty.completed.description'),
      action: t('booking:empty.completed.action'),
      link: '/services',
    },
    cancelled: {
      icon: '❌',
      title: t('booking:empty.cancelled.title'),
      description: t('booking:empty.cancelled.description'),
      action: t('booking:empty.cancelled.action'),
      link: '/my-bookings',
    },
  }
}

// ============ TIME SLOT GROUPS - LAZY LOADING ============
export const getTimeSlotGroups = () => {
  const t = i18n.t.bind(i18n) // ✅ Bind i18n.t
  
  return {
    morning: { start: 6, end: 12, label: t('booking:period.morning'), icon: '🌅' },
    afternoon: { start: 12, end: 17, label: t('booking:period.afternoon'), icon: '☀️' },
    evening: { start: 17, end: 24, label: t('booking:period.evening'), icon: '🌆' },
  }
}

// ============ SORT OPTIONS - LAZY LOADING ============
export const getSortOptions = () => {
  const t = i18n.t.bind(i18n) // ✅ Bind i18n.t
  
  return [
    { value: 'date_asc', label: t('booking:sort.date_asc') },
    { value: 'date_desc', label: t('booking:sort.date_desc') },
    { value: 'service_asc', label: t('booking:sort.service_asc') },
    { value: 'service_desc', label: t('booking:sort.service_desc') },
    { value: 'status', label: t('booking:sort.status') },
  ]
}

// ============ BOOKING LIMITS ============
export const BOOKING_LIMITS = {
  MIN_DATE_DAYS_AHEAD: 1,
  MAX_DATE_DAYS_AHEAD: 60,
  MIN_DURATION_MINUTES: 30,
  MAX_NOTES_LENGTH: 500,
}

// ============ BOOKING ACTIONS ============
export const BOOKING_ACTIONS = {
  CANCEL: 'cancel',
  RESCHEDULE: 'reschedule',
  VIEW_DETAILS: 'view_details',
  JOIN_MEETING: 'join_meeting',
  ADD_NOTES: 'add_notes',
}

// ============ ITEMS PER PAGE ============
export const ITEMS_PER_PAGE = 10

// ============ DATE FORMATS ============
export const DATE_FORMATS = {
  FULL: 'full',
  SHORT: 'short',
  MONTH: 'month',
  DAY: 'day',
}

// ============ BOOKING EVENTS ============
export const BOOKING_EVENTS = {
  CREATED: 'booking_created',
  CONFIRMED: 'booking_confirmed',
  CANCELLED: 'booking_cancelled',
  COMPLETED: 'booking_completed',
  RESCHEDULED: 'booking_rescheduled',
  REMINDER: 'booking_reminder',
}