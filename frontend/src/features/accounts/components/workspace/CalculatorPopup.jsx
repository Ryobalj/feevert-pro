// src/features/accounts/components/workspace/CalculatorPopup.jsx
//
// The calculator used to be a section: to add up a quote you had to leave the
// thing you were adding up. As a window you can drag, it sits beside the work
// instead of replacing it.
//
// Same rules as the chat window, and for the same reasons: rendered into
// <body> so "centre of the screen" means the screen, and its drag is bounded
// by the viewport so it can never be pulled somewhere you can't close it.

import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Calculator from './Calculator'

const CalculatorPopup = ({ open, onClose }) => {
  const { t } = useTranslation('admin')
  const dragControls = useDragControls()
  const boundsRef = useRef(null)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div ref={boundsRef}
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={boundsRef}
            dragMomentum={false}
            dragElastic={0}
            className="pointer-events-auto max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
          >
            {/* Header doubles as the drag handle, so scrolling the keys or
                typing a sum never drags the window. */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-500/15 border-b border-white/10 select-none md:cursor-move rounded-t-2xl"
            >
              <span className="text-sm font-bold text-white">
                🧮 {t('workspace.calculator', 'Calculator')}
              </span>
              <button
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                title={t('workspace.close', 'Close')}
                aria-label={t('workspace.close', 'Close')}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white flex-shrink-0 shadow-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Calculator />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default CalculatorPopup
