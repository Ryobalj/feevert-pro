import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'

const JobsPage = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get('/jobs/')
        const jobsData = res.data.results || res.data
        setJobs(Array.isArray(jobsData) ? jobsData : [])
      } catch (error) {
        console.error('Error loading jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  const featuredJobs = jobs.filter(j => j.is_featured)
  const regularJobs = jobs.filter(j => !j.is_featured)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container-main">
        {/* ============ HERO ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">💼 We're Hiring!</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
            Career <span className="gradient-text">Opportunities</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Join our team of passionate professionals and make an impact
          </p>

          {/* Stats */}
          {jobs.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
                <span className="text-white font-semibold">{jobs.length}</span> open position{jobs.length !== 1 ? 's' : ''}
              </div>
              {featuredJobs.length > 0 && (
                <div className="glass px-4 py-2 rounded-full text-sm text-amber-400/70">
                  <span className="text-amber-400 font-semibold">{featuredJobs.length}</span> featured
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ FEATURED JOBS ============ */}
        {featuredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">⭐</span>
              <h2 className="text-xl font-bold text-white">Featured Positions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {featuredJobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} featured />
              ))}
            </div>
            
            {regularJobs.length > 0 && (
              <div className="flex items-center gap-3 my-10">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/30 uppercase tracking-wider">More Opportunities</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
          </motion.div>
        )}

        {/* ============ ALL JOBS ============ */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {(featuredJobs.length > 0 ? regularJobs : jobs).map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>

        {/* ============ EMPTY STATE ============ */}
        {jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center max-w-lg mx-auto mt-8"
          >
            <div className="text-5xl mb-4 opacity-40">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">No open positions</h3>
            <p className="text-white/40">Check back later for new opportunities.</p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300"
            >
              Contact Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ============ JOB CARD COMPONENT ============
const JobCard = ({ job, index, featured = false }) => {
  const isExpired = job.deadline && new Date(job.deadline) < new Date()
  const daysLeft = job.deadline 
    ? Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/careers/${job.id}`} className="block group h-full">
        <div className={`glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 ${
          featured ? 'border-amber-400/10' : ''
        }`}>
          {/* Top accent */}
          <div className={`h-1 bg-gradient-to-r transition-all duration-500 ${
            featured 
              ? 'from-amber-400/40 via-amber-400/60 to-amber-400/40' 
              : 'from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20'
          }`} />
          
          <div className="p-5 flex flex-col h-full">
            {/* Title + Featured Badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 line-clamp-1">
                {job.title}
              </h3>
              {featured && !isExpired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
                  ⭐ Featured
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20 flex-shrink-0">
                  ❌ Expired
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
                <svg className="w-3.5 h-3.5 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location || 'Various'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {job.employment_type_display || job.employment_type?.replace(/_/g, ' ')}
              </span>
              {job.experience_level && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  {job.experience_level_display || job.experience_level}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-white/40 mb-4 line-clamp-2 flex-1 leading-relaxed">
              {job.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <div className="flex items-center gap-3">
                {job.deadline && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {isExpired ? (
                      <span className="text-red-400">Expired</span>
                    ) : (
                      <>
                        {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {daysLeft !== null && daysLeft <= 7 && (
                          <span className="text-amber-400 font-medium">({daysLeft}d left)</span>
                        )}
                      </>
                    )}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                Apply Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default JobsPage