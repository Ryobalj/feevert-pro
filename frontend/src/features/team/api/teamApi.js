import api from '../../../app/api'

export const getTeamMembers = (params) => api.get('/team-members/', { params })
export const getTeamMember = (id) => api.get(`/team-members/${id}/`)
export const getDepartments = () => api.get('/departments/')
export const getDepartment = (id) => api.get(`/departments/${id}/`)
