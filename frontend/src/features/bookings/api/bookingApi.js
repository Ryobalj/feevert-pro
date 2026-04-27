import api from '../../../app/api'

export const getBookings = () => api.get('/bookings/')
export const getBooking = (id) => api.get(`/bookings/${id}/`)
export const createBooking = (data) => api.post('/bookings/', data)
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel/`)
export const confirmBooking = (id) => api.post(`/bookings/${id}/confirm/`)
export const getTimeSlots = (params) => api.get('/time-slots/', { params })
export const getAvailabilities = () => api.get('/availabilities/')
