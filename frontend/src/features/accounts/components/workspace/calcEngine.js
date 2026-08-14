// src/features/accounts/components/workspace/calcEngine.js
//
// The maths behind the workspace calculator, kept apart from the component so
// it can be tested on its own — a calculator that is quietly wrong about
// 2^10 or sin(30) is worse than no calculator.
//
// Parsed by hand rather than handed to eval(): the display is user input, and
// eval() on user input is how a calculator becomes a way to run code.

export const FUNCTIONS = {
  sin: (x, deg) => Math.sin(deg ? (x * Math.PI) / 180 : x),
  cos: (x, deg) => Math.cos(deg ? (x * Math.PI) / 180 : x),
  tan: (x, deg) => Math.tan(deg ? (x * Math.PI) / 180 : x),
  asin: (x, deg) => (deg ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
  acos: (x, deg) => (deg ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
  atan: (x, deg) => (deg ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  '√': (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
}

const factorial = (n) => {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN
  let out = 1
  for (let i = 2; i <= n; i++) out *= i
  return out
}

/**
 * Evaluate an expression written with the calculator's own symbols.
 * Returns null for anything it can't read, so a half-typed expression shows
 * a dash instead of an error.
 *
 *   expr   := term (('+' | '−') term)*
 *   term   := power (('×' | '÷') power)*
 *   power  := unary ('^' power)?        — right associative, as in maths
 *   unary  := '−' unary | postfix
 *   postfix:= primary ('!' | '%')*
 *   primary:= number | 'π' | 'e' | func '(' expr ')' | '(' expr ')'
 */
export const evaluate = (input, deg = true) => {
  const src = String(input).replace(/\s+/g, '')
  if (!src) return null
  let i = 0

  const peek = () => src[i]
  const eat = (ch) => { if (src.startsWith(ch, i)) { i += ch.length; return true } return false }

  const parseExpr = () => {
    let left = parseTerm()
    if (left === null) return null
    for (;;) {
      if (eat('+')) {
        const right = parseTerm()
        if (right === null) return null
        left += right
      } else if (eat('−') || eat('-')) {
        const right = parseTerm()
        if (right === null) return null
        left -= right
      } else return left
    }
  }

  const parseTerm = () => {
    let left = parsePower()
    if (left === null) return null
    for (;;) {
      if (eat('×') || eat('*')) {
        const right = parsePower()
        if (right === null) return null
        left *= right
      } else if (eat('÷') || eat('/')) {
        const right = parsePower()
        if (right === null || right === 0) return null
        left /= right
      } else if (eat('mod')) {
        const right = parsePower()
        if (right === null || right === 0) return null
        left %= right
      } else return left
    }
  }

  const parsePower = () => {
    const base = parseUnary()
    if (base === null) return null
    if (eat('^')) {
      const exp = parsePower()
      if (exp === null) return null
      return Math.pow(base, exp)
    }
    return base
  }

  const parseUnary = () => {
    if (eat('−') || eat('-')) {
      const v = parseUnary()
      return v === null ? null : -v
    }
    return parsePostfix()
  }

  const parsePostfix = () => {
    let v = parsePrimary()
    if (v === null) return null
    for (;;) {
      if (eat('!')) v = factorial(v)
      else if (eat('%')) v /= 100
      else return v
    }
  }

  const parsePrimary = () => {
    if (eat('π')) return Math.PI
    if (eat('e')) return Math.E

    for (const name of Object.keys(FUNCTIONS)) {
      if (src.startsWith(name, i)) {
        i += name.length
        if (!eat('(')) return null
        const arg = parseExpr()
        if (arg === null) return null
        eat(')')                       // a missing ')' is forgiven while typing
        return FUNCTIONS[name](arg, deg)
      }
    }

    if (eat('(')) {
      const v = parseExpr()
      if (v === null) return null
      eat(')')
      return v
    }

    const m = /^\d*\.?\d+/.exec(src.slice(i))
    if (!m) return null
    i += m[0].length
    return parseFloat(m[0])
  }

  const value = parseExpr()
  if (value === null || i < src.length) return null      // trailing junk
  return Number.isFinite(value) ? value : null
}
