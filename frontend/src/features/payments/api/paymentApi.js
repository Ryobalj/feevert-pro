import api from '../../../app/api'

export const initiatePayment = (data) => api.post('/payments/initiate/', data)
export const verifyPayment = (transactionId) => api.get(`/payments/verify/${transactionId}/`)
export const getTransactions = () => api.get('/payments/transactions/')
export const getTransaction = (transactionId) => api.get(`/payments/transactions/${transactionId}/`)
export const getInvoices = () => api.get('/payments/invoices/')
export const getInvoice = (invoiceNumber) => api.get(`/payments/invoices/${invoiceNumber}/`)
