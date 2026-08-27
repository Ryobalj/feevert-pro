// src/features/notifications/utils/sanitizeMail.js
//
// Mail arrives as HTML written by strangers, and we render it inside our own
// page. Two things follow from that.
//
// The one people noticed: a <style> block in a message is not scoped to the
// message. Outlook attaches its own stylesheet to almost everything it sends,
// so opening a client's reply restyled the app around it — which is why the
// body text turned pale and unreadable on the dark themes while looking fine
// on the light one.
//
// The one nobody noticed: innerHTML does not run <script>, but it very much
// runs onerror and onclick, and it will happily follow a javascript: link. A
// message from outside the company is the last place to trust those.
//
// So the markup is parsed, stripped of anything that can style or execute
// beyond itself, and only then rendered. What is left is the sender's words,
// their formatting, their tables and their images.

const FORBIDDEN_TAGS = ['script', 'style', 'link', 'meta', 'base', 'iframe',
                        'object', 'embed', 'form', 'input', 'button']

export default function sanitizeMail(html) {
  if (!html) return ''
  // No DOM (tests, SSR): return nothing rather than something dangerous.
  if (typeof DOMParser === 'undefined') return ''

  let doc
  try {
    doc = new DOMParser().parseFromString(String(html), 'text/html')
  } catch {
    return ''
  }

  FORBIDDEN_TAGS.forEach(tag => {
    doc.body.querySelectorAll(tag).forEach(node => node.remove())
  })

  doc.body.querySelectorAll('*').forEach(node => {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase()
      const value = (attr.value || '').trim().toLowerCase()

      // Event handlers: onerror, onclick, onload…
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name)
        continue
      }
      // javascript: and data: URLs in links or images
      if ((name === 'href' || name === 'src' || name === 'xlink:href')
          && (value.startsWith('javascript:') || value.startsWith('vbscript:')
              || value.startsWith('data:text/html'))) {
        node.removeAttribute(attr.name)
      }
    }
    // Links out of the company should not be able to reach back into the tab
    // that opened them.
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })

  return doc.body.innerHTML
}
