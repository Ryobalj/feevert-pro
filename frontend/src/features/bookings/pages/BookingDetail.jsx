import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}/`)
        setBooking(res.data)
      } catch (error) {
        console.error('Error loading booking:', error)
        navigate('/my-bookings')
      } finally {
        setLoading(false)
      }
    }
    loadBooking()
  }, [id, navigate])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(true)
    try {
      await api.post(`/bookings/${id}/cancel/`)
      setBooking({ ...booking, status: 'cancelled' })
    } catch (error) {
      alert('Error cancelling booking')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'}`}
        >
          ← Back to Bookings
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-6 md:p-8 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}
        >
          <div className="flex items-start justify-between mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Booking Details
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Service</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.service_name || 'Consultation'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consultant</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.consultant_name || 'To be assigned'}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.slot?.date ? new Date(booking.slot.date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {booking.slot?.start_time} - {booking.slot?.end_time || 'N/A'}
                </p>
              </div>
            </div>

            {booking.meeting_link && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
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
            )}

            {booking.notes && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Notes</p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{booking.notes}</p>
              </div>
            )}

            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Booked On</p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {['pending', 'confirmed'].includes(booking.status) && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
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
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default BookingDetail
