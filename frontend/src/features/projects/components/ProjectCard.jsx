import React from 'react'
import { Link } from 'react-router-dom'

const ProjectCard = ({ project }) => {
  const gradients = [
    'from-emerald-400 via-green-500 to-teal-600',
    'from-green-400 via-emerald-500 to-cyan-600',
    'from-teal-400 via-cyan-500 to-emerald-600',
    'from-emerald-500 via-teal-500 to-green-600',
    'from-cyan-400 via-emerald-500 to-teal-600',
    'from-green-500 via-teal-400 to-emerald-600',
  ]
  const gradient = gradients[project.id ? project.id % gradients.length : 0]

  return (
    <Link to={`/projects/${project.id}`} className="block group h-full">
      <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        
        {/* ============ IMAGE / GRADIENT HEADER ============ */}
        {project.image || project.featured_image ? (
          <div className="aspect-[16/10] overflow-hidden relative">
            <img 
              src={project.image || project.featured_image} 
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Featured badge */}
            {project.is_featured && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white shadow-lg">
                ⭐ Featured
              </span>
            )}
          </div>
        ) : (
          <div className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/8 group-hover:scale-150 transition-transform duration-600 delay-100" />
            
            {/* Icon */}
            <svg className="w-16 h-16 text-white/30 group-hover:scale-110 group-hover:text-white/50 transition-all duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>

            {/* Featured badge */}
            {project.is_featured && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white shadow-lg z-20">
                ⭐ Featured
              </span>
            )}
          </div>
        )}

        {/* ============ CONTENT ============ */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category Badge */}
          {project.category_name && (
            <div className="mb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {project.category_name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300 line-clamp-1">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/40 mb-4 line-clamp-2 flex-1 leading-relaxed">
            {project.description}
          </p>

          {/* ============ FOOTER ============ */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            {/* Client Name */}
            {project.client_name ? (
              <span className="text-xs text-white/30 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white/50 font-medium">{project.client_name}</span>
              </span>
            ) : (
              <span className="text-xs text-white/20">FeeVert Project</span>
            )}

            {/* View Arrow */}
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
              View
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

export default ProjectCard