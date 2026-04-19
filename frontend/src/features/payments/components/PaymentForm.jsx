import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PaymentForm = ({ amount, currency = 'TZS', itemType, itemId, description, buttonText = 'Pay Now' }) => {
  const navigate = useNavigate()

  const handlePayment = () => {
    navigate('/payment', {
      state: {
        amount,
        currency,
        itemType,
        itemId,
        description
      }
    })
  }

  return (
    <button onClick={handlePayment} className="btn-primary">
      {buttonText}
    </button>
  )
}
export default PaymentForm
