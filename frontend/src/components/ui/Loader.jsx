import React from 'react'

const Loader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className={`spinner ${sizes[size] || ''}`} />
      {text && (
        <p className="text-sm text-[var(--g-text-tertiary)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export default Loader