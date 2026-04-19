import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const NewsList = () => {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
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
      } catch (error) {
        console.error('Error loading news:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredNews = selectedCategory === 'all' 
    ? news.filter(n => n.is_published !== false)
    : news.filter(n => n.category === parseInt(selectedCategory) && n.is_published !== false)

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            News & <span className="gradient-text">Updates</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Stay informed with the latest news and insights from FeeVert
          </p>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All News
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-green-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Featured News */}
        {filteredNews.filter(n => n.is_featured).length > 0 && selectedCategory === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Featured
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {filteredNews.filter(n => n.is_featured).slice(0, 2).map((item) => (
                <Link to={`/news/${item.id}`} key={item.id}>
                  <div className={`modern-card overflow-hidden group cursor-pointer h-full ${
                    darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                  }`}>
                    {item.featured_image && (
                      <div className="h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                        <img 
                          src={item.featured_image} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.category_name && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.category_name}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.summary || item.content?.substring(0, 150)}...
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* All News Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredNews.map((item) => (
            <motion.div key={item.id} variants={cardVariants}>
              <Link to={`/news/${item.id}`}>
                <div className={`modern-card h-full group cursor-pointer ${
                  darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                }`}>
                  {item.featured_image && (
                    <div className="h-40 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-xl">
                      <img 
                        src={item.featured_image} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.category_name && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.category_name}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.summary || item.content?.substring(0, 100)}...
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filteredNews.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No news articles found.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default NewsList
