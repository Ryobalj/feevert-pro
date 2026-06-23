import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const JobCard = ({ job }) => {
  const { t } = useTranslation('careers')

  // Calculate expiry and days left with proper validation
  const { isExpired, daysLeft } = useMemo(() => {
    if (!job?.deadline || isNaN(new Date(job.deadline))) {
      return { isExpired: false, daysLeft: null }
    }
    const deadline = new Date(job.deadline)
    const now = new Date()
    const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    return {
      isExpired: deadline < now,
      daysLeft: days
    }
  }, [job?.deadline])

  // Format salary with proper currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'TZS': 'TSh',
      'USD': '$',
      'EUR': '€',
      'KES': 'KSh',
      'GBP': '£',
      'UGX': 'USh'
    }
    return symbols[currency] || currency || 'TZS'
  }

  const formatSalary = (amount) => {
    if (!amount && amount !== 0) return ''
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format employment type
  const getEmploymentType = () => {
    if (job.employment_type_display) return job.employment_type_display
    if (job.employment_type) {
      return job.employment_type.replace(/_/g, ' ')
    }
    return t('job_card.not_specified')
  }

  // Format experience level
  const getExperienceLevel = () => {
    if (job.experience_level_display) return job.experience_level_display
    if (job.experience_level) {
      return job.experience_level.replace(/_/g, ' ')
    }
    return null
  }

  // Format deadline date
  const formatDeadline = () => {
    if (!job?.deadline || isNaN(new Date(job.deadline))) {
      return t('job_card.no_deadline')
    }
    return new Date(job.deadline).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // If job is not provided, show loading state
  if (!job) {
    return (
      <div className="glass-card p-5">
        <div className="animate-pulse">
          <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
          <div className="h-4 bg-white/5 rounded w-1/2 mb-4" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-2/3 mt-2" />
        </div>
      </div>
    )
  }

  return (
    <Link to={`/careers/${job.id}`} className="block group">
      <div className="glass-card p-0 overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
        
        <div className="p-5">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {job.is_featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  ⭐ {t('job_card.featured')}
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                  ❌ {t('job_card.expired')}
                </span>
              )}
            </div>
          </div>
          
          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <span className="flex items-center gap-1.5 text-white/50">
              <svg className="w-4 h-4 text-emerald-400/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location || t('job_card.various')}
            </span>
            <span className="flex items-center gap-1.5 text-white/50">
              <svg className="w-4 h-4 text-emerald-400/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {getEmploymentType()}
            </span>
            {getExperienceLevel() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                {getExperienceLevel()}
              </span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-white/40 text-sm mb-4 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              {/* Deadline */}
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isExpired ? (
                  <span className="text-red-400">{t('job_card.expired')}</span>
                ) : (
                  <>
                    {t('job_card.deadline')}: {formatDeadline()}
                    {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                      <span className="text-amber-400 font-medium ml-1">
                        ({daysLeft} {t('job_card.days_left')})
                      </span>
                    )}
                    {daysLeft === 0 && (
                      <span className="text-amber-400 font-medium ml-1">
                        ({t('job_card.today')})
                      </span>
                    )}
                  </>
                )}
              </span>

              {/* Salary if available */}
              {job.salary_range_min && job.salary_range_max && (
                <span className="text-xs text-white/30 hidden sm:inline">
                  {getCurrencySymbol(job.salary_currency)} {formatSalary(job.salary_range_min)} - {formatSalary(job.salary_range_max)}
                </span>
              )}
            </div>

            {/* Apply CTA */}
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              {t('job_card.apply_now')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default JobCard