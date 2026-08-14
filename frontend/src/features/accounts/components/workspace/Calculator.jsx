// src/features/accounts/components/workspace/Calculator.jsx
//
// A calculator for the sums that come up mid-task — a quote total, a
// percentage, and now the scientific ones an environmental report needs
// (logs for pH and decibels, trig for slopes and areas). Two modes, because
// the extra keys are noise when you only want 12 × 45.
//
// Everything is parsed by hand rather than handed to eval(): the display is
// user input, and eval() on user input is how a calculator becomes a way to
// run code.

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { evaluate } from './calcEngine'

const BASIC_KEYS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

// The scientific rows sit above the basic pad, so the number keys never move.
const SCI_KEYS = [
  ['(', ')', 'x²', 'xʸ', '√'],
  ['sin', 'cos', 'tan', 'ln', 'log'],
  ['π', 'e', 'n!', '1/x', '|x|'],
]

const Calculator = () => {
  const { t } = useTranslation('admin')
  const [expr, setExpr] = useState('')
  const [tape, setTape] = useState([])
  const [scientific, setScientific] = useState(false)
  const [deg, setDeg] = useState(true)
  const [memory, setMemory] = useState(0)

  const press = useCallback((key) => {
    setExpr(prev => {
      switch (key) {
        case 'C': return ''
        case '⌫': return prev.slice(0, -1)
        case '±': {
          const m = prev.match(/(\d+\.?\d*)$/)
          if (!m) return prev
          return prev.slice(0, m.index) + (prev.slice(m.index).startsWith('-') ? m[1] : `-${m[1]}`)
        }
        case 'x²': return `${prev}^2`
        case 'xʸ': return `${prev}^`
        case '√': return `${prev}√(`
        case 'n!': return `${prev}!`
        case '1/x': return `1÷(${prev})`
        case '|x|': return `abs(${prev}`
        case 'sin': case 'cos': case 'tan': case 'ln': case 'log':
          return `${prev}${key}(`
        case '=': {
          const v = evaluate(prev, deg)
          if (v === null) return prev
          setTape(list => [`${prev} = ${Number(v.toFixed(8))}`, ...list].slice(0, 8))
          return String(Number(v.toFixed(8)))
        }
        default: return prev + key
      }
    })
  }, [deg])

  // Keyboard support — a calculator you can't type into is annoying.
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key
      if (/^[0-9.()^!]$/.test(k)) press(k)
      else if (k === '+') press('+')
      else if (k === '-') press('−')
      else if (k === '*') press('×')
      else if (k === '%') press('%')
      else if (k === '/') { e.preventDefault(); press('÷') }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); press('=') }
      else if (k === 'Backspace') press('⌫')
      else if (k === 'Escape') press('C')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const preview = evaluate(expr, deg)

  const Key = ({ k, tone }) => (
    <button onClick={() => press(k)}
      className={`py-3 rounded-xl text-sm font-bold transition-colors ${
        tone === 'equals' ? 'bg-emerald-500 text-white hover:bg-emerald-400'
          : tone === 'op' ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
          : tone === 'fn' ? 'bg-white/[0.08] text-white/60 hover:bg-white/[0.14]'
          : tone === 'sci' ? 'bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 text-xs'
          : 'bg-white/[0.05] text-white/85 hover:bg-white/[0.1]'
      }`}>
      {k}
    </button>
  )

  return (
    <div className={`glass-card p-4 w-full ${scientific ? 'max-w-md' : 'max-w-xs'}`}>
      {/* mode switch */}
      <div className="flex items-center gap-1.5 mb-3">
        <button onClick={() => setScientific(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            !scientific ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-white/60'
          }`}>
          {t('workspace.calc_basic', 'Basic')}
        </button>
        <button onClick={() => setScientific(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            scientific ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-white/60'
          }`}>
          {t('workspace.calc_scientific', 'Scientific')}
        </button>
        {scientific && (
          <button onClick={() => setDeg(d => !d)}
            title={t('workspace.calc_angle', 'Angle unit for sin, cos and tan')}
            className="ml-auto px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.06] text-white/70">
            {deg ? 'DEG' : 'RAD'}
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="px-3 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-right">
          <div className="text-xs text-white/35 h-4 truncate">{expr || '0'}</div>
          <div className="text-2xl font-extrabold text-white truncate">
            {preview !== null ? Number(preview.toFixed(8)).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {scientific && (
        <>
          <div className="grid grid-cols-5 gap-1.5 mb-1.5">
            {SCI_KEYS.flat().map(k => <Key key={k} k={k} tone="sci" />)}
          </div>
          {/* Memory: the one thing a paper tape can't do — hold a running
              figure while you work out the next one. */}
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            <button onClick={() => setMemory(preview ?? 0)}
              className="py-2 rounded-xl text-[11px] font-bold bg-white/[0.06] text-white/60 hover:bg-white/[0.12]">MS</button>
            <button onClick={() => setExpr(prev => prev + String(memory))}
              className="py-2 rounded-xl text-[11px] font-bold bg-white/[0.06] text-white/60 hover:bg-white/[0.12]">MR</button>
            <button onClick={() => setMemory(m => m + (preview ?? 0))}
              className="py-2 rounded-xl text-[11px] font-bold bg-white/[0.06] text-white/60 hover:bg-white/[0.12]">M+</button>
            <button onClick={() => setMemory(0)}
              className="py-2 rounded-xl text-[11px] font-bold bg-white/[0.06] text-white/60 hover:bg-white/[0.12]">MC</button>
          </div>
        </>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {BASIC_KEYS.flat().map(k => (
          <Key key={k} k={k}
            tone={k === '=' ? 'equals'
              : ['÷', '×', '−', '+'].includes(k) ? 'op'
              : ['C', '±', '%', '⌫'].includes(k) ? 'fn' : undefined} />
        ))}
      </div>

      {tape.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">
              {t('workspace.calc_history', 'History')}
            </span>
            <button onClick={() => setTape([])} className="text-[10px] text-white/30 hover:text-red-300">
              {t('workspace.calc_clear', 'clear')}
            </button>
          </div>
          {tape.map((line, i) => (
            <button key={i} onClick={() => setExpr(line.split(' = ')[1] || '')}
              className="block w-full text-left text-[11px] text-white/45 truncate hover:text-white/80">
              {line}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Calculator
