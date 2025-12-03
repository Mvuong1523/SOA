import { useState } from 'react'

function Navbar({ user, onLogout, activeTab, setActiveTab, cartCount }) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isAdmin = user?.role === 'admin'

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => setActiveTab('products')}
          >
            <div className="text-3xl">🛒</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopHub
              </h1>
              <p className="text-xs text-gray-500">
                {isAdmin ? 'Admin Panel' : 'Your Online Store'}
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isAdmin ? (
              // Admin Menu
              <>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>📦</span>
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>📋</span>
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'customers'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>👥</span>
                  Customers
                </button>
              </>
            ) : (
              // Customer Menu
              <>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>🛍️</span>
                  Shop
                </button>
                <button
                  onClick={() => setActiveTab('cart')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition relative ${
                    activeTab === 'cart'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>🛒</span>
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>📦</span>
                  My Orders
                </button>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <span className="text-gray-400">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    setActiveTab('profile')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>👤</span>
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    setActiveTab('settings')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>⚙️</span>
                  Settings
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onLogout()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  activeTab === 'products' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">📦</span>
                <span className="text-xs">Products</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  activeTab === 'orders' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">📋</span>
                <span className="text-xs">Orders</span>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  activeTab === 'customers' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">👥</span>
                <span className="text-xs">Customers</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  activeTab === 'products' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">🛍️</span>
                <span className="text-xs">Shop</span>
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex flex-col items-center gap-1 px-3 py-2 relative ${
                  activeTab === 'cart' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">🛒</span>
                <span className="text-xs">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  activeTab === 'orders' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <span className="text-xl">📦</span>
                <span className="text-xs">Orders</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
