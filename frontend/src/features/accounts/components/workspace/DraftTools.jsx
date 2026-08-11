// src/features/accounts/components/workspace/DraftTools.jsx
//
// Quick drafting tools: a rich-text note and a small grid, enough to capture
// work on the spot. Anything heavier gets downloaded and finished in Word or
// Excel — plus one-click links to start a real Google/Office file.

import React, { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../../../app/api'

const EXTERNAL = [
  { label: 'Google Docs',   icon: '📘', url: 'https://docs.new' },
  { label: 'Google Sheets', icon: '📗', url: 'https://sheets.new' },
  { label: 'Word online',   icon: '📄', url: 'https://www.office.com/launch/word' },
  { label: 'Excel online',  icon: '📊', url: 'https://www.office.com/launch/excel' },
]

const download = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

// Word opens an HTML payload saved as .doc, so a draft can be finished there
// without needing a real .docx writer in the browser.
const downloadDoc = (title, html) => download(
  `${title || 'draft'}.doc`,
  `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title || 'Draft'}</title></head><body>${html || ''}</body></html>`,
  'application/msword'
)

const csvCell = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const downloadSheet = (title, rows) => download(
  `${title || 'sheet'}.csv`,
  (rows || []).map(r => r.map(csvCell).join(',')).join('\n'),
  'text/csv;charset=utf-8'
)

const emptyGrid = (rows = 8, cols = 5) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))

const DraftTools = () => {
  const [docs, setDocs] = useState([])
  const [active, setActive] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const editorRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/work-documents/?page_size=100')
      setDocs(res.data?.results || res.data || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { load() }, [load])

  // Load the document body into the editor only when the document changes —
  // rewriting it on every keystroke would fight the caret.
  useEffect(() => {
    if (active?.kind === 'doc' && editorRef.current) {
      editorRef.current.innerHTML = active.content || ''
    }
  }, [active?.id])

  const create = async (kind) => {
    try {
      const res = await api.post('/work-documents/', {
        title: kind === 'doc' ? 'Untitled draft' : 'Untitled sheet',
        kind,
        content: '',
        data: kind === 'sheet' ? emptyGrid() : [],
      })
      setDocs(prev => [res.data, ...prev])
      setActive(res.data)
    } catch (e) { alert('Could not create the draft') }
  }

  const save = async (patch = {}) => {
    if (!active) return
    setSaving(true)
    try {
      const body = {
        title: active.title,
        content: active.kind === 'doc' ? (editorRef.current?.innerHTML ?? active.content) : active.content,
        data: active.data,
        external_url: active.external_url || '',
        is_shared: !!active.is_shared,
        ...patch,
      }
      const res = await api.patch(`/work-documents/${active.id}/`, body)
      setActive(res.data)
      setDocs(prev => prev.map(d => d.id === res.data.id ? res.data : d))
      setSavedAt(new Date())
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not save')
    } finally { setSaving(false) }
  }

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return
    try {
      await api.delete(`/work-documents/${doc.id}/`)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      if (active?.id === doc.id) setActive(null)
    } catch (e) { alert('Could not delete') }
  }

  const cmd = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const setCell = (r, c, value) => {
    setActive(prev => {
      const data = prev.data.map(row => [...row])
      data[r][c] = value
      return { ...prev, data }
    })
  }

  const colSum = (c) => {
    const nums = (active?.data || []).map(r => parseFloat(r[c])).filter(n => !isNaN(n))
    return nums.length ? nums.reduce((a, b) => a + b, 0) : ''
  }

  return (
    <div className="space-y-4">
      {/* new + external */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => create('doc')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
            📝 New draft
          </button>
          <button onClick={() => create('sheet')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-400 text-white text-sm font-semibold">
            📊 New sheet
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          {EXTERNAL.map(x => (
            <a key={x.label} href={x.url} target="_blank" rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-white/[0.06] text-white/75 text-xs font-semibold hover:bg-white/10">
              {x.icon} {x.label}
            </a>
          ))}
        </div>
        <p className="text-[11px] text-white/35 mt-2">
          Draft here for speed; download to finish in Word or Excel, or start straight in Google/Office.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* list */}
        <div className="glass-card p-3 h-fit">
          <p className="px-2 pb-2 text-[10px] uppercase tracking-wider text-white/30 font-bold">My drafts</p>
          {docs.length === 0 ? (
            <p className="text-white/30 text-xs px-2 py-4">Nothing yet</p>
          ) : docs.map(d => (
            <div key={d.id}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer ${
                active?.id === d.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/65 hover:bg-white/[0.05]'
              }`}
              onClick={() => setActive(d)}>
              <span>{d.kind === 'sheet' ? '📊' : '📝'}</span>
              <span className="text-sm truncate flex-1">{d.title}</span>
              <button onClick={(e) => { e.stopPropagation(); remove(d) }}
                className="text-white/25 hover:text-red-300 text-xs">✕</button>
            </div>
          ))}
        </div>

        {/* editor */}
        <div className="glass-card p-4 min-h-[420px]">
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="text-4xl mb-3 opacity-30">📝</div>
              <p className="text-white/50 text-sm">Pick a draft, or start a new one</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <input value={active.title}
                  onChange={e => setActive({ ...active, title: e.target.value })}
                  onBlur={() => save()}
                  className="flex-1 min-w-[160px] px-3 py-2 glass text-white rounded-lg border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm font-semibold" />
                <button onClick={() => save()} disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400 disabled:opacity-40">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => active.kind === 'doc'
                    ? downloadDoc(active.title, editorRef.current?.innerHTML)
                    : downloadSheet(active.title, active.data)}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.06] text-white/75 text-xs font-semibold hover:bg-white/10">
                  ⬇ {active.kind === 'doc' ? 'Download (.doc)' : 'Download (.csv)'}
                </button>
                <label className="flex items-center gap-1.5 text-[11px] text-white/50 cursor-pointer">
                  <input type="checkbox" checked={!!active.is_shared}
                    onChange={e => save({ is_shared: e.target.checked })} />
                  Share with team
                </label>
                {savedAt && <span className="text-[10px] text-white/25">saved {savedAt.toLocaleTimeString()}</span>}
              </div>

              {/* link to the real file, if it lives in Google/Office */}
              <input value={active.external_url || ''}
                onChange={e => setActive({ ...active, external_url: e.target.value })}
                onBlur={() => save()}
                placeholder="Link to the Google Doc / Office file (optional)"
                className="w-full mb-3 px-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs" />
              {active.external_url && (
                <a href={active.external_url} target="_blank" rel="noreferrer"
                  className="inline-block mb-3 text-xs text-emerald-300 hover:text-emerald-200 underline">
                  🔗 Open the linked file
                </a>
              )}

              {active.kind === 'doc' ? (
                <>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[
                      ['bold', 'B'], ['italic', 'I'], ['underline', 'U'],
                      ['insertUnorderedList', '• List'], ['insertOrderedList', '1. List'],
                    ].map(([c, label]) => (
                      <button key={c} onClick={() => cmd(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs font-semibold hover:bg-white/10">
                        {label}
                      </button>
                    ))}
                    <select onChange={e => { cmd('formatBlock', e.target.value); e.target.value = '' }}
                      className="px-2 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs outline-none border-0">
                      <option value="" style={{ backgroundColor: '#0d3320' }}>Style</option>
                      <option value="h1" style={{ backgroundColor: '#0d3320' }}>Heading 1</option>
                      <option value="h2" style={{ backgroundColor: '#0d3320' }}>Heading 2</option>
                      <option value="p" style={{ backgroundColor: '#0d3320' }}>Normal</option>
                    </select>
                  </div>
                  <div ref={editorRef} contentEditable suppressContentEditableWarning
                    onBlur={() => save()}
                    className="min-h-[320px] p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/85 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-400/30 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" />
                </>
              ) : (
                <div className="overflow-auto">
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setActive({ ...active, data: [...active.data, active.data[0].map(() => '')] })}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs hover:bg-white/10">+ Row</button>
                    <button onClick={() => setActive({ ...active, data: active.data.map(r => [...r, '']) })}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs hover:bg-white/10">+ Column</button>
                  </div>
                  <table className="border-collapse">
                    <tbody>
                      {(active.data || []).map((row, r) => (
                        <tr key={r}>
                          <td className="text-[10px] text-white/25 pr-1 text-right w-6">{r + 1}</td>
                          {row.map((cell, c) => (
                            <td key={c} className="border border-white/10 p-0">
                              <input value={cell} onChange={e => setCell(r, c, e.target.value)} onBlur={() => save()}
                                className="w-28 px-2 py-1.5 bg-transparent text-white/85 text-xs outline-none focus:bg-emerald-500/10" />
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <td className="text-[10px] text-white/25 pr-1 text-right">Σ</td>
                        {(active.data?.[0] || []).map((_, c) => (
                          <td key={c} className="border border-white/10 px-2 py-1.5 text-xs text-emerald-300 font-semibold">
                            {colSum(c)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-white/30 mt-2">Σ totals each numeric column. Download as .csv to open in Excel.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DraftTools
