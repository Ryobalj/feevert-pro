import React from 'react'

const Loader = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-feevert-light border-t-feevert-green rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

export default Loader
