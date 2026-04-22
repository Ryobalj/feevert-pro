// src/features/bookings/hooks/useBookings.js

import { useState, useEffect } from 'react'
import api from '../../../app/api'

export const useBookings = (initialFilter = 'all') => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState(initialFilter)

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/bookings/')
        setBookings(res.data?.results || res.data || [])
      } catch (err) {
        console.error('Error loading bookings:', err)
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter)

  const refetch = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/')
      setBookings(res.data?.results || res.data || [])
    } catch (err) {
      console.error('Error refetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    bookings: filteredBookings,
    allBookings: bookings,
    loading,
    error,
    filter,
    setFilter,
    refetch
  }
}