import api from '../../../app/api'

export const getJobs = (params) => api.get('/jobs/', { params })
export const getJob = (id) => api.get(`/jobs/${id}/`)
export const getJobCategories = () => api.get('/job-categories/')
export const applyForJob = (data) => api.post('/job-applications/', data)
export const getMyApplications = () => api.get('/job-applications/')
export const saveJob = (jobId) => api.post('/saved-jobs/', { job: jobId })
export const getSavedJobs = () => api.get('/saved-jobs/')
export const createJobAlert = (data) => api.post('/job-alerts/', data)
