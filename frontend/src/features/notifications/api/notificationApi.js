import api from '../../../app/api'

export const getNotifications = (params) => api.get('/notifications/', { params })
export const getNotification = (id) => api.get(`/notifications/${id}/`)
export const markAsRead = (id) => api.post(`/notifications/${id}/mark_read/`)
export const markAllAsRead = () => api.post('/notifications/mark_all_read/')
export const deleteNotification = (id) => api.delete(`/notifications/${id}/`)
export const getNotificationSettings = () => api.get('/notification-settings/')
export const updateNotificationSettings = (data) => api.patch('/notification-settings/', data)
