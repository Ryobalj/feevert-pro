import api from '../../../app/api'

export const getConsultations = () => api.get('/consultation-requests/')
export const getConsultation = (id) => api.get(`/consultation-requests/${id}/`)
export const createConsultation = (data) => api.post('/consultation-requests/', data)
export const cancelConsultation = (id) => api.post(`/consultation-requests/${id}/cancel/`)
export const getServices = () => api.get('/consultation-services/')
export const getService = (id) => api.get(`/consultation-services/${id}/`)
export const getCategories = () => api.get('/consultation-categories/')
