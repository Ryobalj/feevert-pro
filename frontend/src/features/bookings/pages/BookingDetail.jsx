// src/features/bookings/pages/BookingDetail.jsx

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useBookingDetail } from '../hooks/useBookingDetail'
import { BookingStatusBadge } from '../components'
import { formatBookingDate, formatBookingTime, canCancel } from '../utils/bookingHelpers'

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const { booking, loading, cancelling, handleCancel } = useBookingDetail(id)

  if (loading) {
    return <LoadingSpinner darkMode={darkMode} />
  }

  if (!booking) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main max-w-2xl">
        <BackButton onClick={() => navigate(-1)} darkMode={darkMode} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-6 md:p-8 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          <div className="flex items-start justify-between mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Booking Details
            </h1>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="space-y-4">
            <DetailSection>
              <DetailItem label="Service" value={booking.service_name || 'Consultation'} darkMode={darkMode} />
              <DetailItem label="Consultant" value={booking.consultant_name || 'To be assigned'} darkMode={darkMode} />
            </DetailSection>

            <DetailSection>
              <DetailItem label="Date" value={formatBookingDate(booking.slot?.date)} darkMode={darkMode} />
              <DetailItem label="Time" value={formatBookingTime(booking.slot)} darkMode={darkMode} />
            </DetailSection>

            {booking.meeting_link && (
              <DetailSection>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Meeting Link</p>
                  <a 
                    href={booking.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`font-medium hover:underline ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                  >
                    Join Meeting
                  </a>
                </div>
              </DetailSection>
            )}

            {booking.notes && (
              <DetailSection>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Notes</p>
                  <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{booking.notes}</p>
                </div>
              </DetailSection>
            )}

            <DetailSection>
              <DetailItem 
                label="Booked On" 
                value={booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'} 
                darkMode={darkMode} 
              />
            </DetailSection>
          </div>

          {canCancel(booking.status) && (
            <CancelButton onCancel={handleCancel} cancelling={cancelling} darkMode={darkMode} />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

const LoadingSpinner = ({ darkMode }) => (
  <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
    <div className="spinner"></div>
  </div>
)

const BackButton = ({ onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`mb-6 flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'}`}
  >
    ← Back to Bookings
  </button>
)

const DetailSection = ({ children }) => (
  <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
    {children}
  </div>
)

const DetailItem = ({ label, value, darkMode }) => (
  <div>
    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
)

const CancelButton = ({ onCancel, cancelling, darkMode }) => (
  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
    <button
      onClick={onCancel}
      disabled={cancelling}
      className={`px-6 py-2.5 rounded-lg font-medium border transition-colors ${
        darkMode 
          ? 'border-red-500 text-red-400 hover:bg-red-500/10' 
          : 'border-red-500 text-red-600 hover:bg-red-50'
      } ${cancelling ? 'opacity-50' : ''}`}
    >
      {cancelling ? 'Cancelling...' : 'Cancel Booking'}
    </button>
  </div>
)

export default BookingDetail