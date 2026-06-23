// src/features/shop/pages/ShopPage.jsx

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'
import Icon from '../../../components/ui/Icon'
import { getIcon } from '../../../components/utils/iconMap'

// ============ PRODUCT CARD COMPONENT ============
const ProductCard = ({ product }) => {
  const [currentImage, setCurrentImage] = useState(0)
  const [imgError, setImgError] = useState(false)

  // ✅ Collect all images - SUPPORTS ALL FORMATS
  const images = React.useMemo(() => {
    const imgs = []
    
    if (!product) return imgs
    
    // 1. Primary image
    if (product?.primary_image_url) {
      imgs.push(product.primary_image_url)
    }
    
    // 2. Main image (image_url)
    if (product?.image_url) {
      imgs.push(product.image_url)
    }
    
    // 3. All images (from all_images property)
    if (product?.all_images && Array.isArray(product.all_images)) {
      product.all_images.forEach(img => {
        const imgUrl = img?.url || img?.image_url
        if (imgUrl && !imgs.includes(imgUrl)) {
          imgs.push(imgUrl)
        }
      })
    }
    
    // 4. Gallery images (from gallery field)
    if (product?.gallery && Array.isArray(product.gallery)) {
      product.gallery.forEach(img => {
        const imgUrl = img?.image_url || img?.url
        if (imgUrl && !imgs.includes(imgUrl)) {
          imgs.push(imgUrl)
        }
      })
    }
    
    // 5. Direct image field
    if (product?.image && typeof product.image === 'string') {
      imgs.push(product.image)
    }
    
    return imgs
  }, [product])

  const hasMultipleImages = images.length > 1

  // ✅ Auto-slide - INAENDESHA AUTOMATICALLY (BILA HOVER)
  React.useEffect(() => {
    if (!hasMultipleImages) return
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [hasMultipleImages, images.length])

  // ✅ Reset image when product changes
  React.useEffect(() => {
    setCurrentImage(0)
    setImgError(false)
  }, [product?.id])

  return (
    <Link to={`/shop/products/${product?.slug}`} className="block group h-full">
      <div className="glass-card h-full flex flex-col overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 p-0">
        
        {/* Image Carousel */}
        <div className="relative h-48 overflow-hidden bg-[#0a2a19]">
          {images.length > 0 && !imgError ? (
            <div className="relative w-full h-full">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentImage 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-105'
                  }`}
                >
                  <img
                    src={img}
                    alt={product?.name || 'Product'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImgError(true)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 flex items-center justify-center">
              <span className="text-5xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                {getIcon(product?.icon) || '🍯'}
              </span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 to-transparent pointer-events-none" />
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Dots indicator */}
          {hasMultipleImages && images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImage(i) }}
                  className={`rounded-full transition-all duration-500 ${
                    i === currentImage 
                      ? 'bg-emerald-400 w-4 h-2' 
                      : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Sale badge */}
          {product?.is_on_sale && (
            <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
              -{product.discount_percentage}%
            </span>
          )}
          
          {/* Stock badge */}
          {!product?.in_stock && (
            <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
              Out of Stock
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-full">
          {/* Category */}
          {product?.category_name && (
            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              {product.category_icon && <Icon name={product.category_icon} size="text-xs" />}
              {product.category_name}
            </span>
          )}
          
          {/* Name */}
          <h3 className="text-sm font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {product?.name}
          </h3>
          
          {/* Description */}
          <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed flex-1">
            {product?.short_description || product?.description}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
            <div>
              {product?.is_on_sale ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 line-through">
                    TZS {product.price?.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-red-400">
                    TZS {product.current_price?.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold gradient-text">
                  TZS {product?.current_price?.toLocaleString()}
                </span>
              )}
            </div>
            
            {product?.in_stock && (
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                View
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ============ PAGINATION COMPONENT ============
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)

    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)

    if (currentPage <= 2) {
      end = Math.min(4, totalPages - 1)
    }
    if (currentPage >= totalPages - 1) {
      start = Math.max(2, totalPages - 3)
    }

    if (start > 2) pages.push('...')

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1 ${
          currentPage === 1
            ? 'bg-white/5 text-white/20 cursor-not-allowed'
            : 'glass text-white/70 hover:text-white hover:border-emerald-400/30 hover:bg-emerald-500/10'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>

      <div className="flex items-center gap-1.5">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`dots-${idx}`}
              className="w-10 h-10 flex items-center justify-center text-white/30 text-sm"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-200 ${
                currentPage === page
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110'
                  : 'glass text-white/60 hover:text-white hover:border-white/30 hover:scale-105'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1 ${
          currentPage === totalPages
            ? 'bg-white/5 text-white/20 cursor-not-allowed'
            : 'glass text-white/70 hover:text-white hover:border-emerald-400/30 hover:bg-emerald-500/10'
        }`}
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ============ MAIN SHOP PAGE ============
const ShopPage = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [productType, setProductType] = useState('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 9

  const { darkMode } = useTheme()
  const navigate = useNavigate()

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/shop/products/', {
            params: {
              page: currentPage,
              page_size: pageSize,
              category: selectedCategory !== 'all' ? selectedCategory : undefined,
              product_type: productType !== 'all' ? productType : undefined,
              search: searchQuery || undefined,
            }
          }),
          api.get('/shop/categories/')
        ])

        const data = productsRes.data
        if (data.results) {
          setProducts(data.results)
          setTotalCount(data.count || 0)
          setTotalPages(Math.ceil((data.count || 0) / pageSize))
        } else if (Array.isArray(data)) {
          setProducts(data)
          setTotalCount(data.length)
          setTotalPages(Math.ceil(data.length / pageSize))
        } else {
          setProducts([])
          setTotalCount(0)
          setTotalPages(1)
        }

        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) {
        console.error('Error loading shop data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentPage, selectedCategory, productType, searchQuery])

  // Derived data
  const filteredProducts = products
  const featuredProducts = products.filter(p => p.is_featured).slice(0, 4)
  const saleProducts = products.filter(p => p.is_on_sale).slice(0, 4)

  const productTypes = [
    { value: 'all', label: 'All Types', icon: '📦' },
    { value: 'honey', label: 'Honey', icon: '🍯' },
    { value: 'beeswax', label: 'Beeswax', icon: '🕯️' },
    { value: 'equipment', label: 'Equipment', icon: '🛠️' },
    { value: 'books', label: 'Books', icon: '📚' },
  ]

  // Handlers
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ============ LOADING STATE ============
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading shop..." />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-16 md:py-24"
    >
      <div className="container-main">
        
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span
              className="w-2 h-2 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">🛒 Online Shop</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Our <span className="gradient-text">Products</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Quality beekeeping products, honey, and equipment delivered to your doorstep
          </p>
        </motion.div>

        {/* ============ FEATURED PRODUCTS ============ */}
        {featuredProducts.length > 0 && currentPage === 1 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>⭐</span> Featured Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ SEARCH + FILTERS ============ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
                className="px-4 py-2.5 glass text-white/80 rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400/40 cursor-pointer appearance-none pr-10"
              >
                <option value="all">📂 All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? <Icon name={cat.icon} size="text-sm" /> : '📦'} {cat.name}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Product Type Filters */}
            {productTypes.map(type => (
              <button
                key={type.value}
                onClick={() => { setProductType(type.value); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  productType === type.value
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}

            {/* Clear Filters */}
            {(selectedCategory !== 'all' || productType !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setProductType('all')
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ============ SALE PRODUCTS ============ */}
        {saleProducts.length > 0 && currentPage === 1 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-400">🔥</span> On Sale
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {saleProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ ALL PRODUCTS GRID ============ */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              All Products{' '}
              {totalCount > 0 && (
                <span className="text-white/30 text-sm font-normal">
                  ({totalCount})
                </span>
              )}
            </h2>
            {totalPages > 1 && (
              <span className="text-xs text-white/30">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <>
              {/* Products Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % pageSize) * 0.04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />

              {/* Page Info */}
              {totalPages > 1 && (
                <p className="text-center text-white/20 text-xs mt-4">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
                </p>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="glass-card p-12 text-center">
              <span className="text-5xl mb-4 block opacity-40">
                {getIcon(':package:') || '📦'}
              </span>
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-white/40 mb-6">
                Try adjusting your search filters or browse all categories
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setProductType('all')
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300"
              >
                View All Products
              </button>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  )
}

export default ShopPage