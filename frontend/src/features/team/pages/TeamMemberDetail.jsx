import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const TeamMemberDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadMember = async () => {
      try {
        const res = await api.get(`/team-members/${id}/`)
        setMember(res.data)
      } catch (error) {
        console.error('Error loading team member:', error)
        navigate('/team')
      } finally {
        setLoading(false)
      }
    }
    loadMember()
  }, [id, navigate])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!member) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-3xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
          }`}
        >
          ← Back to Team
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 mb-6 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.profile_picture ? (
                <img 
                  src={member.profile_picture} 
                  alt={member.full_name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-green-200 dark:border-green-800"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ${
                  member.profile_picture ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-5xl font-bold text-white">
                  {member.full_name?.charAt(0) || '?'}
                </span>
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {member.full_name}
              </h1>
              <p className="text-green-600 dark:text-green-400 font-medium text-lg mb-2">
                {member.role || member.position}
              </p>
              {member.department_name && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {member.department_name}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        {member.bio && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`modern-card p-6 mb-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              About
            </h2>
            <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {member.bio}
            </p>
          </motion.div>
        )}

        {/* Contact & Social */}
        {(member.email || member.phone) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Contact
            </h2>
            <div className="space-y-2">
              {member.email && (
                <a href={`mailto:${member.email}`} className={`flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <span>📧</span>
                  <span>{member.email}</span>
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className={`flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <span>📞</span>
                  <span>{member.phone}</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default TeamMemberDetail
