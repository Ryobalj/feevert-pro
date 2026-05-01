// src/features/shop/hooks/useCart.js

import { useCart } from '../context/CartContext'

const useCartHook = () => {
  const cart = useCart()
  return cart
}

export default useCartHook