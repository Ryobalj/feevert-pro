import api from '../../../app/api'

export const getNews = (params) => api.get('/news/', { params })
export const getNewsArticle = (id) => api.get(`/news/${id}/`)
export const getNewsCategories = () => api.get('/news-categories/')
export const getComments = (postId) => api.get(`/comments/?post=${postId}`)
export const postComment = (data) => api.post('/comments/', data)
export const subscribeToNewsletter = (email) => api.post('/newsletter-subscriptions/', { email })
export const unsubscribeFromNewsletter = (email) => api.post('/newsletter-subscriptions/unsubscribe/', { email })
