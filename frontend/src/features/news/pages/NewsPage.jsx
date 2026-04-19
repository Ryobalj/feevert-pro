import React, { useState, useEffect } from 'react'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

const NewsPage = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await api.get('/news/')
        const newsData = res.data.results || res.data
        setNews(Array.isArray(newsData) ? newsData : [])
      } catch (error) {
        console.error('Error loading news:', error)
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [])

  if (loading) return <Loader />

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Latest News</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">Stay updated with our latest announcements</p>
        <div className="grid md:grid-cols-3 gap-8">
          {news.map(article => (
            <div key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="h-48 bg-gradient-to-br from-feevert-green to-green-700"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{new Date(article.created_at).toLocaleDateString()}</p>
                <p className="text-gray-600">{article.excerpt || article.content?.substring(0, 100)}...</p>
                <button className="mt-4 text-feevert-green font-semibold hover:underline">Read More →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default NewsPage
