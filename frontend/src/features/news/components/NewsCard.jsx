import React from 'react'
import { Link } from 'react-router-dom'

const NewsCard = ({ article }) => {
  const gradients = [
    'from-emerald-400 via-green-500 to-teal-600',
    'from-green-400 via-emerald-500 to-cyan-600',
    'from-teal-400 via-cyan-500 to-emerald-600',
    'from-emerald-500 via-teal-500 to-green-600',
    'from-cyan-400 via-emerald-500 to-teal-600',
    'from-green-500 via-teal-400 to-emerald-600',
  ]
  const gradient = gradients[article.id ? article.id % gradients.length : 0]

  const formattedDate = article.created_at 
    ? new Date(article.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    : ''

  return (
    <Link to={`/news/${article.id}`} className="block group h-full">
      <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        {/* Image / Gradient Header */}
        {article.image || article.featured_image ? (
          <div className="aspect-[16/10] overflow-hidden relative">
            <img 
              src={article.image || article.featured_image} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        ) : (
          <div className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/8 group-hover:scale-150 transition-transform duration-600 delay-100" />
            
            <svg 
              className="w-16 h-16 text-white/30 group-hover:scale-110 group-hover:text-white/50 transition-all duration-500 relative z-10" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <span className="flex items-center gap-1.5 text-white/40">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </span>
            {article.category_name && (
              <>
                <span className="text-white/20">•</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {article.category_name}
                </span>
              </>
            )}
            {/* Author if available */}
            {article.author_name && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-white/40 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author_name}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-white/40 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
            {article.excerpt || article.content?.substring(0, 120)}
            {!article.excerpt && article.content?.length > 120 ? '...' : ''}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Read More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            
            <div className="flex items-center gap-3">
              {/* Reading time estimate */}
              {article.content && (
                <span className="text-white/25 text-xs">
                  {Math.ceil(article.content.split(' ').length / 200)} min read
                </span>
              )}
              {/* Views */}
              {article.views !== undefined && (
                <span className="text-white/30 text-xs flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.views}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default NewsCard