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
  const { darkMode } = useTheme()
  const { user } = useAuth()

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
    } catch (error) {
      setMessage('Error updating profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your personal information
          </p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-lg text-center ${
              message.includes('success')
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`modern-card p-6 text-center ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {profile?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <h3 className={`font-semibold text-lg mb-1 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {profile?.full_name || user?.username}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role || 'Client'}
              </p>
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Member since
                </p>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(user?.date_joined || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`modern-card p-6 md:p-8 ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Edit Profile
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows="3"
                    className={`w-full px-4 py-2.5 rounded-lg border resize-y ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`glow-button px-6 py-2.5 ${saving ? 'opacity-70' : ''}`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage
