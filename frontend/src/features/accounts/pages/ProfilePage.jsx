import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import api from '../../../app/api'

const ProfilePage = () => {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', bio: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const { darkMode } = useTheme()
  const { user, updateUser } = useAuth()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/profiles/')
        const data = res.data?.results?.[0] || res.data?.[0] || res.data
        setProfile(data)
        setFormData({
          full_name: data?.full_name || user?.full_name || '',
          email: data?.email || user?.email || '',
          phone: data?.phone || '',
          bio: data?.bio || '',
          address: data?.address || ''
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    
    try {
      await api.patch('/profiles/', formData)
      setMessage('Profile updated successfully!')
      setMessageType('success')
      // Update local user state
      updateUser?.({ full_name: formData.full_name })
      // Auto-dismiss message
      setTimeout(() => setMessage(''), 4000)
    } catch (error) {
      setMessage('Error updating profile. Please try again.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-10 md:py-16"
    >
      <div className="container-main max-w-3xl">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p className="mt-2 text-white/40 text-sm">Manage your personal information</p>
        </motion.div>

        {/* ============ MESSAGE ============ */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-2xl text-center text-sm font-medium flex items-center justify-center gap-2 ${
              messageType === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {messageType === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message}
          </motion.div>
        )}

        {/* ============ CONTENT GRID ============ */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar - Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <div className="glass-card p-6 text-center sticky top-24 group hover:border-emerald-400/20 transition-all duration-300">
              {/* Avatar with glow */}
              <div className="relative inline-block mb-5">
                <motion.div 
                  className="absolute -inset-2 bg-emerald-400/10 rounded-full blur-lg"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-white/10">
                  <span className="text-3xl font-extrabold text-white">
                    {(profile?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-white text-lg mb-1">
                {profile?.full_name || user?.username}
              </h3>
              <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-4">
                {user?.role_name || user?.role?.name || 'Client'}
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Member since</p>
                <p className="text-sm font-semibold text-white/70">
                  {new Date(user?.date_joined || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">0</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">0</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Consultations</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2"
          >
            <div className="glass-card p-6 md:p-8 group hover:border-emerald-400/20 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">✏️</span>
                Edit Profile
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                        placeholder="Your email"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                      placeholder="Your address"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={saving ? {} : { x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {saving ? (
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Changes
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage