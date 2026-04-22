import React from 'react'
import { Link } from 'react-router-dom'

const BookingItem = ({ booking, darkMode, showClient = false }) => {
  const getStatusColor = (status) => {
    const colors = {
      confirmed: darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
      pending: darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      completed: darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
      cancelled: darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
    }
    return colors[booking.status] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
  }

  return (
    <Link to={`/bookings/${booking.id}`} className={`block p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {booking.service_name || 'Booking'}
          </p>
          {showClient && booking.client_name && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Client: {booking.client_name}
            </p>
          )}
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {booking.slot?.date ? new Date(booking.slot.date).toLocaleDateString() : 'Date TBD'}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>
    </Link>
  )
}

export default BookingItem
