import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const StatsCard = ({ label, value, icon, link, color }) => {
  const colorMap = {
    blue: 'from-blue-400 to-cyan-600',
    green: 'from-emerald-400 to-green-600',
    purple: 'from-purple-400 to-violet-600',
    yellow: 'from-amber-400 to-orange-600',
    emerald: 'from-emerald-400 to-green-600',
    amber: 'from-amber-400 to-orange-500',
  }
  
  const CardWrapper = link ? Link : 'div'
  
  return (
    <CardWrapper 
      to={link} 
      className={`block group/card ${link ? 'cursor-pointer' : ''}`}
    >
      <div className="glass-card hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Icon Box */}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.emerald} flex items-center justify-center text-xl shadow-lg group-hover/card:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            
            {/* Value + Label */}
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold text-white truncate">
                {value}
              </div>
              <div className="text-xs text-white/40 font-medium mt-0.5">
                {label}
              </div>
            </div>

            {/* Arrow indicator for linked cards */}
            {link && (
              <div className="flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${colorMap[color] || colorMap.emerald} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}

export default StatsCard