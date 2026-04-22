// src/features/bookings/components/BookingFilters.jsx

import React from 'react'
import { BOOKING_STATUSES } from '../utils/constants'

const BookingFilters = ({ currentFilter, onFilterChange, darkMode }) => (
  <div className="flex flex-wrap gap-2">
    {BOOKING_STATUSES.map(status => (
      <button
        key={status}
        onClick={() => onFilterChange(status)}
        className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
          currentFilter === status
            ? 'bg-green-600 text-white'
            : darkMode 
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        {status}
      </button>
    ))}
  </div>
)

export default BookingFilters