// src/features/accounts/components/workspace/FieldSheets.jsx
//
// The field data behind a job: a checklist walked through on site, a column of
// readings, or a risk assessment. These are the three shapes every job this
// company sells comes down to — an environmental audit is a checklist, a noise
// or water study is readings against a limit, an OHS assessment is likelihood
// times severity.
//
// The point is that the sheet adds itself up. A reading typed in the wrong box
// changes the average and the exceedance count immediately, and the person
// reviewing the report can see the numbers it came from instead of taking the
// conclusion on trust.

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../../app/api'

const BAND_STYLE = {
  low:     'bg-emerald-500/20 text-emerald-300',
  medium:  'bg-amber-500/20 text-amber-300',
  high:    'bg-orange-500/25 text-orange-200',
  extreme: 'bg-red-500/25 text-red-200',
}

const riskBand = (score) => (score >= 15 ? 'extreme' : score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low')

const FieldSheets = ({ kind, id }) => {
  const { t } = useTranslation('admin')
  const [sheets, setSheets] = useState([])
  const [templates, setTemplates] = useState([])
  const [picking, setPicking] = useState(false)
  const [open, setOpen] = useState(null)      // id of the sheet being filled
  const [saving, setSaving] = useState(false)

  const field = kind === 'job' ? 'job' : 'task'

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/field-sheets/?${field}=${id}&page_size=50`)
      setSheets(res.data?.results || res.data || [])
    } catch (e) { console.error('field sheets load failed', e) }
  }, [field, id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/field-sheets/templates/')
      .then(res => setTemplates(res.data || []))
      .catch(() => setTemplates([]))
  }, [])

  const create = async (key) => {
    try {
      const res = await api.post('/field-sheets/from_template/', { template_key: key, [field]: id })
      setPicking(false)
      setOpen(res.data.id)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || t('sheets.create_failed', 'Could not start that sheet'))
    }
  }

  // Saving the whole sheet keeps the arithmetic honest: the server recomputes
  // the summary from the rows every time, so a corrected number corrects the
  // conclusion.
  const save = async (sheet, rows) => {
    setSaving(true)
    try {
      const res = await api.patch(`/field-sheets/${sheet.id}/`, { rows })
      setSheets(list => list.map(s => (s.id === sheet.id ? res.data : s)))
    } catch (err) {
      alert(t('sheets.save_failed', 'Could not save the data'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (sheet) => {
    if (!window.confirm(t('sheets.delete_confirm', 'Delete this sheet and its data?'))) return
    try {
      await api.delete(`/field-sheets/${sheet.id}/`)
      await load()
    } catch (err) { console.error(err) }
  }

  const setCell = (sheet, index, key, value) => {
    const rows = sheet.rows.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    setSheets(list => list.map(s => (s.id === sheet.id ? { ...s, rows } : s)))
  }

  const addRow = (sheet) => {
    const blank = sheet.kind === 'measurements' ? { point: '', value: '', time: '', note: '' }
      : sheet.kind === 'risk' ? { hazard: '', who: '', likelihood: 1, severity: 1, control: '' }
      : { item: '', status: '', note: '' }
    const rows = [...sheet.rows, blank]
    setSheets(list => list.map(s => (s.id === sheet.id ? { ...s, rows } : s)))
  }

  const Summary = ({ sheet }) => {
    const s = sheet.summary || {}
    if (sheet.kind === 'measurements') {
      if (!s.count) return <span className="text-[11px] text-white/30">{t('sheets.no_readings', 'No readings yet')}</span>
      return (
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="text-white/50">n = <b className="text-white/80">{s.count}</b></span>
          <span className="text-white/50">{t('sheets.mean', 'mean')} <b className="text-white/80">{s.mean}</b></span>
          <span className="text-white/50">min <b className="text-white/80">{s.min}</b></span>
          <span className="text-white/50">max <b className="text-white/80">{s.max}</b></span>
          <span className="text-white/50">σ <b className="text-white/80">{s.std_dev}</b></span>
          {s.limit !== undefined && (
            <span className={`px-2 py-0.5 rounded-full font-bold ${
              s.compliant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/25 text-red-200'}`}>
              {s.compliant
                ? `✓ ${t('sheets.within_limit', 'within limit')} ${s.limit}`
                : `⚠ ${s.exceedances} ${t('sheets.over_limit', 'over limit')} ${s.limit} (max ${s.worst_exceedance})`}
            </span>
          )}
        </div>
      )
    }
    if (sheet.kind === 'risk') {
      return (
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="text-white/50">{s.count} {t('sheets.hazards', 'hazards')}</span>
          {['extreme', 'high', 'medium', 'low'].map(b => (s[b] ? (
            <span key={b} className={`px-2 py-0.5 rounded-full font-bold ${BAND_STYLE[b]}`}>
              {s[b]} {t(`sheets.band_${b}`, b)}
            </span>
          ) : null))}
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="text-white/50">{t('sheets.checked', 'checked')} <b className="text-white/80">{s.count}</b></span>
        <span className="text-emerald-300">{s.compliant} {t('sheets.compliant', 'compliant')}</span>
        {s.findings > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/25 text-red-200 font-bold">
            {s.findings} {t('sheets.findings', 'findings')}
          </span>
        )}
        <span className="text-white/40">{s.percent}%</span>
      </div>
    )
  }

  const Rows = ({ sheet }) => {
    if (sheet.kind === 'measurements') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/35 text-[10px] uppercase">
                <th className="text-left py-1 pr-2">{t('sheets.point', 'Point')}</th>
                <th className="text-left py-1 pr-2">{sheet.parameter || t('sheets.value', 'Value')} {sheet.unit && `(${sheet.unit})`}</th>
                <th className="text-left py-1 pr-2">{t('sheets.time', 'Time')}</th>
                <th className="text-left py-1">{t('sheets.note', 'Note')}</th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r, i) => {
                const over = sheet.limit_value !== null && parseFloat(r.value) > sheet.limit_value
                return (
                  <tr key={i} className={over ? 'bg-red-500/10' : ''}>
                    <td className="py-0.5 pr-2">
                      <input value={r.point || ''} onChange={e => setCell(sheet, i, 'point', e.target.value)}
                        className="w-full px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                    <td className="py-0.5 pr-2">
                      <input value={r.value ?? ''} inputMode="decimal"
                        onChange={e => setCell(sheet, i, 'value', e.target.value)}
                        className={`w-24 px-2 py-1 glass rounded border-0 outline-none text-xs font-bold ${
                          over ? 'text-red-300' : ''}`} />
                    </td>
                    <td className="py-0.5 pr-2">
                      <input value={r.time || ''} onChange={e => setCell(sheet, i, 'time', e.target.value)}
                        placeholder="10:30"
                        className="w-20 px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                    <td className="py-0.5">
                      <input value={r.note || ''} onChange={e => setCell(sheet, i, 'note', e.target.value)}
                        className="w-full px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (sheet.kind === 'risk') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/35 text-[10px] uppercase">
                <th className="text-left py-1 pr-2">{t('sheets.hazard', 'Hazard')}</th>
                <th className="text-left py-1 pr-2">{t('sheets.who', 'Who')}</th>
                <th className="text-left py-1 pr-1">L</th>
                <th className="text-left py-1 pr-1">S</th>
                <th className="text-left py-1 pr-2">{t('sheets.rating', 'Rating')}</th>
                <th className="text-left py-1">{t('sheets.control', 'Control')}</th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r, i) => {
                const score = (parseInt(r.likelihood, 10) || 0) * (parseInt(r.severity, 10) || 0)
                const band = riskBand(score)
                return (
                  <tr key={i}>
                    <td className="py-0.5 pr-2">
                      <input value={r.hazard || ''} onChange={e => setCell(sheet, i, 'hazard', e.target.value)}
                        className="w-full px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                    <td className="py-0.5 pr-2">
                      <input value={r.who || ''} onChange={e => setCell(sheet, i, 'who', e.target.value)}
                        className="w-24 px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                    {['likelihood', 'severity'].map(k => (
                      <td key={k} className="py-0.5 pr-1">
                        <select value={r[k] || 1} onChange={e => setCell(sheet, i, k, e.target.value)}
                          className="px-1 py-1 glass rounded border-0 outline-none text-xs">
                          {[1, 2, 3, 4, 5].map(v => (
                            <option key={v} value={v} style={{ backgroundColor: '#0d3320', color: '#fff' }}>{v}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                    <td className="py-0.5 pr-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${BAND_STYLE[band]}`}>
                        {score} {t(`sheets.band_${band}`, band)}
                      </span>
                    </td>
                    <td className="py-0.5">
                      <input value={r.control || ''} onChange={e => setCell(sheet, i, 'control', e.target.value)}
                        placeholder={t('sheets.control_hint', 'What will be done about it')}
                        className="w-full px-2 py-1 glass rounded border-0 outline-none text-xs" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {sheet.rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input value={r.item || ''} onChange={e => setCell(sheet, i, 'item', e.target.value)}
              className="flex-1 min-w-[180px] px-2 py-1.5 glass rounded border-0 outline-none text-xs" />
            <div className="flex gap-1">
              {[['yes', '✓'], ['no', '✕'], ['na', '–']].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setCell(sheet, i, 'status', v)}
                  className={`w-8 h-7 rounded-lg text-xs font-bold ${
                    r.status === v
                      ? (v === 'yes' ? 'bg-emerald-500 text-white'
                        : v === 'no' ? 'bg-red-500 text-white' : 'bg-white/20 text-white')
                      : 'bg-white/[0.06] text-white/40'
                  }`}>{label}</button>
              ))}
            </div>
            <input value={r.note || ''} onChange={e => setCell(sheet, i, 'note', e.target.value)}
              placeholder={t('sheets.note', 'Note')}
              className="w-40 px-2 py-1.5 glass rounded border-0 outline-none text-xs" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold text-white">
          🔬 {t('sheets.title', 'Field data')}
        </h2>
        <button onClick={() => setPicking(v => !v)}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400">
          ➕ {t('sheets.new', 'New sheet')}
        </button>
      </div>
      <p className="text-[11px] text-white/40 mb-3">
        {t('sheets.hint', 'Collect it here and it adds itself up — averages, exceedances and risk ratings, ready for the report.')}
      </p>

      {picking && (
        <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
          <p className="text-[11px] text-white/45 mb-2">{t('sheets.pick', 'Start from')}</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map(tpl => (
              <button key={tpl.key} onClick={() => create(tpl.key)}
                title={tpl.service}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] hover:bg-emerald-500 hover:text-white">
                {tpl.kind === 'measurements' ? '📊' : tpl.kind === 'risk' ? '⚠️' : '☑️'} {tpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {sheets.length === 0 ? (
        <p className="text-white/30 text-sm">{t('sheets.none', 'No field data on this job yet')}</p>
      ) : (
        <div className="space-y-2">
          {sheets.map(sheet => (
            <div key={sheet.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <button onClick={() => setOpen(open === sheet.id ? null : sheet.id)}
                  className="text-left min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {sheet.kind === 'measurements' ? '📊' : sheet.kind === 'risk' ? '⚠️' : '☑️'} {sheet.title}
                  </p>
                  <div className="mt-1"><Summary sheet={sheet} /></div>
                </button>
                <div className="flex items-center gap-1.5">
                  <a href={`${api.defaults.baseURL}/api/v1/field-sheets/${sheet.id}/export/`}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] hover:bg-white/10">
                    ⬇ CSV
                  </a>
                  <button onClick={() => setOpen(open === sheet.id ? null : sheet.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px]">
                    {open === sheet.id ? t('sheets.close', 'Close') : t('sheets.fill', 'Fill in')}
                  </button>
                  <button onClick={() => remove(sheet)}
                    className="px-2 py-1.5 text-white/25 hover:text-red-300 text-[11px]">✕</button>
                </div>
              </div>

              {open === sheet.id && (
                <div className="px-3 pb-3">
                  {sheet.limit_source && (
                    <p className="text-[10px] text-white/35 mb-2">
                      {t('sheets.limit', 'Limit')}: {sheet.limit_value} {sheet.unit} · {sheet.limit_source}
                    </p>
                  )}
                  <Rows sheet={sheet} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => addRow(sheet)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px]">
                      + {t('sheets.add_row', 'Add row')}
                    </button>
                    <button onClick={() => save(sheet, sheet.rows)} disabled={saving}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold disabled:opacity-40">
                      {saving ? t('sheets.saving', 'Saving…') : t('sheets.save', 'Save data')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FieldSheets
