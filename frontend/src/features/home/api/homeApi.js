// src/features/home/api/homeApi.js

import api from '../../../app/api'

export const fetchHomepageData = () => api.get('/homepage/')
export const fetchServices = () => api.get('/consultation-services/')
export const fetchProjects = () => api.get('/projects/')
export const fetchTeam = () => api.get('/team-members/')
export const fetchTestimonials = () => api.get('/testimonials/')
export const fetchSiteSettings = () => api.get('/site-settings/')
export const fetchFaqs = () => api.get('/faqs/')
export const fetchPartners = () => api.get('/partners/')
export const sendContactMessage = (data) => api.post('/contact-messages/', data)

// ✅ What We Do
export const fetchWhatWeDo = () => api.get('/what-we-do/')
export const fetchWhatWeDoSlides = () => api.get('/what-we-do-slides/')