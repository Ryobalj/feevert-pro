import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'

const NewsPage = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await api.get('/news/')
        const newsData = res.data.results || res.data
        setNews(Array.isArray(newsData) ? newsData : [])
      } catch (error) { console.error('Error loading news:', error) }
      finally { setLoading(false) }
    }
    loadNews()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading news...</p>
        </div>
      </div>
    )
  }

  const featuredArticles = news.filter(a => a.is_featured).slice(0, 1)
  const regularArticles = news.filter(a => !a.is_featured)
  const gradients = [
    'from-emerald-400 via-green-500 to-teal-600',
    'from-green-400 via-emerald-500 to-cyan-600',
    'from-teal-400 via-cyan-500 to-emerald-600',
    'from-emerald-500 via-teal-500 to-green-600',
    'from-cyan-400 via-emerald-500 to-teal-600',
    'from-green-500 via-teal-400 to-emerald-600',
  ]

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container-main">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">📰 Stay Updated</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Latest <span className="gradient-text">News</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Stay updated with our latest announcements, insights, and company news
          </p>
          {news.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
                <span className="text-white font-semibold">{news.length}</span> articles
              </div>
              {featuredArticles.length > 0 && (
                <div className="glass px-4 py-2 rounded-full text-sm text-amber-400/70">
                  <span className="text-amber-400 font-semibold">{news.filter(a => a.is_featured).length}</span> featured
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ FEATURED ARTICLE (HERO) ============ */}
        {featuredArticles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-14">
            {featuredArticles.map(article => (
              <Link to={`/news/${article.id}`} key={article.id} className="block group">
                <div className="glass-card p-0 overflow-hidden hover:border-emerald-400/30 transition-all duration-500">
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    {article.featured_image || article.image ? (
                      <div className="aspect-[16/9] md:aspect-auto overflow-hidden">
                        <img src={article.featured_image || article.image} alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] md:aspect-auto bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 flex items-center justify-center min-h-[250px]">
                        <svg className="w-20 h-20 text-white/20 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          ⭐ Featured
                        </span>
                        {article.category_name && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {article.category_name}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-white/50 mb-4 leading-relaxed line-clamp-3 text-sm">
                        {article.summary || article.content?.substring(0, 200)}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {article.author_name && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {article.author_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-6 text-emerald-400 font-semibold group-hover:gap-3 transition-all text-sm">
                        Read Full Article
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}

        {/* ============ MORE ARTICLES HEADER ============ */}
        {regularArticles.length > 0 && featuredArticles.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-sm text-white/40 flex items-center gap-2">📝 More Articles</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        )}

        {/* ============ REGULAR ARTICLES GRID ============ */}
        {regularArticles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredArticles.length > 0 ? regularArticles : news).map((article, index) => {
              const gradient = gradients[article.id ? article.id % gradients.length : 0]
              return (
                <motion.div key={article.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4 }}>
                  <Link to={`/news/${article.id}`} className="block group h-full">
                    <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                      {article.featured_image || article.image ? (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img src={article.featured_image || article.image} alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                          <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
                          <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
                          <svg className="w-14 h-14 text-white/30 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {article.category_name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{article.category_name}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{article.title}</h3>
                        <p className="text-sm text-white/40 mb-4 flex-1 leading-relaxed line-clamp-2">{article.excerpt || article.summary || article.content?.substring(0, 120)}...</p>
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all mt-auto">
                          Read More
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ============ EMPTY STATE ============ */}
        {news.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center max-w-lg mx-auto">
            <div className="text-5xl mb-4 opacity-40">📰</div>
            <h3 className="text-xl font-bold text-white mb-2">No news yet</h3>
            <p className="text-white/40">Check back soon for the latest updates and announcements.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default NewsPage