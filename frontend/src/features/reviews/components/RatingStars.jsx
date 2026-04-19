import React from 'react'

const RatingStars = ({ rating, onRatingChange, readonly = false, size = 'default' }) => {
  const stars = [1, 2, 3, 4, 5]
  
  const sizeClasses = {
    small: 'text-sm',
    default: 'text-xl',
    large: 'text-2xl'
  }

  if (readonly) {
    return (
      <div className="flex gap-1">
        {stars.map((star) => (
          <i 
            key={star} 
            className={`fas fa-star ${sizeClasses[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange?.(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <i className={`fas fa-star ${sizeClasses[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} transition-colors`} />
        </button>
      ))}
    </div>
  )
}
export default RatingStars
