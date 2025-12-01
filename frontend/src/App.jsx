import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import OrderHistory from './components/OrderHistory'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('products')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState(localStorage.getItem('customerId'))

  useEffect(() => {
    if (token) {
      validateToken()
      if (customerId) {
        fetchCart()
      }
    }
  }, [token, customerId])

  const validateToken = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (error) {
      console.error('Token validation failed:', error)
      handleLogout()
    }
  }

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_BASE}/customers/${customerId}/cart`)
      setCart(response.data)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    }
  }

  const handleLogin = (newToken, newCustomerId) => {
    setToken(newToken)
    setCustomerId(newCustomerId)
    localStorage.setItem('token', newToken)
    localStorage.setItem('customerId', newCustomerId)
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setCustomerId(null)
    setCart([])
    localStorage.removeItem('token')
    localStorage.removeItem('customerId')
  }

  if (!token) {
    return <Login onLogin={handleLogin} apiBase={API_BASE} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Online Ordering System</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.role === 'admin' ? '👑 Admin' : '👤 Customer'} ({customerId})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              {user?.role === 'admin' ? 'Product Management' : 'Products'}
            </button>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setActiveTab('cart')}
                className={`${
                  activeTab === 'cart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition relative`}
              >
                Cart
                {cart.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {cart.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              {user?.role === 'admin' ? 'Order Management' : 'My Orders'}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <ProductList
            apiBase={API_BASE}
            token={token}
            customerId={customerId}
            onCartUpdate={fetchCart}
            isAdmin={user?.role === 'admin'}
            userRole={user?.role}
          />
        )}
        {activeTab === 'cart' && user?.role !== 'admin' && (
          <Cart
            apiBase={API_BASE}
            token={token}
            customerId={customerId}
            cart={cart}
            onCartUpdate={fetchCart}
          />
        )}
        {activeTab === 'orders' && (
          <OrderHistory
            apiBase={API_BASE}
            token={token}
            isAdmin={user?.role === 'admin'}
            customerId={customerId}
          />
        )}
      </main>
    </div>
  )
}

export default App
