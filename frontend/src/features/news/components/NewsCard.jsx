import React from 'react'
import { Link } from 'react-router-dom'

const NewsCard = ({ article }) => {
  return (
    <Link to={`/news/${article.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 h-full flex flex-col">
        <div className="h-48 bg-gradient-to-br from-feevert-green to-green-700 flex items-center justify-center">
          <i className="fas fa-newspaper text-5xl text-white/30 group-hover:scale-110 transition-transform"></i>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{article.category_name || 'News'}</span>
          </div>
          <h3 className="text-lg font-bold mb-2 group-hover:text-feevert-green transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {article.excerpt || article.content?.substring(0, 120)}...
          </p>
          <div className="flex items-center justify-between mt-auto pt-3 text-sm">
            <span className="text-feevert-green font-semibold">Read More →</span>
            <span className="text-gray-400 text-xs">
              <i className="far fa-eye mr-1"></i> {article.views || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
export default NewsCard
