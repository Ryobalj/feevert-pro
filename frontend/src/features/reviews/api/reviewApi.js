import api from '../../../app/api'

export const getReviews = (params) => api.get('/reviews/', { params })
export const getReview = (id) => api.get(`/reviews/${id}/`)
export const createReview = (data) => api.post('/reviews/', data)
export const markHelpful = (id) => api.post(`/reviews/${id}/helpful/`)
export const markNotHelpful = (id) => api.post(`/reviews/${id}/not_helpful/`)
export const getReviewImages = (reviewId) => api.get(`/reviews/${reviewId}/images/`)
