import React, { useState } from 'react'
import { motion } from 'framer-motion'

const RatingStars = ({ rating = 0, onRatingChange, readonly = false, size = 'default' }) => {
  const stars = [1, 2, 3, 4, 5]
  const [hoveredStar, setHoveredStar] = useState(0)

  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6',
  }

  const gapClasses = {
    small: 'gap-0.5',
    default: 'gap-1',
    large: 'gap-1.5',
  }

  const displayRating = readonly ? rating : (hoveredStar || rating)

  const StarIcon = ({ star, filled, interactive }) => (
    <motion.svg
      className={`${sizeClasses[size]} ${
        filled ? 'text-amber-400' : 'text-white/10'
      } ${interactive ? 'cursor-pointer' : ''}`}
      fill="currentColor"
      viewBox="0 0 24 24"
      whileHover={interactive ? { scale: 1.2 } : {}}
      whileTap={interactive ? { scale: 0.9 } : {}}
      animate={filled ? { rotate: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </motion.svg>
  )

  // Readonly mode
  if (readonly) {
    return (
      <div className={`flex ${gapClasses[size]}`}>
        {stars.map((star) => (
          <motion.div
            key={star}
            initial={star <= rating ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{ delay: star * 0.08, type: "spring", stiffness: 300 }}
          >
            <StarIcon star={star} filled={star <= rating} />
          </motion.div>
        ))}
      </div>
    )
  }

  // Interactive mode
  return (
    <div className={`flex ${gapClasses[size]}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange?.(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          className="focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <StarIcon star={star} filled={star <= displayRating} interactive />
        </button>
      ))}
      
      {/* Rating label */}
      {displayRating > 0 && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-white/50 ml-2 font-medium self-center"
        >
          {displayRating} / 5
        </motion.span>
      )}
    </div>
  )
}

export default RatingStars