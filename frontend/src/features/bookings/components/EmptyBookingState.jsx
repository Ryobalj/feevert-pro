// src/features/bookings/components/EmptyBookingState.jsx

import React from 'react'
import { Link } from 'react-router-dom'

const EmptyBookingState = ({ filter, darkMode }) => (
  <div className={`modern-card p-12 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
    <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      No {filter !== 'all' ? filter : ''} bookings found.
    </p>
    <Link to="/book-appointment">
      <button className="glow-button px-6 py-2.5">
        Book an Appointment
      </button>
    </Link>
  </div>
)

export default EmptyBookingState