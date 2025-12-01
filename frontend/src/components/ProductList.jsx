import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ProductList({ apiBase, token, customerId, onCartUpdate, isAdmin, userRole }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    inventory: '',
    description: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${apiBase}/products`)
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId) => {
    try {
      await axios.post(`${apiBase}/customers/${customerId}/cart`, {
        product_id: productId,
        quantity: 1
      })
      setMessage('✅ Added to cart!')
      setTimeout(() => setMessage(''), 3000)
      onCartUpdate()
    } catch (error) {
      setMessage('❌ Failed to add to cart')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if token exists
    if (!token) {
      setMessage('❌ Please login as admin first')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    try {
      if (editingProduct) {
        await axios.put(
          `${apiBase}/products/${editingProduct.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMessage('✅ Product updated!')
      } else {
        await axios.post(
          `${apiBase}/products`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMessage('✅ Product created!')
      }
      fetchProducts()
      resetForm()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Operation failed'
      setMessage(`❌ ${errorMsg}`)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      inventory: product.inventory,
      description: product.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product?')) return
    
    if (!token) {
      setMessage('❌ Please login as admin first')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    try {
      await axios.delete(`${apiBase}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('✅ Product deleted!')
      fetchProducts()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Delete failed'
      setMessage(`❌ ${errorMsg}`)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', inventory: '', description: '' })
    setEditingProduct(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Products {isAdmin && <span className="text-sm text-blue-600">(Admin Mode)</span>}
        </h2>
        <div className="flex gap-4 items-center">
          {message && (
            <div className={`px-4 py-2 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
          )}
        </div>
      </div>

      {isAdmin && showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Inventory"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              )}
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.inventory > 10
                    ? 'bg-green-100 text-green-800'
                    : product.inventory > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  Stock: {product.inventory}
                </span>
              </div>
              
              {isAdmin ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={product.inventory === 0}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
