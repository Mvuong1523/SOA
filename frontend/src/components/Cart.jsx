import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Cart({ apiBase, token, customerId, cart, onCartUpdate }) {
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')

  useEffect(() => {
    if (cart.length > 0) {
      fetchProductDetails()
    }
  }, [cart])

  const fetchProductDetails = async () => {
    const productMap = {}
    for (const item of cart) {
      try {
        const response = await axios.get(`${apiBase}/products/${item.product_id}`)
        productMap[item.product_id] = response.data
      } catch (error) {
        console.error(`Failed to fetch product ${item.product_id}:`, error)
      }
    }
    setProducts(productMap)
  }

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    try {
      await axios.put(`${apiBase}/customers/${customerId}/cart/${productId}`, {
        product_id: productId,
        quantity: newQuantity
      })
      onCartUpdate()
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${apiBase}/customers/${customerId}/cart/${productId}`)
      onCartUpdate()
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const placeOrder = async () => {
    if (cart.length === 0) return
    
    setLoading(true)
    setMessage('')
    
    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))

      await axios.post(
        `${apiBase}/ordering`,
        {
          customer_id: customerId,
          items,
          note,
          payment_method: paymentMethod
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setMessage('✅ Order placed successfully!')
      setNote('')
      onCartUpdate()
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to place order'}`)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const product = products[item.product_id]
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500">Add some products to get started!</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h2>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('✅')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {cart.map((item) => {
          const product = products[item.product_id]
          if (!product) return null

          return (
            <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-b-0">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-600">${product.price.toFixed(2)} each</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full transition"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full transition"
                >
                  +
                </button>
              </div>

              <div className="w-24 text-right font-semibold text-gray-800">
                ${(product.price * item.quantity).toFixed(2)}
              </div>

              <button
                onClick={() => removeItem(item.product_id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                🗑️
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Add delivery instructions or special requests..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Cash on Delivery
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Online Payment
            </label>
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total:</span>
            <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
