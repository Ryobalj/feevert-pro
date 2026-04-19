import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
        
        setTransactions(transactionsRes.data?.results || transactionsRes.data || [])
        setInvoices(invoicesRes.data?.results || invoicesRes.data || [])
      } catch (error) {
        console.error('Error loading payment data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'refunded': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getInvoiceStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'sent': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'draft': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Payment <span className="gradient-text">History</span>
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            View your transactions and invoices
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700"
        >
          {['transactions', 'invoices'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-all ${
                activeTab === tab
                  ? `border-b-2 ${darkMode ? 'border-green-400 text-green-400' : 'border-green-600 text-green-600'}`
                  : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {activeTab === 'transactions' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <motion.div key={tx.id} variants={cardVariants}>
                  <div className={`modern-card p-5 ${
                    darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-mono text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {tx.transaction_id}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        
                        <div className="grid sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Amount: </span>
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {tx.currency} {parseFloat(tx.amount).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Gateway: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {tx.gateway}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Date: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {tx.description && (
                          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`modern-card p-12 text-center ${
                  darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                }`}
              >
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No transactions found.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <motion.div key={invoice.id} variants={cardVariants}>
                  <div className={`modern-card p-5 ${
                    darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-mono text-sm font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {invoice.invoice_number}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                        
                        <div className="grid sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Total: </span>
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Issue Date: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {invoice.issue_date}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Due Date: </span>
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {invoice.due_date}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {invoice.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`modern-card p-12 text-center ${
                  darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                }`}
              >
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No invoices found.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default PaymentHistory
