// src/components/ui/TextSize.jsx
//
// Bigger text, on the reader's terms.
//
// The alternative people kept reaching for was the operating system's display
// scaling, which makes everything bigger — including the browser chrome — and
// leaves the site with a short viewport it was never designed for. Forcing a
// zoom from our side would be worse still: someone at 125% is usually there
// because they need it, and overriding that takes text away from exactly the
// people who need it most.
//
// So this is a choice, not an override: three buttons, remembered per browser,
// applied on top of whatever the reader has already set.

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const STEPS = [0.9, 1, 1.15, 1.3, 1.5]
const DEFAULT_INDEX = 1
const STORAGE_KEY = 'text_scale'

export const readSavedScale = () => {
  const saved = parseFloat(localStorage.getItem(STORAGE_KEY) || '')
  return STEPS.includes(saved) ? saved : STEPS[DEFAULT_INDEX]
}

// `zoom` scales the whole layout, not just font sizes. The site is full of
// exact sizes (badges at 10px, avatars at 32px) that a font-size change would
// leave behind, and a half-scaled interface is worse than none.
export const applyScale = (scale) => {
  document.documentElement.style.zoom = scale === 1 ? '' : String(scale)
}

const TextSize = ({ compact = false }) => {
  const { t } = useTranslation('common')
  const [scale, setScale] = useState(readSavedScale)

  useEffect(() => {
    applyScale(scale)
    try { localStorage.setItem(STORAGE_KEY, String(scale)) } catch { /* private mode */ }
  }, [scale])

  const step = useCallback((direction) => {
    setScale(current => {
      const i = STEPS.indexOf(current)
      const next = Math.min(STEPS.length - 1, Math.max(0, (i < 0 ? DEFAULT_INDEX : i) + direction))
      return STEPS[next]
    })
  }, [])

  const btn = 'flex items-center justify-center rounded-lg font-bold transition-colors ' +
    'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] ' +
    'disabled:opacity-30 disabled:hover:bg-transparent'
  const size = compact ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'

  return (
    <div className="flex items-center gap-0.5" title={t('text_size.title', 'Text size')}>
      <button onClick={() => step(-1)} disabled={scale === STEPS[0]}
        className={`${btn} ${size}`} aria-label={t('text_size.smaller', 'Smaller text')}>
        A<span className="text-[0.7em]">−</span>
      </button>
      <button onClick={() => setScale(STEPS[DEFAULT_INDEX])}
        className={`${btn} ${size} ${scale === 1 ? 'text-[var(--g-color-primary)]' : ''}`}
        aria-label={t('text_size.normal', 'Normal text size')}>
        A
      </button>
      <button onClick={() => step(1)} disabled={scale === STEPS[STEPS.length - 1]}
        className={`${btn} ${compact ? 'w-9 h-9 text-lg' : 'w-7 h-7 text-sm'}`}
        aria-label={t('text_size.bigger', 'Bigger text')}>
        A<span className="text-[0.7em]">+</span>
      </button>
    </div>
  )
}

export default TextSize
