// src/features/reviews/pages/SubmitReview.jsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ReviewForm from '../components/ReviewForm'

const SubmitReview = () => {
  const { t } = useTranslation('reviews')
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card !p-8"
        >
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-xl font-bold text-white mb-2">
                {t('submit.thanks_title') || 'Thank you for your feedback!'}
              </h1>
              <p className="text-white/50 mb-6">
                {t('submit.thanks_message') || 'Your review has been submitted and will appear once approved.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/reviews" className="btn-primary">
                  {t('submit.view_reviews') || 'View Reviews'}
                </Link>
                <button onClick={() => navigate('/home')} className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-white/30 transition-all">
                  {t('submit.back_home') || 'Back Home'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">✍️</div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {t('submit.title') || 'Share Your Experience'}
                </h1>
                <p className="text-white/50 text-sm">
                  {t('submit.subtitle') || 'Tell us what you thought of working with us'}
                </p>
              </div>
              <ReviewForm onSuccess={() => setSubmitted(true)} onCancel={() => navigate(-1)} />
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default SubmitReview
