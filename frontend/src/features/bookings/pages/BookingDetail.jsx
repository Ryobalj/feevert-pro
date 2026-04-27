// src/features/bookings/pages/BookingDetail.jsx

import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useBookingDetail } from '../hooks/useBookingDetail'
import { BookingStatusBadge } from '../components'
import { formatBookingDate, formatBookingTime, canCancel } from '../utils/bookingHelpers'

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const { booking, loading, cancelling, error, handleCancel, refreshBooking } = useBookingDetail(id)

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading booking details...</p>
        </div>
      </div>
    )
  }

  // ============ ERROR ============
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-md"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={refreshBooking} className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 transition-all">
              Try Again
            </button>
            <Link to="/my-bookings" className="btn-primary">
              Back to Bookings
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-10 md:py-16"
    >
      <div className="container-main max-w-2xl">
        {/* ============ BACK BUTTON ============ */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </motion.button>

        {/* ============ MAIN CARD ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                Booking Details
              </h1>
              <p className="text-sm text-white/30 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Booking #{booking.id}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Service & Consultant */}
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                label="Service"
                value={booking.service_name || 'Consultation'}
              />
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="Consultant"
                value={booking.consultant_name || 'To be assigned'}
              />
            </div>

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                label="Date"
                value={formatBookingDate(booking.slot?.date)}
              />
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Time"
                value={formatBookingTime(booking.slot)}
              />
            </div>

            {/* Meeting Link */}
            {booking.meeting_link && (
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
                label="Meeting Link"
                value={
                  <a 
                    href={booking.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    Join Meeting
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                }
              />
            )}

            {/* Notes */}
            {booking.notes && (
              <DetailCard
                icon={
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                label="Notes"
                value={booking.notes}
                fullWidth
              />
            )}

            {/* Booked On */}
            <DetailCard
              icon={
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Booked On"
              value={booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}
            />
          </div>

          {/* Cancel Button */}
          {canCancel(booking.status) && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="group relative inline-flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 px-6 py-3 rounded-full font-semibold text-sm border border-red-500/20 hover:border-red-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Booking
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============ DETAIL CARD ============
const DetailCard = ({ icon, label, value, fullWidth = false }) => (
  <div className={`glass rounded-2xl p-4 hover:border-emerald-400/20 transition-all duration-300 group/card ${fullWidth ? 'col-span-full' : ''}`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="flex-shrink-0">{icon}</span>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
        {label}
      </p>
    </div>
    <div className="text-white font-medium pl-8">
      {value}
    </div>
  </div>
)

export default BookingDetail