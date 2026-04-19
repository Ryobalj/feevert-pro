import React from 'react'
import { Link } from 'react-router-dom'

const InvoiceCard = ({ invoice }) => {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{invoice.title}</h3>
          <p className="text-gray-500 text-sm">Invoice #{invoice.invoice_number}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-feevert-green">{invoice.total_amount} {invoice.currency}</p>
          {invoice.status === 'draft' && (
            <Link to="/payment" state={{ amount: invoice.total_amount, currency: invoice.currency, description: invoice.title }} className="text-sm text-feevert-green hover:underline">
              Pay Now →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
export default InvoiceCard
