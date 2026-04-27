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

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!member) return null

  const socialLinks = []
  if (member.email) socialLinks.push({ icon: '✉️', label: 'Email', href: `mailto:${member.email}`, color: 'emerald' })
  if (member.phone) socialLinks.push({ icon: '📞', label: 'Call', href: `tel:${member.phone}`, color: 'green' })
  if (member.linkedin_url) socialLinks.push({ icon: '💼', label: 'LinkedIn', href: member.linkedin_url, color: 'blue' })
  if (member.twitter_url) socialLinks.push({ icon: '🐦', label: 'Twitter', href: member.twitter_url, color: 'cyan' })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-3xl">
        {/* ============ BACK BUTTON ============ */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/team')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Team
        </motion.button>

        {/* ============ PROFILE HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300">
          
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <motion.div 
                  className="absolute -inset-3 bg-emerald-400/10 rounded-full blur-lg"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                {member.profile_picture || member.photo ? (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500">
                    <img src={member.profile_picture || member.photo} alt={member.full_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  </div>
                ) : null}
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center ring-4 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500 shadow-2xl shadow-emerald-500/20 ${member.profile_picture || member.photo ? 'hidden' : 'flex'}`}>
                  <span className="text-5xl font-extrabold text-white">
                    {(member.full_name || '?').charAt(0)}
                  </span>
                </div>

                {/* Active indicator */}
                {member.is_active !== undefined && (
                  <span className={`absolute bottom-3 right-3 w-4 h-4 rounded-full ring-3 ring-[#0d3320] ${
                    member.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
                  }`} />
                )}
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
                {member.full_name}
              </h1>
              <p className="text-emerald-400 font-semibold text-lg mb-1">
                {member.role || member.position || 'Team Member'}
              </p>
              {member.department_name && (
                <p className="text-white/40 text-sm flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {member.department_name}
                </p>
              )}

              {/* Social quick links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                  {socialLinks.map((link) => (
                    <a key={link.label} href={link.href} target={link.href.startsWith('mailto:') || link.href.startsWith('tel:') ? '_self' : '_blank'} rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full glass flex items-center justify-center text-sm hover:border-emerald-400/40 hover:scale-110 transition-all duration-300" title={link.label}>
                      {link.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ============ BIO ============ */}
        {member.bio && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📝</span>
              About
            </h2>
            <div className="text-white/60 leading-relaxed text-sm pl-10">
              {member.bio}
            </div>
          </motion.div>
        )}

        {/* ============ EXPERTISE / SKILLS ============ */}
        {member.expertise && Array.isArray(member.expertise) && member.expertise.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🎯</span>
              Expertise
            </h2>
            <div className="flex flex-wrap gap-2 pl-10">
              {member.expertise.map((skill, i) => (
                <span key={i} className="glass px-3 py-1.5 rounded-full text-xs text-white/60 hover:text-emerald-400 hover:border-emerald-400/30 transition-all duration-300">
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ CONTACT SECTION ============ */}
        {(member.email || member.phone) && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📬</span>
              Contact
            </h2>
            <div className="space-y-3 pl-10">
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-3 text-white/60 hover:text-emerald-400 transition-colors group/link">
                  <span className="w-9 h-9 rounded-xl glass flex items-center justify-center text-sm group-hover/link:scale-110 transition-transform">✉️</span>
                  <span className="text-sm">{member.email}</span>
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-3 text-white/60 hover:text-emerald-400 transition-colors group/link">
                  <span className="w-9 h-9 rounded-xl glass flex items-center justify-center text-sm group-hover/link:scale-110 transition-transform">📞</span>
                  <span className="text-sm">{member.phone}</span>
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