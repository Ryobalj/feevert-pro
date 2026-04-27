import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const NewsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [news, setNews] = useState(null)
  const [relatedNews, setRelatedNews] = useState([])
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadNews = async () => {
      try {
        const [newsRes, relatedRes] = await Promise.all([
          api.get(`/news/${id}/`),
          api.get('/news/?limit=3').catch(() => ({ data: { results: [] } }))
        ])
        setNews(newsRes.data)
        const related = relatedRes.data?.results || relatedRes.data || []
        setRelatedNews(related.filter(item => item.id !== parseInt(id)).slice(0, 3))
      } catch (error) {
        console.error('Error loading news:', error)
        navigate('/news')
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [id, navigate])

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied!')
  }

  // Share handlers
  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news?.title || '')}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!news) return null

  const readingTime = news.content ? Math.max(1, Math.ceil(news.content.split(' ').length / 200)) : 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/news')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to News
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Featured Image */}
          {news.featured_image || news.image ? (
            <div className="relative aspect-[21/9] mb-8 rounded-3xl overflow-hidden group">
              <img 
                src={news.featured_image || news.image} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative aspect-[21/9] mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="flex items-center gap-1.5 text-sm text-white/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(news.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {news.category_name && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {news.category_name}
              </span>
            )}
            {news.author_name && (
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                By <span className="text-white/70 font-medium ml-1">{news.author_name}</span>
              </span>
            )}
            <span className="text-white/30 text-sm">•</span>
            <span className="text-white/40 text-sm">{readingTime} min read</span>
            {news.views !== undefined && (
              <span className="flex items-center gap-1.5 text-sm text-white/40 ml-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {news.views} views
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight">
            {news.title}
          </h1>

          {/* Summary */}
          {news.summary && (
            <div className="glass-card p-5 mb-8 border-l-[3px] border-l-emerald-400 bg-emerald-400/[0.02]">
              <p className="text-white/60 leading-relaxed italic">
                {news.summary}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="glass-card p-6 md:p-8 mb-8">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-white/60 prose-p:leading-relaxed prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:text-emerald-300 prose-strong:text-white/80 prose-img:rounded-2xl prose-img:shadow-lg prose-blockquote:border-l-emerald-400 prose-blockquote:bg-white/[0.02] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:text-white/50 prose-li:text-white/60"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>

          {/* Tags */}
          {news.tags && Array.isArray(news.tags) && news.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs text-white/30 mr-1">Tags:</span>
              {news.tags.map((tag, i) => (
                <span key={i} className="glass px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-emerald-400 hover:border-emerald-400/30 cursor-pointer transition-all duration-300">
                  #{typeof tag === 'string' ? tag : tag.name || tag}
                </span>
              ))}
            </div>
          )}

          {/* Share Section */}
          <div className="flex items-center gap-4 py-6 border-t border-white/5">
            <span className="text-sm text-white/30">Share:</span>
            <button onClick={handleCopyLink} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/40 hover:text-emerald-400 hover:border-emerald-400/30 transition-all duration-300" title="Copy link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button onClick={handleShareTwitter} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/40 hover:text-emerald-400 hover:border-emerald-400/30 transition-all duration-300" title="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
            <button onClick={handleShareLinkedIn} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/40 hover:text-emerald-400 hover:border-emerald-400/30 transition-all duration-300" title="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12">
            <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📰</span>
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedNews.map((item) => (
                <Link key={item.id} to={`/news/${item.id}`} className="group">
                  <div className="glass-card p-5 h-full hover:border-emerald-400/30 transition-all duration-300">
                    <span className="inline-block px-2 py-0.5 mb-2 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {item.category_name || 'News'}
                    </span>
                    <h3 className="font-bold text-white text-sm mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/40 line-clamp-2 mb-3 leading-relaxed">
                      {item.excerpt || item.summary || item.content?.substring(0, 80)}...
                    </p>
                    <span className="text-xs text-white/30">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back to News */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-12">
          <Link to="/news" className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            View all news
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default NewsDetail