// src/features/bookings/components/BookingStatusBadge.jsx

import React from 'react'
import { getStatusColor } from '../utils/bookingHelpers'

const BookingStatusBadge = ({ status }) => (
  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
    {status}
  </span>
)

export default BookingStatusBadge