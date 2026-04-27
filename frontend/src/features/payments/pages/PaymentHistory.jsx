import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('transactions')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionsRes, invoicesRes] = await Promise.all([
          api.get('/payments/transactions/'),
          api.get('/payments/invoices/')
        ])
        setTransactions(transactionsRes.data?.transactions || transactionsRes.data?.results || transactionsRes.data || [])
        setInvoices(invoicesRes.data?.invoices || invoicesRes.data?.results || invoicesRes.data || [])
      } catch (error) { console.error('Error loading payment data:', error) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const statusConfig = {
    completed: { icon: '✅', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    pending: { icon: '⏳', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    processing: { icon: '🔄', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    failed: { icon: '❌', badge: 'bg-red-500/15 text-red-400 border-red-500/20' },
    refunded: { icon: '↩️', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
    cancelled: { icon: '🚫', badge: 'bg-white/10 text-white/40 border-white/10' },
  }

  const invoiceStatusConfig = {
    paid: { icon: '✅', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    sent: { icon: '📤', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    draft: { icon: '📝', badge: 'bg-white/10 text-white/50 border-white/10' },
    overdue: { icon: '⚠️', badge: 'bg-red-500/15 text-red-400 border-red-500/20' },
    cancelled: { icon: '🚫', badge: 'bg-white/10 text-white/40 border-white/10' },
  }

  const tabs = [
    { value: 'transactions', label: 'Transactions', icon: '💳', count: transactions.length },
    { value: 'invoices', label: 'Invoices', icon: '🧾', count: invoices.length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-4xl">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
            Payment <span className="gradient-text">History</span>
          </h1>
          <p className="text-white/40 text-sm">View your transactions and invoices</p>
        </motion.div>

        {/* ============ TABS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8">
          {tabs.map(tab => (
            <motion.button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'glass text-white/60 hover:text-white hover:border-white/30'
              }`}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <span>{tab.icon}</span>
              {tab.label}
              <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${
                activeTab === tab.value ? 'bg-white/20' : 'bg-white/10'
              }`}>{tab.count}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ============ TRANSACTIONS ============ */}
        <AnimatePresence mode="wait">
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((tx, index) => {
                  const status = statusConfig[tx.status] || statusConfig.pending
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }} whileHover={{ x: 2 }}>
                      <div className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Transaction ID + Status */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-mono text-sm text-white/70">{tx.transaction_id}</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.badge}`}>
                                <span>{status.icon}</span>
                                {tx.status}
                              </span>
                            </div>
                            
                            {/* Info Grid */}
                            <div className="grid sm:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-white/70 font-medium">
                                  {tx.currency} {parseFloat(tx.amount).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 text-xs">Gateway:</span>
                                <span className="text-white/50 text-xs capitalize">{tx.gateway}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white/50 text-xs">
                                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            {tx.description && (
                              <p className="text-sm text-white/40 mt-2 line-clamp-1">{tx.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-12 text-center">
                  <div className="text-5xl mb-4 opacity-40">💳</div>
                  <h3 className="text-xl font-bold text-white mb-2">No transactions found</h3>
                  <p className="text-white/40">Your payment transactions will appear here.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ============ INVOICES ============ */}
          {activeTab === 'invoices' && (
            <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-3">
              {invoices.length > 0 ? (
                invoices.map((invoice, index) => {
                  const status = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft
                  return (
                    <motion.div key={invoice.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }} whileHover={{ x: 2 }}>
                      <div className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Invoice Number + Status */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm font-bold text-white">{invoice.invoice_number}</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.badge}`}>
                                <span>{status.icon}</span>
                                {invoice.status}
                              </span>
                            </div>
                            
                            {/* Title */}
                            <p className="text-white/70 text-sm font-medium mb-3">{invoice.title}</p>

                            {/* Info Grid */}
                            <div className="grid sm:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-white/70 font-medium">
                                  {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 text-xs">Issued:</span>
                                <span className="text-white/50 text-xs">{invoice.issue_date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 text-xs">Due:</span>
                                <span className={`text-xs font-medium ${invoice.status === 'overdue' ? 'text-red-400' : 'text-white/50'}`}>
                                  {invoice.due_date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-12 text-center">
                  <div className="text-5xl mb-4 opacity-40">🧾</div>
                  <h3 className="text-xl font-bold text-white mb-2">No invoices found</h3>
                  <p className="text-white/40">Your invoices will appear here.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default PaymentHistory