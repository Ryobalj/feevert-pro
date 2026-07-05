import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next' // ✅ Ongeza hii
import ProjectCard from '../../projects/components/ProjectCard'

const ProjectsSection = ({ data }) => {
  const { t } = useTranslation('home') // ✅ Ongeza hii

  if (!data || data.length === 0) return null

  const featuredProjects = data.filter(p => p.is_featured).slice(0, 3)
  if (featuredProjects.length === 0) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle top gradient blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      
      <div className="container-main relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">
              {t('projects.badge') || '📁 Our Portfolio'}
            </span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            {t('projects.title') || 'Featured'}{' '}
            <span className="gradient-text">{t('projects.subtitle') || 'Projects'}</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            {t('projects.description') || 'Some of our successful projects that showcase our expertise'}
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuredProjects.map((project, index) => (
            <motion.div 
              key={project.id} 
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

export default ProjectsSection