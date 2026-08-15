// src/features/notifications/pages/AdminEmailAccountsPage.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'
import useAutoRefresh from '../../../app/useAutoRefresh'

const emptyForm = {
  owner_user: '', email_address: '', provider: 'imap', is_active: true,
  imap_host: '', imap_port: 993, imap_use_ssl: true, imap_password: '',
  smtp_host: '', smtp_port: 465, smtp_use_ssl: true, smtp_use_tls: false, smtp_password: '',
}

// "3 hours ago" answers the question better than a timestamp does; the exact
// time is kept on hover for when it matters.
const when = (iso) => {
  if (!iso) return '—'
  const then = new Date(iso)
  const mins = Math.floor((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d ago`
  return then.toLocaleDateString()
}

const isRecent = (iso) => iso && (Date.now() - new Date(iso).getTime()) < 15 * 60 * 1000

const AdminEmailAccountsPage = () => {
  // Sync times and "last active" go stale the moment you stop looking, so
  // this page refetches on its own rather than waiting for a reload.
  const refresh = useAutoRefresh()
  const { t } = useTranslation('notifications')
  const [accounts, setAccounts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [syncingId, setSyncingId] = useState(null)
  const [activity, setActivity] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [accRes, usersRes, activityRes] = await Promise.all([
        api.get('/email-accounts/'),
        api.get('/users/'),
        api.get('/workspace/staff-activity/').catch(() => ({ data: [] })),
      ])
      setAccounts(accRes.data?.results || accRes.data || [])
      setUsers(usersRes.data?.results || usersRes.data || [])
      setActivity(activityRes.data || [])
    } catch (err) {
      console.error('Error loading email accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData, refresh])

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email_address || !form.imap_host || !form.imap_password) {
      setError(t('email_accounts.required_error') || 'Email address, IMAP host, and IMAP password are required')
      return
    }
    setCreating(true)
    try {
      const payload = { ...form, owner_user: form.owner_user || null }
      const res = await api.post('/email-accounts/', payload)
      setAccounts(prev => [...prev, res.data])
      setForm(emptyForm)
    } catch (err) {
      const detail = err.response?.data
      setError(typeof detail === 'object' ? JSON.stringify(detail) : (t('email_accounts.create_error') || 'Failed to create account'))
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (account) => {
    try {
      const res = await api.patch(`/email-accounts/${account.id}/`, { is_active: !account.is_active })
      setAccounts(prev => prev.map(a => a.id === account.id ? res.data : a))
    } catch (err) {
      console.error('Error toggling account:', err)
    }
  }

  const handleDelete = async (account) => {
    if (!window.confirm(t('email_accounts.delete_confirm', { email: account.email_address }) || `Remove mailbox ${account.email_address}? Its stored emails stay, but syncing stops.`)) return
    try {
      await api.delete(`/email-accounts/${account.id}/`)
      setAccounts(prev => prev.filter(a => a.id !== account.id))
    } catch (err) {
      console.error('Error deleting account:', err)
    }
  }

  const handleSyncNow = async (account) => {
    setSyncingId(account.id)
    try {
      const res = await api.post(`/email-accounts/${account.id}/sync_now/`)
      alert(res.data.success
        ? (t('email_accounts.sync_success', { count: res.data.saved || 0 }) || `Synced: ${res.data.saved || 0} new email(s)`)
        : (t('email_accounts.sync_failed_reason', { reason: res.data.error || 'unknown error' }) || `Failed: ${res.data.error || 'unknown error'}`))
      loadData()
    } catch (err) {
      alert(t('email_accounts.sync_failed') || 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="container-main py-8 md:py-12 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('email_accounts.title') || 'Staff Mailboxes'}</h1>
        <p className="text-white/40 text-sm mt-1">
          {t('email_accounts.subtitle') || 'Connect each staff member\'s own @feevert.co.tz mailbox, or leave "staff member" blank for a shared inbox everyone can see.'}
        </p>
      </div>

      <form onSubmit={handleCreate} className="glass-card p-6 mb-6 space-y-3">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-2">{t('email_accounts.connect_mailbox') || 'Connect a Mailbox'}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="email" value={form.email_address} onChange={(e) => handleChange('email_address', e.target.value)}
            placeholder={t('email_accounts.email_placeholder') || 'staff@feevert.co.tz'}
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
          <select value={form.owner_user} onChange={(e) => handleChange('owner_user', e.target.value)}
            className="px-4 py-2.5 glass text-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm">
            <option value="">{t('email_accounts.shared_option') || 'Shared inbox (all staff)'}</option>
            {users.map(u => (<option key={u.id} value={u.id}>{u.username} ({u.email})</option>))}
          </select>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="text" value={form.imap_host} onChange={(e) => handleChange('imap_host', e.target.value)}
            placeholder={t('email_accounts.host_placeholder') || 'IMAP host (mail.feevert.co.tz)'}
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
          <input type="number" value={form.imap_port} onChange={(e) => handleChange('imap_port', e.target.value)}
            placeholder={t('email_accounts.port_placeholder') || 'Port'}
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
          <input type="password" value={form.imap_password} onChange={(e) => handleChange('imap_password', e.target.value)}
            placeholder={t('email_accounts.password_placeholder') || 'Mailbox password'}
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
        </div>
        <p className="text-xs text-white/30">{t('email_accounts.smtp_note') || "SMTP defaults to the same host/password as IMAP unless you set them separately in the account's edit view later."}</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={creating} className="btn-primary text-sm disabled:opacity-50">
          {creating ? (t('email_accounts.connecting') || 'Connecting...') : (t('email_accounts.connect_button') || 'Connect Mailbox')}
        </button>
      </form>

      {loading ? (
        <div className="glass-card p-12 text-center"><div className="spinner spinner-lg mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <div key={account.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {account.email_address}
                    {!account.owner_username && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">{t('email_accounts.shared_badge') || 'shared'}</span>
                    )}
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    {account.owner_username
                      ? (t('email_accounts.owner_prefix', { username: account.owner_username }) || `Owner: ${account.owner_username}`)
                      : (t('email_accounts.visible_all') || 'Visible to all staff')} · {account.provider.toUpperCase()}
                    {account.last_synced_at && ` · ${t('email_accounts.last_synced', { date: new Date(account.last_synced_at).toLocaleString() }) || `Last synced ${new Date(account.last_synced_at).toLocaleString()}`}`}
                  </p>
                  {account.last_sync_error && (
                    <p className="text-xs text-red-400 mt-1">{t('email_accounts.last_error') || 'Last error:'} {account.last_sync_error.slice(0, 150)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSyncNow(account)} disabled={syncingId === account.id}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-white/70 hover:bg-white/10 transition-all disabled:opacity-50">
                    {syncingId === account.id ? (t('email_accounts.syncing') || 'Syncing...') : (t('email_accounts.sync_now') || 'Sync Now')}
                  </button>
                  <button onClick={() => handleToggleActive(account)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      account.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                    {account.is_active ? (t('email_accounts.active') || 'Active') : (t('email_accounts.paused') || 'Paused')}
                  </button>
                  <button onClick={() => handleDelete(account)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    {t('email_accounts.remove') || 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Who has been in, and what they last did. Three separate
              answers on purpose: signing in is not the same as working, and
              neither says what was actually done. */}
          {activity.length > 0 && (
            <div className="glass-card p-5 mb-4">
              <h2 className="font-bold text-white mb-1">
                {t('email_accounts.activity_title', 'Staff activity')}
              </h2>
              <p className="text-xs text-white/40 mb-3">
                {t('email_accounts.activity_hint',
                  'Signing in is not the same as working — the last action is what was actually done.')}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-white/35">
                      <th className="py-2 pr-3 font-bold">{t('email_accounts.person', 'Person')}</th>
                      <th className="py-2 pr-3 font-bold">{t('email_accounts.last_signin', 'Last sign-in')}</th>
                      <th className="py-2 pr-3 font-bold">{t('email_accounts.last_active', 'Last active')}</th>
                      <th className="py-2 font-bold">{t('email_accounts.last_action', 'Last action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map(row => (
                      <tr key={row.id} className="border-t border-white/[0.06]">
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold text-white/90">{row.full_name}</div>
                          <div className="text-[11px] text-white/35">{row.email}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-white/60 text-xs">{when(row.last_login)}</td>
                        <td className="py-2.5 pr-3 text-xs">
                          <span className={isRecent(row.last_seen) ? 'text-emerald-400 font-semibold' : 'text-white/60'}>
                            {when(row.last_seen)}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-white/60">
                          {row.last_action
                            ? <>{row.last_action}<span className="text-white/30"> · {when(row.last_action_at)}</span></>
                            : <span className="text-white/25">{t('email_accounts.nothing_yet', 'nothing yet')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="glass-card p-10 text-center text-white/30">{t('email_accounts.no_mailboxes') || 'No mailboxes connected yet.'}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminEmailAccountsPage
