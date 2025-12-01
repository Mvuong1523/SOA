import { useState, useEffect } from 'react'
import axios from 'axios'

const CART_API = import.meta.env.VITE_CART_API || 'http://localhost:8004'
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API || 'http://localhost:8002'

function App() {
  const [customerId, setCustomerId] = useState('12345')
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customerId) {
      fetchCart()
    }
  }, [customerId])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${CART_API}/customers/${customerId}/cart`)
      setCart(response.data)
      
      // Fetch product details
      const productMap = {}
      for (const item of response.data) {
        try {
          const prod = await axios.get(`${PRODUCT_API}/products/${item.product_id}`)
          productMap[item.product_id] = prod.data
        } catch (err) {
          console.error(`Failed to fetch product ${item.product_id}`)
        }
      }
      setProducts(productMap)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    try {
      await axios.put(`${CART_API}/customers/${customerId}/cart/${productId}`, {
        product_id: productId,
        quantity: newQuantity
      })
      fetchCart()
    } catch (error) {
      alert('Failed to update quantity')
    }
  }

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${CART_API}/customers/${customerId}/cart/${productId}`)
      fetchCart()
    } catch (error) {
      alert('Failed to remove item')
    }
  }

  const clearCart = async () => {
    if (!confirm('Clear entire cart?')) return
    try {
      await axios.delete(`${CART_API}/customers/${customerId}/cart`)
      fetchCart()
    } catch (error) {
      alert('Failed to clear cart')
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const product = products[item.product_id]
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Shopping Cart</h1>
          
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Customer ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={fetchCart}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Load Cart
            </button>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-700">Cart is empty</h2>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {cart.map((item) => {
                const product = products[item.product_id]
                if (!product) return null

                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">${product.price} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-24 text-right font-semibold">
                      ${(product.price * item.quantity).toFixed(2)}
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
