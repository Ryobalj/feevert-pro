import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import api from '../../../app/api'

const SettingsPage = () => {
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [notificationSettings, setNotificationSettings] = useState({ email: true, sms: false, in_app: true })
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en')
  const [saving, setSaving] = useState({ password: false, notification: false, language: false })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()
  const { user } = useAuth()

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('New passwords do not match', 'error')
      return
    }
    if (passwordData.new_password.length < 8) {
      showMessage('Password must be at least 8 characters', 'error')
      return
    }
    
    setSaving(prev => ({ ...prev, password: true }))
    
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      })
      showMessage('Password changed successfully!')
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
      setShowCurrentPwd(false)
    } catch (error) {
      showMessage('Error changing password. Please check your current password.', 'error')
    } finally {
      setSaving(prev => ({ ...prev, password: false }))
    }
  }

  const handleNotificationSave = async () => {
    setSaving(prev => ({ ...prev, notification: true }))
    try {
      await api.patch('/notification-settings/', notificationSettings)
      showMessage('Notification settings saved!')
    } catch (error) {
      showMessage('Error saving notification settings', 'error')
    } finally {
      setSaving(prev => ({ ...prev, notification: false }))
    }
  }

  const handleLanguageSave = async () => {
    setSaving(prev => ({ ...prev, language: true }))
    try {
      await api.post('/language/set-language/', { language })
      localStorage.setItem('language', language)
      showMessage('Language preference saved!')
    } catch (error) {
      showMessage('Error saving language preference', 'error')
    } finally {
      setSaving(prev => ({ ...prev, language: false }))
    }
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
            Account <span className="gradient-text">Settings</span>
          </h1>
          <p className="mt-2 text-white/40 text-sm">Manage your account preferences</p>
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

        <div className="space-y-6">
          {/* ============ APPEARANCE ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🎨</span>
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Dark Mode</p>
                <p className="text-xs text-white/40 mt-0.5">Toggle dark mode on or off</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-white/10 peer-checked:bg-emerald-500 rounded-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300" />
              </label>
            </div>
          </motion.div>

          {/* ============ CHANGE PASSWORD ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🔒</span>
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                    required
                    className="w-full pl-11 pr-12 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors" tabIndex={-1}>
                    {showCurrentPwd ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M6.343 6.343L4 4m12 12l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    required
                    minLength="8"
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                    placeholder="New password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    required
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/20 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving.password} className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={saving.password ? {} : { x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
                {saving.password ? (
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Updating...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center gap-2">Update Password <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
                )}
              </button>
            </form>
          </motion.div>

          {/* ============ NOTIFICATIONS ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🔔</span>
              Notification Preferences
            </h2>
            <div className="space-y-4 mb-6">
              {[
                { key: 'email', label: 'Email notifications', icon: '✉️', desc: 'Receive updates via email' },
                { key: 'sms', label: 'SMS notifications', icon: '📱', desc: 'Receive updates via text message' },
                { key: 'in_app', label: 'In-app notifications', icon: '💬', desc: 'Receive updates within the app' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer group/item">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-white/30">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key]}
                      onChange={(e) => setNotificationSettings({...notificationSettings, [item.key]: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-checked:bg-emerald-500 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300" />
                  </label>
                </label>
              ))}
            </div>
            <button onClick={handleNotificationSave} disabled={saving.notification} className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300 disabled:opacity-60">
              {saving.notification ? 'Saving...' : 'Save Preferences'}
            </button>
          </motion.div>

          {/* ============ LANGUAGE ============ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🌐</span>
              Language
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex-1 max-w-xs px-4 py-3 glass text-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm cursor-pointer"
              >
                <option value="en" className="bg-[#0d3320]">🇬🇧 English</option>
                <option value="sw" className="bg-[#0d3320]">🇹🇿 Kiswahili</option>
              </select>
              <button onClick={handleLanguageSave} disabled={saving.language} className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-emerald-400/40 hover:text-emerald-400 transition-all duration-300 disabled:opacity-60">
                {saving.language ? 'Saving...' : 'Save Language'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default SettingsPage