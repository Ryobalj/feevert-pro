import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const NewsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await api.get(`/news/${id}/`)
        setNews(res.data)
      } catch (error) {
        console.error('Error loading news:', error)
        navigate('/news')
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [id, navigate])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!news) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-sm transition-colors ${
            darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-700'
          }`}
        >
          ← Back to News
        </button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-6 md:p-8 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          {news.featured_image && (
            <div className="h-64 md:h-80 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 overflow-hidden rounded-t-xl">
              <img 
                src={news.featured_image} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(news.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
            {news.category_name && (
              <span className={`text-sm px-3 py-0.5 rounded-full ${
                darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              }`}>
                {news.category_name}
              </span>
            )}
            {news.author_name && (
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                By {news.author_name}
              </span>
            )}
          </div>

          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-6 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {news.title}
          </h1>

          {news.summary && (
            <p className={`text-lg leading-relaxed mb-6 pb-6 border-b ${
              darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'
            }`}>
              {news.summary}
            </p>
          )}

          <div 
            className={`prose prose-green max-w-none ${
              darkMode ? 'prose-invert' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {news.tags && news.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.article>

        {/* More News Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-8"
        >
          <Link to="/news" className={`text-sm font-medium hover:underline ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            ← View all news
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default NewsDetail
