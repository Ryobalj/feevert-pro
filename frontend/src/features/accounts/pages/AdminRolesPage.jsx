// src/features/accounts/pages/AdminRolesPage.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../../../app/api'

const emptyForm = { name: '', description: '', priority_level: 0 }

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles/')
      setRoles(res.data?.results || res.data || [])
    } catch (err) {
      console.error('Error loading roles:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Role name is required')
      return
    }
    setCreating(true)
    try {
      const res = await api.post('/roles/', {
        name: form.name.trim(),
        description: form.description.trim(),
        priority_level: Number(form.priority_level) || 0,
        permissions: {},
      })
      setRoles(prev => [...prev, res.data])
      setForm(emptyForm)
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create role')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (role) => {
    if (role.is_system_role) return
    if (!window.confirm(`Delete role "${role.name}"? This can't be undone.`)) return
    try {
      await api.delete(`/roles/${role.id}/`)
      setRoles(prev => prev.filter(r => r.id !== role.id))
    } catch (err) {
      console.error('Error deleting role:', err)
      alert(err.response?.data?.detail || 'Failed to delete role')
    }
  }

  const handleDescriptionSave = async (role, description) => {
    if (description === role.description) return
    try {
      const res = await api.patch(`/roles/${role.id}/`, { description })
      setRoles(prev => prev.map(r => r.id === role.id ? res.data : r))
    } catch (err) {
      console.error('Error updating description:', err)
    }
  }

  return (
    <div className="container-main py-8 md:py-12 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Manage Roles</h1>
        <p className="text-white/40 text-sm mt-1">Roles control what each account type can do across the system.</p>
      </div>

      <form onSubmit={handleCreate} className="glass-card p-6 mb-6 space-y-3">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-2">New Role</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Role name (e.g. support_agent)"
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm"
          />
          <input
            type="number"
            value={form.priority_level}
            onChange={(e) => setForm({ ...form, priority_level: e.target.value })}
            placeholder="Priority level"
            className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="w-full px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={creating} className="btn-primary text-sm disabled:opacity-50">
          {creating ? 'Creating...' : 'Create Role'}
        </button>
      </form>

      {loading ? (
        <div className="glass-card p-12 text-center"><div className="spinner spinner-lg mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <motion.div key={role.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{role.name}</h3>
                  {role.is_system_role && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/50">system</span>
                  )}
                  <span className="text-xs text-white/30">{role.users_count} user{role.users_count === 1 ? '' : 's'}</span>
                </div>
                {!role.is_system_role && (
                  <button onClick={() => handleDelete(role)} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                )}
              </div>
              <textarea
                defaultValue={role.description}
                onBlur={(e) => handleDescriptionSave(role, e.target.value)}
                rows={1}
                className="w-full px-3 py-2 bg-white/[0.03] text-white/70 placeholder:text-white/25 rounded-lg border border-white/5 outline-none focus:ring-2 focus:ring-emerald-400/30 text-sm resize-none"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminRolesPage
