// Run with:  node src/features/accounts/components/workspace/calcEngine.test.mjs
import { evaluate } from './calcEngine.js'

const near = (a, b) => a !== null && Math.abs(a - b) < 1e-9

const cases = [
  ['12×45', 540],
  ['2+3×4', 14],                 // × before +
  ['(2+3)×4', 20],               // brackets win
  ['100÷4', 25],
  ['10−3−2', 5],                 // left to right
  ['2^10', 1024],
  ['2^3^2', 512],                // right associative, not 64
  ['√(16)', 4],
  ['√(2)^2', 2],
  ['5!', 120],
  ['1÷(0.25)', 4],
  ['50%', 0.5],
  ['abs(-7)', 7],
  ['π', Math.PI],
  ['e', Math.E],
  ['ln(e)', 1],
  ['log(1000)', 3],
  ['-5+2', -3],
  ['2×-3', -6],
  ['sin(30)', 0.5, true],        // degrees
  ['cos(60)', 0.5, true],
  ['tan(45)', 1, true],
  ['sin(0)', 0, false],          // radians
  // Deliberately forgiving while you are still typing: the live preview
  // should show an answer for "sin(30" rather than a dash.
  ['sin(30', 0.5, true],
  ['((2+3)', 5],
  ['√(16', 4],
]

let failed = 0
for (const [expr, want, deg = true] of cases) {
  const got = evaluate(expr, deg)
  const ok = near(got, want)
  if (!ok) { failed++; console.log(`FAIL  ${expr}  ->  ${got}  (want ${want})`) }
}

// Things that must NOT produce a number
const invalid = ['', '2+', '×5', '5÷0', 'abc', '2..5', '2+)3']
for (const expr of invalid) {
  const got = evaluate(expr)
  if (got !== null) { failed++; console.log(`FAIL  "${expr}" should be null, got ${got}`) }
}

// The reason it isn't eval(): none of this may execute
for (const attack of ['alert(1)', 'globalThis', '1;process.exit(1)', 'constructor']) {
  const got = evaluate(attack)
  if (got !== null) { failed++; console.log(`FAIL  "${attack}" evaluated to ${got}`) }
}

console.log(failed === 0
  ? `all ${cases.length + invalid.length + 4} calculator checks passed`
  : `${failed} check(s) failed`)
process.exit(failed ? 1 : 0)
