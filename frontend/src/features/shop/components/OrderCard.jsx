// src/features/shop/components/OrderCard.jsx

import React from 'react'

const statusConfig = {
  pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: 'Pending' },
  paid: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '💳', label: 'Paid' },
  processing: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: 'Processing' },
  shipped: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '🚚', label: 'Shipped' },
  delivered: { badge: 'bg-green-500/15 text-green-400 border-green-500/20', icon: '✅', label: 'Delivered' },
  cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: 'Cancelled' },
}

const OrderCard = ({ order }) => {
  const status = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="glass-card p-5 hover:border-emerald-400/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Order #{order.order_number}</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
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
            <span className="text-white/60 truncate flex-1 mr-4">{item.product_name} × {item.quantity}</span>
            <span className="text-white/40">TZS {item.subtotal?.toLocaleString()}</span>
          </div>
        ))}
        {order.items?.length > 3 && (
          <p className="text-xs text-white/30">+{order.items.length - 3} more items</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          <span className="text-xs text-white/40">Total</span>
          <p className="text-sm font-bold gradient-text">TZS {order.total?.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-white/40">Payment</span>
          <p className={`text-xs font-semibold ${
            order.payment_status === 'completed' ? 'text-emerald-400' :
            order.payment_status === 'failed' ? 'text-red-400' : 'text-amber-400'
          }`}>
            {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderCard