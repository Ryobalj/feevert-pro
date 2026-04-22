// src/features/bookings/components/BookingCard.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import BookingStatusBadge from './BookingStatusBadge'
import { formatBookingDate, formatBookingTime } from '../utils/bookingHelpers'

const BookingCard = ({ booking, darkMode }) => (
  <Link to={`/bookings/${booking.id}`}>
    <div className={`modern-card p-5 group cursor-pointer ${
      darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {booking.service_name || 'Consultation'}
            </h3>
            <BookingStatusBadge status={booking.status} />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <BookingInfo label="Date" value={formatBookingDate(booking.slot?.date)} darkMode={darkMode} />
            <BookingInfo label="Time" value={formatBookingTime(booking.slot)} darkMode={darkMode} />
            <BookingInfo label="Consultant" value={booking.consultant_name || 'Assigned soon'} darkMode={darkMode} />
          </div>
          
          {booking.notes && (
            <p className={`text-sm mt-3 line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Notes: {booking.notes}
            </p>
          )}
        </div>
        
        <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
          View Details →
        </span>
      </div>
    </div>
  </Link>
)

const BookingInfo = ({ label, value, darkMode }) => (
  <div>
    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{label}: </span>
    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{value}</span>
  </div>
)

export default BookingCard