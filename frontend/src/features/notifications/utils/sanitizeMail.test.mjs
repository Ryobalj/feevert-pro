// Run with: node src/features/notifications/utils/sanitizeMail.test.mjs
import { JSDOM } from 'jsdom'
const dom = new JSDOM('')
global.DOMParser = dom.window.DOMParser

const { default: sanitizeMail } = await import(
  './sanitizeMail.js')

let failed = 0
const check = (name, got, want) => {
  const ok = typeof want === 'function' ? want(got) : got === want
  if (!ok) { failed++; console.log(`FAIL ${name}\n   got: ${got}`) }
}

check("the sender's stylesheet cannot restyle our page",
  sanitizeMail('<style>body{color:#eee}</style><p>Hello</p>'),
  g => !g.includes('<style') && g.includes('Hello'))

check('an onerror handler is removed',
  sanitizeMail('<img src="x" onerror="alert(1)">'),
  g => !g.toLowerCase().includes('onerror') && g.includes('img'))

check('a javascript: link loses its href',
  sanitizeMail('<a href="javascript:alert(1)">click</a>'),
  g => !g.includes('javascript:') && g.includes('click'))

check('a real link survives and opens safely',
  sanitizeMail('<a href="https://wvi.org">tender</a>'),
  g => g.includes('https://wvi.org') && g.includes('noopener'))

check('the words, formatting and tables survive',
  sanitizeMail('<p><b>Delivery note</b></p><table><tr><td>1</td></tr></table>'),
  g => g.includes('<b>Delivery note</b>') && g.includes('<td>1</td>'))

check('images still come through',
  sanitizeMail('<img src="https://x/logo.png">'),
  g => g.includes('logo.png'))

check('nothing in, nothing out', sanitizeMail(''), '')

console.log(failed === 0 ? 'all 7 sanitiser checks passed' : `${failed} failed`)
process.exit(failed ? 1 : 0)
