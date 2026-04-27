import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const NewsList = () => {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newsRes, categoriesRes] = await Promise.all([
          api.get('/news/'),
          api.get('/news-categories/')
        ])
        setNews(newsRes.data?.results || newsRes.data || [])
        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) { console.error('Error loading news:', error) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const filteredNews = news.filter(n => {
    const isPublished = n.is_published !== false
    const matchesCategory = selectedCategory === 'all' || n.category === parseInt(selectedCategory)
    const matchesSearch = !searchQuery || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase())
    return isPublished && matchesCategory && matchesSearch
  })

  const featuredNews = filteredNews.filter(n => n.is_featured)
  const regularNews = filteredNews.filter(n => !n.is_featured)
  const activeCategoryName = selectedCategory === 'all' ? null : categories.find(c => c.id === selectedCategory)?.name

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-6xl">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">📰 Stay Informed</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            News & <span className="gradient-text">Updates</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Stay informed with the latest news and insights from FeeVert
          </p>
          
          {/* Stats */}
          {news.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
                <span className="text-white font-semibold">{filteredNews.length}</span> article{filteredNews.length !== 1 ? 's' : ''}
              </div>
              {featuredNews.length > 0 && (
                <div className="glass px-4 py-2 rounded-full text-sm text-amber-400/70">
                  <span className="text-amber-400 font-semibold">{featuredNews.length}</span> featured
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ SEARCH + FILTERS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-4 mb-8">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title or content..."
              className="w-full pl-12 pr-4 py-3.5 glass text-white placeholder:text-white/30 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <motion.button onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                📋 All News
              </motion.button>
              {categories.map(cat => (
                <motion.button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
                  }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  {cat.name}
                </motion.button>
              ))}
              {(selectedCategory !== 'all' || searchQuery) && (
                <button onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ============ FEATURED NEWS ============ */}
        {featuredNews.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">⭐</span>
              <h2 className="text-xl font-bold text-white">Featured Stories</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredNews.slice(0, 2).map((item) => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>
            {regularNews.length > 0 && (
              <div className="flex items-center gap-3 my-10">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/30 uppercase tracking-wider">More Articles</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
          </motion.div>
        )}

        {/* ============ NEWS GRID ============ */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedCategory + searchQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featuredNews.length > 0 && selectedCategory === 'all' && !searchQuery ? regularNews : filteredNews).map((item, index) => (
              <NewsGridCard key={item.id} item={item} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ============ EMPTY STATE ============ */}
        {filteredNews.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center max-w-lg mx-auto">
            <div className="text-5xl mb-4 opacity-40">📰</div>
            <h3 className="text-xl font-bold text-white mb-2">No articles found</h3>
            <p className="text-white/40">
              {searchQuery ? `No articles matching "${searchQuery}".` : 'No news articles available in this category yet.'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                className="mt-6 px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ============ FEATURED CARD ============
const FeaturedCard = ({ item }) => (
  <Link to={`/news/${item.id}`} className="block group h-full">
    <div className="glass-card p-0 overflow-hidden h-full hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
      {item.featured_image || item.image ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={item.featured_image || item.image} alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 flex items-center justify-center">
          <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          {item.category_name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{item.category_name}</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{item.title}</h3>
        <p className="text-sm text-white/40 line-clamp-2 mb-4 leading-relaxed">{item.summary || item.content?.substring(0, 150)}...</p>
        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all">
          Read Article
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </div>
    </div>
  </Link>
)

// ============ NEWS GRID CARD ============
const NewsGridCard = ({ item, index }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.4 }}
    whileHover={{ y: -4 }}>
    <Link to={`/news/${item.id}`} className="block group h-full">
      <div className="glass-card p-0 overflow-hidden h-full flex flex-col hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        {item.featured_image || item.image ? (
          <div className="aspect-[16/10] overflow-hidden">
            <img src={item.featured_image || item.image} alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-emerald-500/80 to-green-700/80 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
            <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-white/40 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {item.category_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{item.category_name}</span>
            )}
          </div>
          <h3 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{item.title}</h3>
          <p className="text-sm text-white/40 line-clamp-2 mb-4 flex-1 leading-relaxed">{item.summary || item.content?.substring(0, 120)}...</p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all mt-auto">
            Read More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
)

export default NewsList