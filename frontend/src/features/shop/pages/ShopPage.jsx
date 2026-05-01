import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

// ============ ICON MAP ============
const iconMap = {
  ':bee:': '🐝', ':leaf:': '🌿', ':shield:': '🛡️',
  ':honey:': '🍯', ':tools:': '🛠️', ':books:': '📚',
  ':sunflower:': '🌻', ':home:': '🏠', ':clipboard:': '📋',
  ':search:': '🔍', ':recycle:': '♻️', ':globe:': '🌍',
  ':map:': '🗺️', ':scroll:': '📜', ':warning:': '⚠️',
  ':chart:': '📊', ':graduate:': '🎓', ':detective:': '🔎',
}

const getIcon = (icon) => {
  if (!icon) return '📦'
  return iconMap[icon] || icon
}

// ============ PRODUCT CARD COMPONENT ============
const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false)

  return (
    <Link to={`/shop/products/${product.slug}`} className="block group h-full">
      <div className="glass-card h-full flex flex-col overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 p-0">
        
        {/* Product Image */}
        <div className="relative h-48 overflow-hidden">
          {product.primary_image_url && !imgError ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 flex items-center justify-center">
              <span className="text-5xl">{getIcon(product.icon)}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 to-transparent pointer-events-none" />
          
          {/* Sale badge */}
          {product.is_on_sale && (
            <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold">
              -{product.discount_percentage}%
            </span>
          )}
          
          {/* Stock badge */}
          {!product.in_stock && (
            <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold">
              Out of Stock
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-full">
          {/* Category */}
          {product.category_name && (
            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1">
              {product.category_name}
            </span>
          )}
          
          {/* Name */}
          <h3 className="text-sm font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed flex-1">
            {product.short_description || product.description}
          </p>

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              {product.is_on_sale ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 line-through">TZS {product.price?.toLocaleString()}</span>
                  <span className="text-sm font-bold text-red-400">TZS {product.current_price?.toLocaleString()}</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-emerald-400">TZS {product.current_price?.toLocaleString()}</span>
              )}
            </div>
            
            {product.in_stock && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // TODO: Add to cart
                }}
                className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500 flex items-center justify-center transition-all duration-300 group/btn"
              >
                <svg className="w-4 h-4 text-emerald-400 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
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
  const { darkMode } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/shop/products/'),
          api.get('/shop/categories/')
        ])
        setProducts(productsRes.data?.results || productsRes.data || [])
        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) {
        console.error('Error loading shop data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category?.toString() !== selectedCategory.toString()) return false
    if (productType !== 'all' && p.product_type !== productType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 4)
  const saleProducts = products.filter(p => p.is_on_sale).slice(0, 4)

  const productTypes = [
    { value: 'all', label: 'All Types', icon: '📦' },
    { value: 'honey', label: 'Honey', icon: '🍯' },
    { value: 'beeswax', label: 'Beeswax', icon: '🕯️' },
    { value: 'equipment', label: 'Equipment', icon: '🛠️' },
    { value: 'books', label: 'Books', icon: '📚' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading shop...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-16 md:py-24">
      <div className="container-main">
        
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-amber-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
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
        {featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>⭐</span> Featured Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ SEARCH + FILTERS ============ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
            />
          </div>

          {/* Product Type Filters */}
          <div className="flex flex-wrap gap-2">
            {productTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setProductType(type.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  productType === type.value
                    ? 'bg-emerald-500 text-white'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============ SALE PRODUCTS ============ */}
        {saleProducts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-400">🔥</span> On Sale
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {saleProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ ALL PRODUCTS ============ */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            All Products {filteredProducts.length > 0 && <span className="text-white/30 text-sm font-normal">({filteredProducts.length})</span>}
          </h2>
          
          {filteredProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <span className="text-5xl mb-4 block opacity-40">📦</span>
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-white/40">Try adjusting your search or filter</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  )
}

export default ShopPage