// src/features/bookings/components/EmptyBookingState.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const EmptyBookingState = ({ filter, darkMode }) => {
  const { t } = useTranslation('booking')

  // Translation keys for each filter
  const getFilterMessages = (filter) => {
    const messages = {
      all: {
        icon: '📋',
        title: t('empty.all.title'),
        description: t('empty.all.description'),
        action: t('empty.all.action'),
        actionLink: '/book-appointment'
      },
      pending: {
        icon: '⏳',
        title: t('empty.pending.title'),
        description: t('empty.pending.description'),
        action: t('empty.pending.action'),
        actionLink: '/services'
      },
      confirmed: {
        icon: '✅',
        title: t('empty.confirmed.title'),
        description: t('empty.confirmed.description'),
        action: t('empty.confirmed.action'),
        actionLink: '/book-appointment'
      },
      completed: {
        icon: '✔️',
        title: t('empty.completed.title'),
        description: t('empty.completed.description'),
        action: t('empty.completed.action'),
        actionLink: '/services'
      },
      cancelled: {
        icon: '❌',
        title: t('empty.cancelled.title'),
        description: t('empty.cancelled.description'),
        action: t('empty.cancelled.action'),
        actionLink: '/bookings'
      }
    }
    return messages[filter] || messages.all
  }

  const config = getFilterMessages(filter)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-10 md:p-14 text-center group hover:border-emerald-400/20 transition-all duration-300"
    >
      {/* Icon with glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative inline-block mb-6"
      >
        <motion.div 
          className="absolute -inset-6 bg-emerald-400/10 rounded-full blur-xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative w-24 h-24 rounded-2xl glass flex items-center justify-center text-4xl">
          {config.icon}
        </div>
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-extrabold text-white mb-2">
        {filter !== 'all' ? (
          <>
            {t('empty.no_filter_prefix')} <span className="text-white/50">{t(`status.${filter}`)}</span> {t('empty.no_filter_suffix')}
          </>
        ) : (
          config.title
        )}
      </h3>

      {/* Description */}
      <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        {config.description}
      </p>

      {/* CTA Button */}
      <Link 
        to={config.actionLink}
        className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="relative z-10">{config.action}</span>
      </Link>

      {/* Bottom suggestion */}
      {filter === 'all' && (
        <p className="text-white/20 text-xs mt-6">
          {t('empty.help_text')}{' '}
          <Link to="/contact" className="text-emerald-400/50 hover:text-emerald-400 transition-colors underline underline-offset-2">
            {t('empty.contact_support')}
          </Link>
        </p>
      )}
    </motion.div>
  )
}

export default EmptyBookingState