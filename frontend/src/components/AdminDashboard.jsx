import { useState, useEffect } from 'react'
import axios from 'axios'

function AdminDashboard({ apiBase, token }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch products
      const productsRes = await axios.get(`${apiBase}/products`)
      
      // Fetch orders
      const ordersRes = await axios.get(`${apiBase}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const orders = ordersRes.data
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const pendingOrders = orders.filter(o => o.status === 'pending').length

      setStats({
        totalProducts: productsRes.data.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders
      })

      // Fetch customer info for recent orders
      const recentOrdersList = orders.slice(0, 5)
      const ordersWithCustomerInfo = await Promise.all(
        recentOrdersList.map(async (order) => {
          try {
            const customerRes = await axios.get(`${apiBase}/customers/${order.customer_id}`)
            return { ...order, customerInfo: customerRes.data }
          } catch (error) {
            console.error(`Failed to fetch customer ${order.customer_id}:`, error)
            return { ...order, customerInfo: null }
          }
        })
      )

      setRecentOrders(ordersWithCustomerInfo)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h1>
        <p className="text-blue-100">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">In inventory</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">All time</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Total earnings</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Need attention</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📭</span>
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">#{order.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.customerInfo ? order.customerInfo.name : order.customer_id}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                      ${order.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-left">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">➕</span>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Add Product</h3>
          <p className="text-sm text-gray-500">Add new products to inventory</p>
        </button>

        <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-left">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">View Reports</h3>
          <p className="text-sm text-gray-500">Check sales and analytics</p>
        </button>

        <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-left">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Settings</h3>
          <p className="text-sm text-gray-500">Manage store settings</p>
        </button>
      </div>
    </div>
  )
}

export default AdminDashboard
