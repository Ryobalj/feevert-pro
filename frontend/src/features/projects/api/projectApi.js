import api from '../../../app/api'

export const getProjects = (params) => api.get('/projects/', { params })
export const getProject = (id) => api.get(`/projects/${id}/`)
export const getProjectCategories = () => api.get('/project-categories/')
export const getProjectTags = () => api.get('/project-tags/')
