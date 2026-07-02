// src/features/home/components/AboutSection.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const AboutSection = ({ data }) => {
  const { t } = useTranslation('home')

  if (!data || !data.description) return null

  // This is a homepage teaser, so it always reads "About Company" (a
  // generic label) rather than the specific about.title from the database -
  // the full About page shows that title instead.
  const sectionTitle = t('about.company_title') || 'About Company'
  const sectionTitleWords = sectionTitle.trim().split(/\s+/)
  const sectionTitleAccent = sectionTitleWords.pop()
  const sectionTitleLead = sectionTitleWords.join(' ')

  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      <div className="container-main relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">
              {t('about.badge') || 'Our Story'}
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white capitalize">
            {sectionTitleLead && `${sectionTitleLead} `}<span className="gradient-text">{sectionTitleAccent}</span>
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="glass-card p-8 md:p-10 mb-8"
          >
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-transparent rounded-full mb-6" />
            <p className="text-lg md:text-xl leading-relaxed text-white/70">{data.description}</p>
          </motion.div>

          {/* Mission & Vision */}
          {(data.mission || data.vision) && (
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {data.mission && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -6 }}
                  className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-green-600 group-hover:w-2 transition-all duration-300" />
                  <div className="p-6 pl-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">🎯</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                        {t('about.mission') || 'Our Mission'}
                      </h3>
                    </div>
                    <p className="text-white/60 leading-relaxed">{data.mission}</p>
                  </div>
                </motion.div>
              )}

              {data.vision && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ y: -6 }}
                  className="glass-card relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-600 group-hover:w-2 transition-all duration-300" />
                  <div className="p-6 pl-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">👁️</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                        {t('about.vision') || 'Our Vision'}
                      </h3>
                    </div>
                    <p className="text-white/60 leading-relaxed">{data.vision}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/about"
              className="group relative inline-flex items-center gap-3 border-2 border-white/30 text-white px-8 py-3 rounded-full font-bold hover:border-emerald-400/60 transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
            >
              {t('about.read_more') || 'Read More About Us'}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            <a
              href="/documents/feevert-company-profile.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 bg-emerald-500/90 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-400 transition-all duration-300"
            >
              {t('about.view_profile') || 'View Company Profile'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
