'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface Category {
  id: string
  name: string
  sortOrder: number
  products: Product[]
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  sortOrder: number
  categoryIds?: string[]
}

interface MenuEditorProps {
  storeId: string
  token: string
  onSave?: () => void
}

export default function MenuEditor({ storeId, token, onSave }: MenuEditorProps) {
  const t = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'product'; id: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ type: 'category' | 'product'; id: string } | null>(null)

  const fetchMenuData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/catalog/stores/my-store/menu`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const menuData = await response.json()
        setCategories(menuData.categories || [])
        
        // Flatten products from all categories
        const allProducts: Product[] = []
        menuData.categories?.forEach((cat: any) => {
          cat.products?.forEach((prod: any) => {
            allProducts.push({ ...prod, categoryIds: [cat.id] })
          })
        })
        setProducts(allProducts)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  const handleDragStart = (type: 'category' | 'product', id: string) => {
    setDraggedItem({ type, id })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetCategoryId: string, targetIndex?: number) => {
    if (!draggedItem) return

    if (draggedItem.type === 'product') {
      // Move product to category
      const product = products.find(p => p.id === draggedItem.id)
      if (product) {
        // Update product categories via API
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
          await fetch(`${apiUrl}/catalog/stores/${storeId}/products/${draggedItem.id}/categories`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              categoryIds: [targetCategoryId, ...(product.categoryIds || [])],
            }),
          })
          fetchMenuData()
        } catch (error) {
          console.error('Error updating product categories:', error)
        }
      }
    } else if (draggedItem.type === 'category') {
      // Reorder categories
      const category = categories.find(c => c.id === draggedItem.id)
      if (category) {
        // Update category sort order
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
          await fetch(`${apiUrl}/catalog/stores/${storeId}/categories/${draggedItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              sortOrder: targetIndex || 0,
            }),
          })
          fetchMenuData()
        } catch (error) {
          console.error('Error updating category order:', error)
        }
      }
    }

    setDraggedItem(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">{t.menu.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMenuData()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {t.common.back}
          </button>
          <button
            onClick={onSave || fetchMenuData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t.common.save}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow p-6"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(category.id)
              }}
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between mb-4 cursor-move"
                draggable
                onDragStart={() => handleDragStart('category', category.id)}
              >
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem({ type: 'category', id: category.id })}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {t.common.edit}
                  </button>
                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {category.products?.length || 0} {t.menu.available.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.products?.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 cursor-move hover:border-blue-400 transition"
                    draggable
                    onDragStart={() => handleDragStart('product', product.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.isAvailable ? t.menu.available : t.menu.unavailable}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-lg font-semibold text-gray-900">
                      {product.price?.toLocaleString('vi-VN')} VNĐ
                    </p>
                    <button
                      onClick={() => setEditingItem({ type: 'product', id: product.id })}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t.common.edit}
                    </button>
                  </div>
                ))}
                
                {/* Add Product Button */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-blue-400 cursor-pointer transition"
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setEditingItem({ type: 'product', id: 'new' })
                  }}
                >
                  <span className="text-gray-500 text-sm">+ {t.menu.addProduct}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Category Button */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-blue-400 cursor-pointer transition bg-white"
            onClick={() => setEditingItem({ type: 'category', id: 'new' })}
          >
            <span className="text-gray-500">+ {t.categories.addCategory}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal would go here */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem.type === 'category' ? t.categories.createNewCategory : t.products.createNewProduct}
            </h3>
            <p className="text-gray-600 mb-4">Edit form would go here</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => {
                  setEditingItem(null)
                  fetchMenuData()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
