// src/features/accounts/components/workspace/FinancePanel.jsx
//
// The accountant's view: what has been received, what is still owed, and the
// work that is about to be billed — instead of the generic staff summary.

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../../app/api'

const STATUS_STYLE = {
  completed: 'bg-emerald-500/15 text-emerald-300',
  pending:   'bg-amber-500/15 text-amber-300',
  failed:    'bg-red-500/15 text-red-300',
  refunded:  'bg-blue-500/15 text-blue-300',
}

const FinancePanel = () => {
  const { t } = useTranslation('admin')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/workspace/finance/?days=${days}`)
      setData(res.data)
    } catch (error) {
      console.error('Error loading finance:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  const money = (n, cur = data?.currency || 'TZS') =>
    `${cur} ${Number(n || 0).toLocaleString()}`

  if (loading) {
    return <div className="glass-card p-8 text-center text-white/40 text-sm">
      {t('workspace.loading', 'Loading…')}
    </div>
  }
  if (!data) {
    return <div className="glass-card p-8 text-center text-white/40 text-sm">
      {t('finance.unavailable', 'Financial data is not available for this account.')}
    </div>
  }

  const rows = (data.transactions || []).filter(tx => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [tx.customer, tx.customer_email, tx.invoice_number, tx.status]
      .some(v => (v || '').toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      {/* Money */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            {t('finance.received', 'Received')}
          </p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{money(data.received)}</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {money(data.received_period)} {t('finance.in_period', 'in the last')} {data.period_days}d
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            {t('finance.pending', 'Awaiting payment')}
          </p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{money(data.pending)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            {t('finance.to_bill', 'Work to bill')}
          </p>
          <p className="text-2xl font-extrabold text-white mt-1">{data.work?.requests_delivered ?? 0}</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {data.work?.requests_open ?? 0} {t('finance.in_progress', 'in progress')} ·{' '}
            {data.work?.bookings_upcoming ?? 0} {t('finance.bookings', 'bookings')}
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-white">
            {t('finance.transactions', 'Transactions')}
          </h3>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="ml-auto px-2.5 py-1.5 glass text-white rounded-lg border-0 outline-none text-xs">
            {[7, 30, 90, 365].map(d => (
              <option key={d} value={d}>{t('finance.last', 'Last')} {d}d</option>
            ))}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('finance.search', 'Search customer or invoice…')}
            className="px-3 py-1.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs w-48" />
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2 opacity-40">💳</div>
            <p className="text-white/45 text-sm">{t('finance.no_transactions', 'No transactions yet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-white/35 border-b border-white/5">
                  <th className="text-left px-4 py-2 font-semibold">{t('finance.customer', 'Customer')}</th>
                  <th className="text-left px-4 py-2 font-semibold">{t('finance.invoice', 'Invoice')}</th>
                  <th className="text-right px-4 py-2 font-semibold">{t('finance.amount', 'Amount')}</th>
                  <th className="text-left px-4 py-2 font-semibold">{t('finance.status', 'Status')}</th>
                  <th className="text-left px-4 py-2 font-semibold">{t('finance.date', 'Date')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(tx => (
                  <tr key={tx.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5">
                      <div className="text-white/80 truncate max-w-[180px]">{tx.customer || '—'}</div>
                      <div className="text-[11px] text-white/35 truncate max-w-[180px]">{tx.customer_email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-white/55 text-xs">{tx.invoice_number || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-white whitespace-nowrap">
                      {money(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        STATUS_STYLE[tx.status] || 'bg-white/10 text-white/60'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-white/45 text-xs whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default FinancePanel
