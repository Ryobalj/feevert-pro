// src/features/bookings/utils/bookingHelpers.js

import { STATUS_STYLES } from './constants'

export const getStatusColor = (status) => {
  return STATUS_STYLES[status] || STATUS_STYLES.default
}

export const formatBookingDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

export const formatBookingTime = (slot) => {
  if (!slot?.start_time) return 'N/A'
  return slot.end_time ? `${slot.start_time} - ${slot.end_time}` : slot.start_time
}

export const canCancel = (status) => ['pending', 'confirmed'].includes(status)