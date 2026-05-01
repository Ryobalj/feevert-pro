import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useCart } from '../context/CartContext'
import api from '../../../app/api'

const ProductDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const { darkMode } = useTheme()
  const { addToCart, isInCart } = useCart()
  const [currentImage, setCurrentImage] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/shop/products/${slug}/`)
        setProduct(res.data)
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Product not found')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [slug])

  const allImages = React.useMemo(() => {
    if (!product) return []
    const imgs = []
    if (product.primary_image_url) imgs.push(product.primary_image_url)
    if (product.gallery && Array.isArray(product.gallery)) {
      product.gallery.forEach(img => {
        if (img.image_url && !imgs.includes(img.image_url)) imgs.push(img.image_url)
      })
    }
    if (product.all_images && Array.isArray(product.all_images)) {
      product.all_images.forEach(img => {
        if (img.url && !imgs.includes(img.url)) imgs.push(img.url)
      })
    }
    return imgs
  }, [product])

  const hasMultipleImages = allImages.length > 1

  React.useEffect(() => {
    if (!isHovering && hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % allImages.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isHovering, hasMultipleImages, allImages.length])

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    const result = await addToCart(product.id, quantity)
    setAddingToCart(false)
    if (result.success) {
      // Optional: show toast notification
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-white mb-2">Product not found</h2>
          <p className="text-white/50 mb-6">The product you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  const inCart = isInCart(product.id)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-5xl">
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shop
        </motion.button>

        {/* Product Detail */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden glass-card !p-0"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {allImages.length > 0 ? (
                <>
                  {allImages.map((img, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                    >
                      <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/40 to-transparent pointer-events-none" />
                  
                  {/* Dots */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`rounded-full transition-all duration-300 ${
                            i === currentImage ? 'bg-emerald-400 w-5 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Arrows */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev - 1 + allImages.length) % allImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev + 1) % allImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 flex items-center justify-center">
                  <span className="text-8xl opacity-40">🍯</span>
                </div>
              )}
              
              {/* Sale badge */}
              {product.is_on_sale && (
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-sm font-bold">
                  -{product.discount_percentage}% OFF
                </span>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card p-6 md:p-8">
              {/* Category */}
              {product.category_name && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mb-4">
                  {product.category_name}
                </span>
              )}
              
              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{product.name}</h1>
              
              {/* Rating */}
              {product.average_rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.round(product.average_rating) ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-white/40">({product.review_count || 0} reviews)</span>
                </div>
              )}
              
              {/* Price */}
              <div className="mb-6">
                {product.is_on_sale ? (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-white/30 line-through">TZS {product.price?.toLocaleString()}</span>
                    <span className="text-3xl font-extrabold gradient-text">TZS {product.current_price?.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold gradient-text">TZS {product.current_price?.toLocaleString()}</span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.in_stock ? (
                  <span className="flex items-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-400">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="h-px bg-white/5 mb-6" />
              <p className="text-white/60 leading-relaxed mb-6">{product.description}</p>

              {/* Quantity + Add to Cart */}
              {product.in_stock && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white hover:border-emerald-400/30 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-12 text-center text-white font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white hover:border-emerald-400/30 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                      inCart
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {addingToCart ? 'Adding...' : inCart ? '✓ Added to Cart - Add More' : 'Add to Cart'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Specifications */}
        {(product.weight || product.dimensions || product.ingredients) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📋</span>
              Specifications
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {product.weight && (
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Weight</span>
                  <p className="text-white/70 mt-1">{product.weight}</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Dimensions</span>
                  <p className="text-white/70 mt-1">{product.dimensions}</p>
                </div>
              )}
              {product.ingredients && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Ingredients</span>
                  <p className="text-white/70 mt-1">{product.ingredients}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Benefits */}
        {product.benefits && product.benefits.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">✨</span>
              Benefits
            </h3>
            <ul className="space-y-3">
              {product.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-white/60 text-sm">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ProductDetailPage