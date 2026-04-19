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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!project) return null

  const images = project.gallery || []
  if (project.featured_image && !images.includes(project.featured_image)) {
    images.unshift(project.featured_image)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-5xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
          }`}
        >
          ← Back to Projects
        </motion.button>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 mb-6 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <h1 className={`text-3xl md:text-4xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {project.title}
            </h1>
            {project.status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {project.status}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            {project.client_name && (
              <div className={`flex items-center gap-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>👤</span>
                <span>Client: <span className="font-medium">{project.client_name}</span></span>
              </div>
            )}
            {project.category_name && (
              <div className={`flex items-center gap-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>📂</span>
                <span>Category: <span className="font-medium">{project.category_name}</span></span>
              </div>
            )}
            {project.completion_date && (
              <div className={`flex items-center gap-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>📅</span>
                <span>Completed: <span className="font-medium">{project.completion_date}</span></span>
              </div>
            )}
          </div>
          
          <p className={`text-lg leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {project.description}
          </p>
        </motion.div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`modern-card p-6 mb-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Project Gallery
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="relative h-32 md:h-40 cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => setSelectedImage(img)}
                >
                  <img 
                    src={img} 
                    alt={`Project ${index + 1}`}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className={`w-full h-full bg-gradient-to-br from-green-600 to-green-800 items-center justify-center hidden`}>
                    <span className="text-2xl">🖼️</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Project Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {project.challenge && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`modern-card p-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span>🎯</span> The Challenge
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {project.challenge}
              </p>
            </motion.div>
          )}

          {project.solution && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`modern-card p-6 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span>💡</span> Our Solution
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {project.solution}
              </p>
            </motion.div>
          )}

          {project.results && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`modern-card p-6 md:col-span-2 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span>📊</span> Results & Impact
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {project.results}
              </p>
            </motion.div>
          )}
        </div>

        {/* Testimonials if any */}
        {project.testimonials && project.testimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`modern-card p-6 mt-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Client Feedback
            </h2>
            <div className="space-y-4">
              {project.testimonials.map((t, i) => (
                <div key={i} className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <p className={`italic mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    "{t.content}"
                  </p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    — {t.client_name}, {t.client_role}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Project"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ProjectDetail
