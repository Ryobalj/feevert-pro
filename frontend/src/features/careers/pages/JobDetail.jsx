import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const JobDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', cover_letter: '', cv_file: null })
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}/`)
        setJob(res.data)
      } catch (error) {
        console.error('Error loading job:', error)
        navigate('/careers')
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.cv_file) {
      setError('Please upload your CV')
      return
    }
    
    setSubmitting(true)
    
    const data = new FormData()
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key])
    })
    data.append('job', id)
    
    try {
      await api.post('/job-applications/', data)
      setSubmitted(true)
      setFormData({ full_name: '', email: '', phone: '', cover_letter: '', cv_file: null })
      setFileName('')
    } catch (err) {
      console.error('Error submitting application:', err)
      setError(err.response?.data?.error || 'Error submitting application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isExpired = job?.deadline && new Date(job.deadline) < new Date()
  const daysLeft = job?.deadline 
    ? Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-10 md:py-16"
    >
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/careers')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Careers
        </motion.button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ============ MAIN CONTENT ============ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  {job.title}
                </h1>
                <div className="flex items-center gap-2">
                  {job.is_featured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      ⭐ Featured
                    </span>
                  )}
                  {isExpired && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                      ❌ Expired
                    </span>
                  )}
                </div>
              </div>
              
              {/* Meta Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 text-sm text-white/50">
                  <svg className="w-4 h-4 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location || 'Various'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {job.employment_type_display || job.employment_type}
                </span>
                {job.experience_level && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    {job.experience_level_display || job.experience_level}
                  </span>
                )}
                {job.remote_option && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    {job.remote_option_display || job.remote_option}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-400 rounded-full" />
                    Job Description
                  </h3>
                  <div className="text-white/60 leading-relaxed text-sm whitespace-pre-line pl-4">
                    {job.description}
                  </div>
                </div>

                {job.requirements && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
                      Requirements
                    </h3>
                    <div className="text-white/60 leading-relaxed text-sm whitespace-pre-line pl-4">
                      {job.requirements}
                    </div>
                  </div>
                )}

                {job.responsibilities && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-5 bg-blue-400 rounded-full" />
                      Responsibilities
                    </h3>
                    <div className="text-white/60 leading-relaxed text-sm whitespace-pre-line pl-4">
                      {job.responsibilities}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Application Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6 md:p-8 group hover:border-emerald-400/20 transition-all duration-300"
              id="apply-form"
            >
              <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📝</span>
                Apply for this position
              </h2>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="relative inline-block mb-6"
                    >
                      <div className="absolute -inset-6 bg-emerald-400/15 rounded-full blur-xl" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2">Application Submitted!</h3>
                    <p className="text-white/50 text-sm">We'll review your application and get back to you soon.</p>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-4" exit={{ opacity: 0 }}>
                    {/* Error */}
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                      </motion.div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Full Name <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required
                            className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm" placeholder="Your full name" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Email <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </div>
                          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required
                            className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm" placeholder="Your email" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Phone</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm" placeholder="Your phone number" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Cover Letter</label>
                      <textarea value={formData.cover_letter} onChange={(e) => setFormData({...formData, cover_letter: e.target.value})} rows="4"
                        className="w-full px-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm resize-none"
                        placeholder="Tell us why you're a great fit for this role..." />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">CV / Resume <span className="text-red-400">*</span></label>
                      <input type="file" id="cv-upload-detail" accept=".pdf,.doc,.docx" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) { setFormData({...formData, cv_file: file}); setFileName(file.name); setError('') }
                        }} />
                      <label htmlFor="cv-upload-detail" className={`flex items-center justify-center gap-3 w-full p-4 glass rounded-xl cursor-pointer hover:border-emerald-400/30 transition-all duration-300 ${fileName ? 'border-emerald-400/30' : ''}`}>
                        {fileName ? (
                          <>
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-emerald-400 text-sm font-medium truncate max-w-[200px]">{fileName}</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFileName(''); setFormData({...formData, cv_file: null}) }}
                              className="ml-auto text-white/30 hover:text-red-400 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-white/40 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="text-white/40 text-sm">Upload CV</span>
                          </>
                        )}
                      </label>
                      <p className="text-[10px] text-white/25 mt-1.5">PDF, DOC, or DOCX (Max 5MB)</p>
                    </div>
                    
                    <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full group relative overflow-hidden">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={submitting ? {} : { x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
                      {submitting ? (
                        <span className="relative z-10 flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting...</span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Submit Application</span>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ============ SIDEBAR ============ */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 sticky top-24 group hover:border-emerald-400/20 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📋</span>
                Job Overview
              </h3>
              
              <div className="space-y-4">
                {job.salary_range_min && job.salary_range_max && (
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Salary Range</p>
                    <p className="font-bold text-white text-sm">
                      {job.salary_currency || 'TZS'} {parseInt(job.salary_range_min).toLocaleString()} - {parseInt(job.salary_range_max).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {job.vacancies_count && (
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Vacancies</p>
                    <p className="font-bold text-white text-sm">
                      {job.vacancies_count} position{job.vacancies_count > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                {job.deadline && (
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Deadline</p>
                    <p className="font-bold text-white text-sm">
                      {new Date(job.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {!isExpired && daysLeft !== null && daysLeft <= 14 && (
                      <p className={`text-[10px] mt-1 font-medium ${daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                        {daysLeft} day{daysLeft > 1 ? 's' : ''} remaining
                      </p>
                    )}
                  </div>
                )}
                
                <div className="h-px bg-white/5" />
                
                <button 
                  onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-primary btn-lg w-full group relative overflow-hidden"
                >
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default JobDetail