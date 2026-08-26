// frontend/src/app/openFile.js
//
// Opening a file the API guards.
//
// A plain <a href="/api/v1/…"> is a browser navigation: it carries cookies,
// and this API authenticates with a bearer token held in localStorage and
// attached by axios. So every such link arrived with no credentials and came
// back "401 Unauthorized" — the file was there, the door just never saw a key.
//
// Fetching it through the same client that holds the token, then handing the
// browser the bytes, opens the file with no new endpoint and no token in a
// URL that could be copied out of the address bar.

import api from './api'

const revokeLater = (url) => {
  // Long enough for the new tab to have loaded it; the browser keeps its own
  // copy after that.
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/**
 * @param {string} path      API path, e.g. `/email-inbox/12/attachment/34/`
 * @param {object} options   { download: 'name.pdf' } to save instead of view
 */
export default async function openFile(path, { download = '' } = {}) {
  const res = await api.get(path, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)

  if (download) {
    const a = document.createElement('a')
    a.href = url
    a.download = download
    document.body.appendChild(a)
    a.click()
    a.remove()
    revokeLater(url)
    return
  }

  // A popup blocker can refuse window.open; falling back to the same tab is
  // better than a click that silently does nothing.
  const tab = window.open(url, '_blank', 'noopener')
  if (!tab) window.location.href = url
  revokeLater(url)
}

/** The message an API error carries, dug out of a blob response if need be. */
export async function fileError(err) {
  const data = err?.response?.data
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text())
      return parsed.error || parsed.detail || ''
    } catch { /* not JSON */ }
  }
  return data?.error || data?.detail || err?.message || ''
}
