import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import api from '../../../app/api'

const SettingsPage = () => {
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [notificationSettings, setNotificationSettings] = useState({ email: true, sms: false, in_app: true })
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { darkMode } = useTheme()
  const { user } = useAuth()

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('New passwords do not match')
      return
    }
    
    setSaving(true)
    setMessage('')
    
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      })
      setMessage('Password changed successfully!')
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setMessage('Error changing password. Please check your current password.')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await api.patch('/notification-settings/', notificationSettings)
      setMessage('Notification settings saved!')
    } catch (error) {
      setMessage('Error saving notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await api.post('/language/set-language/', { language })
      localStorage.setItem('language', language)
      setMessage('Language preference saved!')
    } catch (error) {
      setMessage('Error saving language preference')
    } finally {
      setSaving(false)
    }
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
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Account <span className="gradient-text">Settings</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your account preferences
          </p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-lg text-center ${
              message.includes('success') || message.includes('saved')
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  required
                  minLength="8"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
              
              <button type="submit" className="glow-button px-6 py-2.5">
                Update Password
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Notification Preferences
            </h2>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({...notificationSettings, email: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Email notifications
                </span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({...notificationSettings, sms: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  SMS notifications
                </span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.in_app}
                  onChange={(e) => setNotificationSettings({...notificationSettings, in_app: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  In-app notifications
                </span>
              </label>
            </div>
            
            <button onClick={handleNotificationSave} className="glow-button px-6 py-2.5">
              Save Preferences
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`modern-card p-6 ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Language
            </h2>
            
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border mb-6 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-1 focus:ring-green-500`}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
            
            <button onClick={handleLanguageSave} className="glow-button px-6 py-2.5">
              Save Language
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default SettingsPage
