// src/features/accounts/components/workspace/Calculator.jsx
//
// A small calculator for the quick sums that come up mid-task (a quote total,
// a percentage) without leaving the workspace. Keeps a short tape so you can
// see how you got there.

import React, { useState, useEffect, useCallback } from 'react'

const KEYS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

// Evaluate a flat expression without eval(): parse numbers and operators, do
// × ÷ first, then + −.
const compute = (expr) => {
  const tokens = expr.replace(/,/g, '').match(/(\d+\.?\d*|[+\-×÷])/g)
  if (!tokens || !tokens.length) return null
  const nums = []
  const ops = []
  for (const tk of tokens) {
    if (/[+\-×÷]/.test(tk)) {
      ops.push(tk)
    } else {
      let n = parseFloat(tk)
      if (isNaN(n)) return null
      if (ops.length && (ops[ops.length - 1] === '×' || ops[ops.length - 1] === '÷')) {
        const op = ops.pop()
        const prev = nums.pop()
        if (op === '÷' && n === 0) return null
        n = op === '×' ? prev * n : prev / n
      }
      nums.push(n)
    }
  }
  let total = nums[0] ?? 0
  for (let i = 0; i < ops.length; i++) {
    const n = nums[i + 1]
    if (n === undefined) break
    total = ops[i] === '+' ? total + n : total - n
  }
  return total
}

const Calculator = () => {
  const [expr, setExpr] = useState('')
  const [tape, setTape] = useState([])

  const press = useCallback((key) => {
    setExpr(prev => {
      if (key === 'C') return ''
      if (key === '⌫') return prev.slice(0, -1)
      if (key === '±') {
        const m = prev.match(/(\d+\.?\d*)$/)
        if (!m) return prev
        return prev.slice(0, m.index) + (prev.slice(m.index).startsWith('-') ? m[1] : `-${m[1]}`)
      }
      if (key === '%') {
        const v = compute(prev)
        return v === null ? prev : String(v / 100)
      }
      if (key === '=') {
        const v = compute(prev)
        if (v === null) return prev
        const line = `${prev} = ${Number(v.toFixed(6))}`
        setTape(t => [line, ...t].slice(0, 6))
        return String(Number(v.toFixed(6)))
      }
      return prev + key
    })
  }, [])

  // Keyboard support — a calculator you can't type into is annoying.
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key
      if (/[0-9.]/.test(k)) press(k)
      else if (k === '+') press('+')
      else if (k === '-') press('−')
      else if (k === '*') press('×')
      else if (k === '/') { e.preventDefault(); press('÷') }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); press('=') }
      else if (k === 'Backspace') press('⌫')
      else if (k === 'Escape') press('C')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const preview = compute(expr)

  return (
    <div className="glass-card p-4 w-full max-w-xs">
      <div className="mb-3">
        <div className="px-3 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-right">
          <div className="text-xs text-white/35 h-4 truncate">{expr || '0'}</div>
          <div className="text-2xl font-extrabold text-white truncate">
            {preview !== null ? Number(preview.toFixed(6)).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.flat().map(k => {
          const isOp = ['÷', '×', '−', '+', '='].includes(k)
          const isFn = ['C', '±', '%', '⌫'].includes(k)
          return (
            <button key={k} onClick={() => press(k)}
              className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                k === '=' ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : isOp ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : isFn ? 'bg-white/[0.08] text-white/60 hover:bg-white/[0.14]'
                  : 'bg-white/[0.05] text-white/85 hover:bg-white/[0.1]'
              }`}>
              {k}
            </button>
          )
        })}
      </div>

      {tape.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">History</span>
            <button onClick={() => setTape([])} className="text-[10px] text-white/30 hover:text-red-300">clear</button>
          </div>
          {tape.map((line, i) => (
            <div key={i} className="text-[11px] text-white/45 truncate">{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Calculator
