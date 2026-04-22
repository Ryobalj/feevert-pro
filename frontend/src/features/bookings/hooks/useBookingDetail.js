// src/features/bookings/hooks/useBookingDetail.js

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../app/api'

export const useBookingDetail = (id) => {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

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
    if (id) loadBooking()
  }, [id, navigate])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(true)
    try {
      await api.post(`/bookings/${id}/cancel/`)
      setBooking(prev => ({ ...prev, status: 'cancelled' }))
    } catch (error) {
      alert('Error cancelling booking')
    } finally {
      setCancelling(false)
    }
  }

  return { booking, loading, cancelling, handleCancel }
}