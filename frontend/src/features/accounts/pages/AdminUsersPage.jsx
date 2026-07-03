// src/features/accounts/pages/AdminUsersPage.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../hooks/useAuth'

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users/'),
        api.get('/roles/'),
      ])
      setUsers(usersRes.data?.results || usersRes.data || [])
      setRoles(rolesRes.data?.results || rolesRes.data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRoleChange = async (targetUser, roleId) => {
    setSavingId(targetUser.id)
    try {
      const res = await api.patch(`/users/${targetUser.id}/`, { role: roleId || null })
      setUsers(prev => prev.map(u => u.id === targetUser.id ? res.data : u))
    } catch (error) {
      console.error('Error updating role:', error)
      alert(error.response?.data?.role?.[0] || 'Failed to update role')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleActive = async (targetUser) => {
    setSavingId(targetUser.id)
    try {
      const res = await api.patch(`/users/${targetUser.id}/`, { is_active: !targetUser.is_active })
      setUsers(prev => prev.map(u => u.id === targetUser.id ? res.data : u))
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setSavingId(null)
    }
  }

  const filtered = users.filter(u => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  return (
    <div className="container-main py-8 md:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Manage Users</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} registered users</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm w-64"
        />
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="spinner spinner-lg mx-auto" />
        </div>
      ) : (
        <div className="glass-card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/60">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role || ''}
                      disabled={savingId === u.id || u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="px-3 py-1.5 glass text-white rounded-lg border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-xs disabled:opacity-50"
                    >
                      <option value="">No role</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={savingId === u.id || u.id === currentUser?.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${
                        u.is_active ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-red-500/15 text-red-400 hover:bg-emerald-500/15 hover:text-emerald-400'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '-'}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-white/30">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
