// src/features/accounts/pages/VerifyEmailPage.jsx

import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const VerifyEmailPage = () => {
  const { t } = useTranslation('account')
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage(t('verify.no_token'))
      return
    }

    const verifyEmail = async () => {
      try {
        await api.post('/auth/verify-email/', { token })
        setStatus('success')
        setMessage(t('verify.success'))
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.error || t('verify.error'))
      }
    }

    verifyEmail()
  }, [searchParams, t])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card !p-8 text-center"
        >
          {/* Loading State */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4"
            >
              <div className="relative inline-block mb-8">
                <motion.div 
                  className="absolute -inset-6 bg-emerald-400/10 rounded-full blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative">
                  <div className="spinner spinner-lg mx-auto" />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">
                {t('verify.verifying')}
              </h2>
              <p className="text-white/40 text-sm">
                {t('verify.verifying_message')}
              </p>
              <div className="h-0.5 bg-emerald-400/30 rounded-full w-24 mx-auto mt-6 animate-pulse" />
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative inline-block mb-8"
              >
                <motion.div 
                  className="absolute -inset-6 bg-emerald-400/15 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                  <motion.svg 
                    className="w-12 h-12 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
              </motion.div>

              <h2 className="text-2xl font-extrabold text-white mb-2">
                {t('verify.success_title')}
              </h2>
              <p className="text-white/50 text-sm mb-8">
                {message}
              </p>

              <Link 
                to="/login" 
                className="btn-primary btn-lg w-full group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('verify.login')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative inline-block mb-8"
              >
                <motion.div 
                  className="absolute -inset-6 bg-red-400/10 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/20">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </motion.div>

              <h2 className="text-2xl font-extrabold text-white mb-2">
                {t('verify.error_title')}
              </h2>
              <p className="text-white/50 text-sm mb-8">
                {message}
              </p>

              <div className="space-y-3">
                <Link 
                  to="/login" 
                  className="btn-primary btn-lg w-full group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t('verify.go_to_login')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>

                <p className="text-sm text-white/40 pt-2">
                  {t('verify.need_new_link')}{' '}
                  <Link 
                    to="/resend-verification" 
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {t('verify.resend')}
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default VerifyEmailPage