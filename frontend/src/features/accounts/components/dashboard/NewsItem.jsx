import React from 'react'
import { Link } from 'react-router-dom'

const NewsItem = ({ news, darkMode }) => (
  <Link to={`/news/${news.id}`} className={`block p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
    <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{news.title}</h3>
    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {new Date(news.created_at).toLocaleDateString()}
    </p>
  </Link>
)

export default NewsItem
