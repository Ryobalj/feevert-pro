// src/features/shop/components/ProductCard.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ProductCard = ({ product }) => {
  const [currentImage, setCurrentImage] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const images = React.useMemo(() => {
    const imgs = []
    if (product.primary_image_url) imgs.push(product.primary_image_url)
    if (product.all_images && Array.isArray(product.all_images)) {
      product.all_images.forEach(img => {
        if (img.url && !imgs.includes(img.url)) imgs.push(img.url)
      })
    }
    return imgs
  }, [product])

  const hasMultipleImages = images.length > 1

  React.useEffect(() => {
    if (!isHovering && hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isHovering, hasMultipleImages, images.length])

  return (
    <Link to={`/shop/products/${product.slug}`} className="block group h-full">
      <div className="glass-card h-full flex flex-col overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 p-0">
        
        {/* Image Carousel */}
        <div 
          className="relative h-48 overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {images.length > 0 ? (
            images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={img}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 flex items-center justify-center">
              <span className="text-5xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                🍯
              </span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3320]/60 to-transparent pointer-events-none" />
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Sale badge */}
          {product.is_on_sale && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
              -{product.discount_percentage}%
            </span>
          )}
          
          {/* Out of stock overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-amber-500/90 text-white text-xs font-bold">
                Out of Stock
              </span>
            </div>
          )}
          
          {/* Dots indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImage(i) }}
                  className={`rounded-full transition-all duration-500 ${
                    i === currentImage ? 'bg-emerald-400 w-4 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-full">
          {/* Category + Rating */}
          <div className="flex items-center justify-between mb-2">
            {product.category_name && (
              <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">
                {product.category_name}
              </span>
            )}
            {product.average_rating && (
              <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                ★ {product.average_rating?.toFixed(1)}
              </span>
            )}
          </div>
          
          {/* Name */}
          <h3 className="text-sm font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed flex-1">
            {product.short_description || product.description}
          </p>

          {/* Price & Cart Button */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
            <div>
              {product.is_on_sale ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30 line-through">TZS {product.price?.toLocaleString()}</span>
                  <span className="text-sm font-bold text-red-400">TZS {product.current_price?.toLocaleString()}</span>
                </div>
              ) : (
                <span className="text-sm font-bold gradient-text">TZS {product.current_price?.toLocaleString()}</span>
              )}
            </div>
            
            {product.in_stock && (
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

export default ProductCard