// src/features/bookings/hooks/useBookingDetail.js

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../app/api'

export const useBookingDetail = (id) => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // ============ LOAD BOOKING ============
  const loadBooking = useCallback(async (showLoader = true) => {
    if (!id) return
    
    if (showLoader) setLoading(true)
    else setRefreshing(true)
    
    setError(null)
    
    try {
      const res = await api.get(`/bookings/${id}/`)
      setBooking(res.data)
    } catch (err) {
      console.error('Error loading booking:', err)
      
      if (err.response?.status === 404) {
        setError('Booking not found')
        setTimeout(() => navigate('/my-bookings', { replace: true }), 1500)
      } else if (err.response?.status === 401) {
        navigate('/login', { replace: true })
      } else {
        setError('Failed to load booking details. Please try again.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, navigate])

  // ============ INITIAL LOAD ============
  useEffect(() => {
    loadBooking()
  }, [loadBooking])

  // ============ CANCEL BOOKING ============
  const handleCancel = useCallback(async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return
    
    setCancelling(true)
    setError(null)
    
    try {
      await api.post(`/bookings/${id}/cancel/`)
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null)
      return true
    } catch (err) {
      console.error('Error cancelling booking:', err)
      
      if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'This booking cannot be cancelled.')
      } else if (err.response?.status === 404) {
        setError('Booking not found.')
      } else {
        setError('Error cancelling booking. Please try again.')
      }
      return false
    } finally {
      setCancelling(false)
    }
  }, [id])

  // ============ RESCHEDULE BOOKING ============
  const handleReschedule = useCallback(async (newSlotId) => {
    if (!newSlotId) return false
    
    try {
      const res = await api.post(`/bookings/${id}/reschedule/`, { slot: newSlotId })
      setBooking(res.data)
      return true
    } catch (err) {
      console.error('Error rescheduling booking:', err)
      setError(err.response?.data?.error || 'Error rescheduling booking. Please try again.')
      return false
    }
  }, [id])

  // ============ REFRESH ============
  const refreshBooking = useCallback(() => {
    loadBooking(false)
  }, [loadBooking])

  // ============ CLEAR ERROR ============
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ============ HELPERS ============
  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed'
  const canReschedule = booking?.status === 'pending' || booking?.status === 'confirmed'
  const isPast = booking?.slot?.date ? new Date(booking.slot.date) < new Date() : false

  return { 
    // State
    booking, 
    loading, 
    cancelling, 
    refreshing,
    error,
    
    // Actions
    handleCancel,
    handleReschedule,
    refreshBooking,
    clearError,
    
    // Helpers
    canCancel,
    canReschedule,
    isPast,
    isActive: booking?.status === 'confirmed' || booking?.status === 'pending',
    isCompleted: booking?.status === 'completed',
    isCancelled: booking?.status === 'cancelled',
  }
}