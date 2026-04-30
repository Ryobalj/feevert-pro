// src/components/ui/Loader.jsx

import React from 'react'

const Loader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: { outer: 64, middle: 48, inner: 32, dot: 8, text: 'text-xs' },
    md: { outer: 96, middle: 72, inner: 48, dot: 12, text: 'text-sm' },
    lg: { outer: 128, middle: 96, inner: 64, dot: 16, text: 'text-base' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        {/* Ambient glow background */}
        <div className="absolute -inset-8 bg-amber-400/5 rounded-full blur-3xl animate-pulse" />
        
        {/* Outer ring - thick, clockwise, slow */}
        <div 
          className="absolute rounded-full animate-spin border-[5px] border-white/10"
          style={{ 
            width: s.outer, 
            height: s.outer,
            borderTopColor: 'rgba(255,255,255,0.4)',
            borderRightColor: 'rgba(255,255,255,0.15)',
            boxShadow: '0 0 40px rgba(255,255,255,0.05), inset 0 0 30px rgba(255,255,255,0.03)',
            animationDuration: '3s',
          }}
        >
          {/* Glass shine highlight on ring */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/50 rounded-full blur-[2px]" />
        </div>

        {/* Middle ring - medium, counter-clockwise, gold */}
        <div 
          className="absolute rounded-full animate-spin border-[4px] border-amber-400/20"
          style={{ 
            width: s.middle, 
            height: s.middle,
            top: (s.outer - s.middle) / 2,
            left: (s.outer - s.middle) / 2,
            borderTopColor: 'rgba(251,191,36,0.5)',
            borderLeftColor: 'rgba(251,191,36,0.2)',
            boxShadow: '0 0 35px rgba(251,191,36,0.08), inset 0 0 20px rgba(251,191,36,0.05)',
            animationDuration: '2.5s',
            animationDirection: 'reverse',
          }}
        >
          <div className="absolute top-0 right-1/4 -translate-y-1/2 w-2 h-2 bg-amber-300/60 rounded-full blur-[1px]" />
        </div>

        {/* Inner ring - thin, clockwise, fast */}
        <div 
          className="absolute rounded-full animate-spin border-[3px] border-white/10"
          style={{ 
            width: s.inner, 
            height: s.inner,
            top: (s.outer - s.inner) / 2,
            left: (s.outer - s.inner) / 2,
            borderTopColor: 'rgba(255,255,255,0.6)',
            boxShadow: '0 0 25px rgba(255,255,255,0.06)',
            animationDuration: '1.8s',
          }}
        >
          <div className="absolute bottom-0 left-1/3 translate-y-1/2 w-1.5 h-1.5 bg-white/40 rounded-full blur-[1px]" />
        </div>

        {/* Center dot - pulsing gold */}
        <div 
          className="absolute rounded-full animate-pulse"
          style={{
            width: s.dot,
            height: s.dot,
            top: (s.outer - s.dot) / 2,
            left: (s.outer - s.dot) / 2,
            background: 'radial-gradient(circle at 40% 40%, #fde68a, #f59e0b)',
            boxShadow: '0 0 20px rgba(251,191,36,0.4), 0 0 40px rgba(251,191,36,0.2)',
          }}
        />
      </div>
      
      {text && (
        <p 
          className={`${s.text} text-white/40 font-light uppercase tracking-[0.25em] animate-pulse`}
          style={{ animationDuration: '2.5s' }}
        >
          {text}
        </p>
      )}
    </div>
  )
}

export default Loader