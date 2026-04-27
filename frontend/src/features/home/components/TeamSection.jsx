import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import TeamCard from './TeamCard'

const TeamSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const featuredTeam = data.filter(m => m.is_featured).slice(0, 4)
  if (featuredTeam.length === 0) return null

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
            <span className="text-sm font-medium text-white/80">👥 Our Experts</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Meet Our{' '}
            <span className="gradient-text">Team</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            The passionate professionals behind FeeVert, dedicated to your success
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTeam.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <TeamCard member={member} />
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link 
            to="/team" 
            className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-base hover:border-emerald-400/50 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300" />
            <span className="relative z-10">Meet All Team Members</span>
            <motion.svg 
              className="w-5 h-5 relative z-10" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </motion.svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default TeamSection