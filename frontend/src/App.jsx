import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import Navbar from './components/Navbar'
import AdminDashboard from './components/AdminDashboard'
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
      setUser({ ...response.data, username: localStorage.getItem('username') || 'User' })
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

  const handleLogin = (newToken, newCustomerId, username, role) => {
    setToken(newToken)
    setCustomerId(newCustomerId)
    localStorage.setItem('token', newToken)
    localStorage.setItem('customerId', newCustomerId)
    localStorage.setItem('username', username)
    localStorage.setItem('role', role)
    setUser({ customer_id: newCustomerId, role, username })
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setCustomerId(null)
    setCart([])
    setActiveTab('products')
    localStorage.removeItem('token')
    localStorage.removeItem('customerId')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
  }

  if (!token) {
    return <Login onLogin={handleLogin} apiBase={API_BASE} />
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.length}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Dashboard */}
        {isAdmin && activeTab === 'dashboard' && (
          <AdminDashboard apiBase={API_BASE} token={token} />
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <>
            {isAdmin && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
                <p className="text-gray-600">Manage your store inventory</p>
              </div>
            )}
            <ProductList
              apiBase={API_BASE}
              token={token}
              customerId={customerId}
              onCartUpdate={fetchCart}
              isAdmin={isAdmin}
              userRole={user?.role}
            />
          </>
        )}

        {/* Cart */}
        {activeTab === 'cart' && !isAdmin && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Shopping Cart</h2>
              <p className="text-gray-600">Review your items before checkout</p>
            </div>
            <Cart
              apiBase={API_BASE}
              token={token}
              customerId={customerId}
              cart={cart}
              onCartUpdate={fetchCart}
            />
          </>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isAdmin ? 'Order Management' : 'My Orders'}
              </h2>
              <p className="text-gray-600">
                {isAdmin ? 'Manage all customer orders' : 'Track your order history'}
              </p>
            </div>
            <OrderHistory
              apiBase={API_BASE}
              token={token}
              isAdmin={isAdmin}
              customerId={customerId}
            />
          </>
        )}

        {/* Customers (Admin only) */}
        {isAdmin && activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <span className="text-6xl mb-4 block">👥</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Customer Management</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Username</label>
                <p className="text-lg text-gray-800">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <p className="text-lg text-gray-800 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Customer ID</label>
                <p className="text-lg text-gray-800">{customerId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <span className="text-6xl mb-4 block">⚙️</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Settings</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}
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
