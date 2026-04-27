import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const InvoiceCard = ({ invoice }) => {
  // Detect if it's a proforma
  const isProforma = invoice.type === 'proforma' || invoice.invoice_number?.startsWith('PRO')
  const invoiceType = isProforma ? 'proforma' : 'invoice'
  
  const statusConfig = {
    // Invoice statuses
    paid: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '✅', label: 'Paid' },
    overdue: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '⚠️', label: 'Overdue' },
    cancelled: { badge: 'bg-white/10 text-white/40 border-white/10', icon: '❌', label: 'Cancelled' },
    partial: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '📋', label: 'Partial' },
    
    // Proforma statuses
    draft: { badge: 'bg-white/10 text-white/50 border-white/10', icon: '📝', label: 'Draft' },
    sent: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '📤', label: 'Sent' },
    expired: { badge: 'bg-red-500/10 text-red-400/60 border-red-500/10', icon: '⏰', label: 'Expired' },
    accepted: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '👍', label: 'Accepted' },
    converted: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: 'Converted' },
  }

  const status = statusConfig[invoice.status] || statusConfig.draft

  // Determine button based on type + status
  const getActionButton = () => {
    if (isProforma) {
      if (invoice.status === 'draft' || invoice.status === 'sent') {
        return { label: 'Confirm & Pay', link: `/payment?proforma=${invoice.id}`, primary: true }
      }
      if (invoice.status === 'converted') {
        return { label: 'View Invoice', link: `/invoices/${invoice.converted_invoice_id}`, primary: false }
      }
      return { label: 'View Details', link: `/proformas/${invoice.id}`, primary: false }
    }
    
    // Commercial invoice
    if (invoice.status === 'sent' || invoice.status === 'partial') {
      return { label: 'Pay Now', link: `/payment?invoice=${invoice.id}`, primary: true }
    }
    if (invoice.status === 'paid') {
      return { label: 'Download PDF', link: `/invoices/${invoice.id}/download`, primary: false }
    }
    return { label: 'View Details', link: `/invoices/${invoice.id}`, primary: false }
  }

  const action = getActionButton()

  return (
    <div className="glass-card group hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
      {/* Top accent - different colors for proforma vs invoice */}
      <div className={`h-1 bg-gradient-to-r transition-all duration-500 ${
        isProforma 
          ? 'from-blue-400/30 via-blue-400/50 to-blue-400/30' 
          : 'from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20'
      }`} />
      
      <div className="p-5">
        {/* Type Badge + Status */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-2">
            {/* Proforma/Invoice Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isProforma 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {isProforma ? '📄 Proforma' : '🧾 Invoice'}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.badge} flex-shrink-0`}>
            <span>{status.icon}</span>
            <span className="hidden sm:inline">{status.label}</span>
          </span>
        </div>

        {/* Title + Number */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-300">
            {invoice.title || 'Invoice'}
          </h3>
          <p className="text-sm text-white/40 mt-0.5">
            {invoice.invoice_number}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {invoice.due_date && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">
                  {isProforma ? 'Valid Until' : 'Due Date'}
                </p>
                <p className="text-white/70 font-medium text-xs">
                  {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Issued</p>
              <p className="text-white/70 font-medium text-xs">
                {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-4" />

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
              {isProforma ? 'Estimated Total' : 'Total Amount'}
            </p>
            <p className="text-2xl font-extrabold text-white">
              {invoice.total_amount?.toLocaleString()} 
              <span className="text-lg text-white/50 ml-1">{invoice.currency || 'TZS'}</span>
            </p>
            {/* Show deposit for proforma */}
            {isProforma && invoice.deposit_amount > 0 && (
              <p className="text-xs text-amber-400/70 mt-1">
                Deposit: {invoice.deposit_amount?.toLocaleString()} {invoice.currency || 'TZS'}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="text-right">
            {action.primary ? (
              <Link 
                to={action.link}
                state={{ 
                  amount: invoice.deposit_amount || invoice.total_amount, 
                  currency: invoice.currency, 
                  description: invoice.title, 
                  invoiceId: invoice.id,
                  isProforma,
                  isDeposit: isProforma && invoice.deposit_amount > 0
                }}
                className="group relative inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative z-10 flex items-center gap-1.5">
                  {action.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            ) : (
              <Link 
                to={action.link}
                className="text-sm font-semibold text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all"
              >
                {action.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceCard