import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const CardView = ({ items, type, basePath, renderCard, itemsPerPage = 6 }) => {
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [currentPage, setCurrentPage] = useState(1)
  
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-box-open text-5xl text-gray-300 mb-4"></i>
        <p className="text-gray-500">No items found</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Toggle and Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 dark:text-gray-400">Showing {items.length} items</p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-feevert-green text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <i className="fas fa-th"></i>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-feevert-green text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {/* Items Grid/List */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-4'}>
        {currentItems.map((item, index) => (
          <div key={item.id} className="scroll-animate" style={{ animationDelay: `${index * 0.05}s` }}>
            {renderCard(item, viewMode)}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-feevert-green text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  )
}

export default CardView
