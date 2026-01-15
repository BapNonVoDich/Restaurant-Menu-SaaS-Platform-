'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryIds: categoryId ? [categoryId] : [],
    imageUrl: '',
    isAvailable: true,
    sortOrder: 0,
  })

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Get store and menu
      const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (storeResponse.ok) {
        const storeData = await storeResponse.json()
        setStore(storeData)

        // Get menu (which includes categories and products)
        const menuResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store/menu`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (menuResponse.ok) {
          const menuData = await menuResponse.json()
          setCategories(menuData.categories || [])
          
          // Flatten products from all categories
          const allProducts: any[] = []
          menuData.categories?.forEach((cat: any) => {
            cat.products?.forEach((prod: any) => {
              allProducts.push({ ...prod, categoryName: cat.name })
            })
          })
          setProducts(allProducts)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : null,
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
          sortOrder: formData.sortOrder,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          name: '',
          description: '',
          price: '',
          categoryIds: categoryId ? [categoryId] : [],
          imageUrl: '',
          isAvailable: true,
          sortOrder: 0,
        })
        fetchData()
      } else {
        const error = await response.json().catch(() => ({}))
        console.error('Failed to create product:', error.error || 'Failed to create product')
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error creating product:', error)
      // Could add toast notification here
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-text">Products</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border rounded-md hover:bg-background-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-text-muted">Manage your menu products</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer shadow-soft hover:shadow-soft-md"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="font-heading text-lg font-semibold text-text mb-4">Create New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4" method="post" action="#">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Price (VND) *
                  </label>
                  <input
                    type="number"
                    required
                    step="1000"
                    className="input-field"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Description
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục (có thể chọn nhiều)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categoryIds: [...formData.categoryIds, cat.id] })
                            } else {
                              setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== cat.id) })
                            }
                          }}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-gray-500">Chưa có danh mục nào. Tạo danh mục trước.</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                  Available for ordering
                </label>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
              >
                Create Product
              </button>
            </form>
          </div>
        )}

        {products.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-background-muted transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-text-muted">{product.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-muted">{product.categoryName || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">
                        {product.price?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-background-muted text-text-muted'}`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-text-muted mb-4">No products yet. Create your first product to build your menu.</p>
            {categories.length === 0 && (
              <p className="text-sm text-text-muted mb-4">Tip: Create categories first to better organize your products.</p>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer shadow-soft hover:shadow-soft-md"
            >
              Add Product
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
