// src/features/home/pages/CategoryDetailPage.jsx
//
// Detail page for a sub-category that acts as a service (i.e. a sub-category
// with no child services). Reached via the Services mega-menu "Read More".
// Shows the full description — richer than the short menu preview.

import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'
import { Icon } from '../../../components/ui/Icon'

const CategoryDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation(['home', 'common'])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/consultation-categories/${id}/`)
        setCategory(res.data)
      } catch (error) {
        console.error('Error loading category:', error)
        navigate('/home')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text={t('common.loading') || 'Loading details...'} />
      </div>
    )
  }

  if (!category) return null

  const imageUrl = category.image_url || category.image

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-12 md:py-20"
    >
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('services.back_to_services') || 'Back'}
        </motion.button>

        {/* Optional Image */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden mb-8 border border-white/10"
          >
            <img src={imageUrl} alt={category.name} className="w-full max-h-[380px] object-cover" />
          </motion.div>
        )}

        {/* Header + Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-10 mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          <div className="flex items-start gap-5 mb-6">
            {category.icon && (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/10 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 glass rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                  <Icon name={category.icon} size="text-3xl" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
                  {category.name}
                </h1>
                <Link
                  to="/request-consultation"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 group/req"
                >
                  {t('services.request_service') || 'Request'}
                  <svg className="w-4 h-4 group-hover/req:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {category.description && (
            <p className="text-base md:text-lg leading-relaxed text-white/60 whitespace-pre-line">
              {category.description}
            </p>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mt-8 text-center group hover:border-emerald-400/20 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <h3 className="text-xl font-bold text-white">
                {t('services.ready_title') || 'Ready to Get Started?'}
              </h3>
            </div>
            <p className="text-white/60 text-sm max-w-md">
              {t('services.ready_description') || 'Request this service and let us help you achieve your goals.'}
            </p>
            <Link
              to="/request-consultation"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
            >
              {t('services.request_service') || 'Request Service'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default CategoryDetailPage
