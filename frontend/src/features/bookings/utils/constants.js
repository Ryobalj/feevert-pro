// src/features/bookings/utils/constants.js

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

// ============ STATUS CONFIG (Detailed) ============
export const STATUS_CONFIG = {
  pending: {
    icon: '⏳',
    label: 'Pending',
    color: 'amber',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  confirmed: {
    icon: '✅',
    label: 'Confirmed',
    color: 'emerald',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  completed: {
    icon: '✔️',
    label: 'Completed',
    color: 'blue',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  cancelled: {
    icon: '❌',
    label: 'Cancelled',
    color: 'red',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
  },
  in_progress: {
    icon: '🔄',
    label: 'In Progress',
    color: 'purple',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/20',
  },
  approved: {
    icon: '✅',
    label: 'Approved',
    color: 'emerald',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  rejected: {
    icon: '🚫',
    label: 'Rejected',
    color: 'red',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
  },
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

// ============ EMPTY STATE MESSAGES ============
export const EMPTY_BOOKING_MESSAGES = {
  all: {
    icon: '📋',
    title: 'No bookings yet',
    description: "You haven't made any bookings yet. Start by booking an appointment with our experts.",
    action: 'Book an Appointment',
    link: '/book-appointment',
  },
  pending: {
    icon: '⏳',
    title: 'No pending bookings',
    description: "You don't have any pending bookings. All caught up!",
    action: 'Browse Services',
    link: '/services',
  },
  confirmed: {
    icon: '✅',
    title: 'No confirmed bookings',
    description: "You don't have any confirmed bookings yet. Book a service to get started.",
    action: 'Book Now',
    link: '/book-appointment',
  },
  completed: {
    icon: '✔️',
    title: 'No completed bookings',
    description: "You haven't completed any bookings yet. Your history will appear here.",
    action: 'View Services',
    link: '/services',
  },
  cancelled: {
    icon: '❌',
    title: 'No cancelled bookings',
    description: "You don't have any cancelled bookings. Great job keeping your appointments!",
    action: 'View Bookings',
    link: '/my-bookings',
  },
}

// ============ TIME SLOT GROUPS ============
export const TIME_SLOT_GROUPS = {
  morning: { start: 6, end: 12, label: 'Morning', icon: '🌅' },
  afternoon: { start: 12, end: 17, label: 'Afternoon', icon: '☀️' },
  evening: { start: 17, end: 24, label: 'Evening', icon: '🌆' },
}

// ============ BOOKING LIMITS ============
export const BOOKING_LIMITS = {
  MIN_DATE_DAYS_AHEAD: 1,     // Can't book same day
  MAX_DATE_DAYS_AHEAD: 60,    // Can book up to 60 days ahead
  MIN_DURATION_MINUTES: 30,   // Minimum booking duration
  MAX_NOTES_LENGTH: 500,      // Maximum notes length
}

// ============ BOOKING ACTIONS ============
export const BOOKING_ACTIONS = {
  CANCEL: 'cancel',
  RESCHEDULE: 'reschedule',
  VIEW_DETAILS: 'view_details',
  JOIN_MEETING: 'join_meeting',
  ADD_NOTES: 'add_notes',
}

// ============ SORT OPTIONS ============
export const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Date (Oldest first)' },
  { value: 'date_desc', label: 'Date (Newest first)' },
  { value: 'service_asc', label: 'Service (A-Z)' },
  { value: 'service_desc', label: 'Service (Z-A)' },
  { value: 'status', label: 'Status' },
]

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