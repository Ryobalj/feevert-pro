import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await api.get(`/projects/${id}/`)
        setProject(res.data)
      } catch (error) {
        console.error('Error loading project:', error)
        navigate('/projects')
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [id, navigate])

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const images = project.gallery || []
  if (project.featured_image && !images.includes(project.featured_image)) {
    images.unshift(project.featured_image)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-5xl">
        {/* ============ BACK BUTTON ============ */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </motion.button>

        {/* ============ PROJECT HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300">
          
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          {/* Title + Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
              {project.title}
            </h1>
            {project.status && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                project.status === 'completed' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}>
                {project.status === 'completed' ? '✅' : '🔄'} {project.status}
              </span>
            )}
          </div>
          
          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mb-6">
            {project.client_name && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Client: <span className="text-white/70 font-medium">{project.client_name}</span>
              </div>
            )}
            {project.category_name && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Category: <span className="text-white/70 font-medium">{project.category_name}</span>
              </div>
            )}
            {project.completion_date && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Completed: <span className="text-white/70 font-medium">{project.completion_date}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="h-px bg-white/5 mb-6" />
          <p className="text-white/60 leading-relaxed">
            {project.description}
          </p>
        </motion.div>

        {/* ============ IMAGE GALLERY ============ */}
        {images.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300">
            
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🖼️</span>
              Project Gallery
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img, index) => (
                <motion.div key={index}
                  whileHover={{ scale: 1.03 }}
                  className="relative aspect-[4/3] cursor-pointer rounded-2xl overflow-hidden group/img"
                  onClick={() => setSelectedImage(img)}>
                  <img 
                    src={img} 
                    alt={`Project ${index + 1}`}
                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-700 items-center justify-center hidden">
                    <span className="text-3xl">🖼️</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ PROJECT DETAILS ============ */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Challenge */}
          {project.challenge && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">🎯</span>
                The Challenge
              </h3>
              <p className="text-white/50 leading-relaxed text-sm">{project.challenge}</p>
            </motion.div>
          )}

          {/* Solution */}
          {project.solution && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">💡</span>
                Our Solution
              </h3>
              <p className="text-white/50 leading-relaxed text-sm">{project.solution}</p>
            </motion.div>
          )}

          {/* Results */}
          {project.results && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card p-6 md:col-span-2 group hover:border-emerald-400/20 transition-all duration-300">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-sm">📊</span>
                Results & Impact
              </h3>
              <p className="text-white/50 leading-relaxed text-sm">{project.results}</p>
            </motion.div>
          )}
        </div>

        {/* ============ TESTIMONIALS ============ */}
        {project.testimonials && project.testimonials.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-6 mt-6 group hover:border-emerald-400/20 transition-all duration-300">
            
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">💬</span>
              Client Feedback
            </h2>
            <div className="space-y-4">
              {project.testimonials.map((t, i) => (
                <div key={i} className="glass rounded-2xl p-5 hover:border-emerald-400/20 transition-all duration-300">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, star) => (
                      <svg key={star} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/60 italic mb-3 text-sm leading-relaxed">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                      {t.client_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{t.client_name}</p>
                      <p className="text-white/40 text-xs">{t.client_role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ============ LIGHTBOX MODAL ============ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:border-red-400/50 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={selectedImage} alt="Project"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ProjectDetail