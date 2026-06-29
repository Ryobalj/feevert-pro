// src/features/shop/components/OrderCard.jsx

import React from 'react'
import { useTranslation } from 'react-i18next' // ✅ Ongeza hii

const OrderCard = ({ order }) => {
  const { t } = useTranslation('shop') // ✅ Ongeza hii

  const statusConfig = {
    pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: t('order.status.pending') || 'Pending' },
    paid: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '💳', label: t('order.status.paid') || 'Paid' },
    processing: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: t('order.status.processing') || 'Processing' },
    shipped: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '🚚', label: t('order.status.shipped') || 'Shipped' },
    delivered: { badge: 'bg-green-500/15 text-green-400 border-green-500/20', icon: '✅', label: t('order.status.delivered') || 'Delivered' },
    cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: t('order.status.cancelled') || 'Cancelled' },
  }

  const status = statusConfig[order.status] || statusConfig.pending

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // Helper to get payment status label
  const getPaymentStatusLabel = (paymentStatus) => {
    if (!paymentStatus) return t('order.payment.pending') || 'Pending'
    const labels = {
      'pending': t('order.payment.pending') || 'Pending',
      'completed': t('order.payment.completed') || 'Completed',
      'failed': t('order.payment.failed') || 'Failed',
      'refunded': t('order.payment.refunded') || 'Refunded'
    }
    return labels[paymentStatus] || paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
  }

  // Helper to get payment status color
  const getPaymentStatusColor = (paymentStatus) => {
    if (paymentStatus === 'completed') return 'text-emerald-400'
    if (paymentStatus === 'failed') return 'text-red-400'
    if (paymentStatus === 'refunded') return 'text-purple-400'
    return 'text-amber-400'
  }

  return (
    <div className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            {t('order.title') || 'Order'} #{order.order_number}
          </h3>
          <p className="text-xs text-white/40 mt-0.5">
            {formatDate(order.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.badge}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items?.slice(0, 3).map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-white/60 truncate flex-1 mr-4">
              {item.product_name} × {item.quantity}
            </span>
            <span className="text-white/40">
              {t('order.currency') || 'TZS'} {item.subtotal?.toLocaleString()}
            </span>
          </div>
        ))}
        {order.items?.length > 3 && (
          <p className="text-xs text-white/30">
            +{order.items.length - 3} {t('order.more_items') || 'more items'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          <span className="text-xs text-white/40">{t('order.total') || 'Total'}</span>
          <p className="text-sm font-bold gradient-text">
            {t('order.currency') || 'TZS'} {order.total?.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-white/40">{t('order.payment.label') || 'Payment'}</span>
          <p className={`text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
            {getPaymentStatusLabel(order.payment_status)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderCard