import React, { useState } from 'react'

const CardView = ({ items, type, basePath, renderCard, itemsPerPage = 6 }) => {
  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (!items || items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3 className="empty-state-title">No items found</h3>
        <p className="empty-state-description">Try adjusting your search or filter to find what you're looking for.</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Toggle Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-[var(--g-text-tertiary)]">
          Showing <span className="text-[var(--g-text-primary)] font-semibold">{items.length}</span> items
        </p>
        
        <div className="flex gap-1 p-1 glass rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'grid' 
                ? 'bg-[var(--g-color-primary)] text-white shadow-sm' 
                : 'text-[var(--g-text-tertiary)] hover:text-[var(--g-text-primary)]'
            }`}
            aria-label="Grid view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-[var(--g-color-primary)] text-white shadow-sm' 
                : 'text-[var(--g-text-tertiary)] hover:text-[var(--g-text-primary)]'
            }`}
            aria-label="List view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Items Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }>
        {currentItems.map((item, index) => (
          <div 
            key={item.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {renderCard(item, viewMode)}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-icon btn-circle btn-sm glass disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === i + 1 
                  ? 'bg-[var(--g-color-primary)] text-white shadow-md' 
                  : 'glass text-[var(--g-text-secondary)] hover:text-[var(--g-text-primary)] hover:border-[var(--g-color-primary)]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-icon btn-circle btn-sm glass disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default CardView
