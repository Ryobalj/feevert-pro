import React from 'react'
import { Link } from 'react-router-dom'

const NewsItem = ({ news, darkMode }) => (
  <Link 
    to={`/news/${news.id}`} 
    className="block group"
  >
    <div className="glass rounded-xl p-4 hover:border-emerald-400/30 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm">📰</span>
            <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors duration-300 truncate">
              {news.title}
            </h3>
          </div>

          {/* Category Badge */}
          {news.category_name && (
            <span className="inline-block px-2 py-0.5 mb-2 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {news.category_name}
            </span>
          )}

          {/* Date */}
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-white/40">
              {new Date(news.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Excerpt if available */}
          {news.excerpt && (
            <p className="text-xs text-white/30 mt-1.5 line-clamp-1 leading-relaxed">
              {news.excerpt}
            </p>
          )}
        </div>

        {/* Hover arrow */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-1">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </Link>
)

export default NewsItem