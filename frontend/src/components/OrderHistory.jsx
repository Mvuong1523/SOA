import { useState, useEffect } from 'react'
import axios from 'axios'

export default function OrderHistory({ apiBase, token, isAdmin, customerId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${apiBase}/orders`)
      let ordersList = response.data
      
      // Customer chỉ xem orders của mình
      if (!isAdmin && customerId) {
        ordersList = ordersList.filter(order => order.customer_id === customerId)
      }
      
      // Fetch customer info for each order
      const ordersWithCustomerInfo = await Promise.all(
        ordersList.map(async (order) => {
          try {
            const customerRes = await axios.get(`${apiBase}/customers/${order.customer_id}`)
            return { ...order, customerInfo: customerRes.data }
          } catch (error) {
            console.error(`Failed to fetch customer ${order.customer_id}:`, error)
            return { ...order, customerInfo: null }
          }
        })
      )
      
      setOrders(ordersWithCustomerInfo)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${apiBase}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500">
          {isAdmin ? 'No orders in the system' : 'Your order history will appear here'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isAdmin ? 'All Orders' : 'My Orders'}
        </h2>
        {isAdmin && (
          <span className="text-sm text-blue-600 font-semibold">
            Total: {orders.length} orders
          </span>
        )}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Order #{order.id}
                </h3>
                {order.customerInfo ? (
                  <>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Customer:</span> {order.customerInfo.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {order.customerInfo.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {order.customerInfo.phone || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Address:</span> {order.customerInfo.address || 'N/A'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Customer: {order.customer_id}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Payment:</span> {order.payment_method}
                </p>
                {order.note && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {order.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                {order.total_amount && (
                  <p className="text-xl font-bold text-blue-600 mt-2">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="border-t mt-4 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status:
                </label>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipping">Shipping</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
