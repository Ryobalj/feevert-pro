// src/features/bookings/hooks/useTimeSlots.js

import { useState, useEffect } from 'react'
import api from '../../../app/api'

export const useTimeSlots = (consultantId, date) => {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!consultantId || !date) {
      setTimeSlots([])
      return
    }

    const fetchTimeSlots = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/time-slots/?consultant=${consultantId}&date=${date}&is_booked=false`)
        const data = res.data?.results || res.data
        setTimeSlots(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error loading time slots:', err)
        setError('Failed to load time slots')
      } finally {
        setLoading(false)
      }
    }

    fetchTimeSlots()
  }, [consultantId, date])

  return { timeSlots, loading, error }
}