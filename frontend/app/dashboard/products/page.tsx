'use client'

import Image from 'next/image'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CloudinaryUpload from '@/components/CloudinaryUpload'
import toast from 'react-hot-toast'
import { buildStyleJsonForProductSave } from '@/lib/menuEditor/styleJson'
import ProductStyleEditor from '@/components/ProductStyleEditor'

function parseStyleJsonSafe(raw: string) {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showCommonStyleEditor, setShowCommonStyleEditor] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [commonProductStyleJson, setCommonProductStyleJson] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryIds: categoryId ? [categoryId] : [],
    imageUrl: '',
    isAvailable: true,
    sortOrder: 0,
    styleJson: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
      const url = editingProduct
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products/${editingProduct.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products`
      
      // Auto-calculate sort order for new products
      let sortOrder = formData.sortOrder
      if (!editingProduct) {
        if (products.length === 0) {
          sortOrder = 0
        } else {
          // Filter out null/undefined values, then map to numbers
          const sortOrders = products
            .map(p => p.sortOrder)
            .filter((so): so is number => so !== null && so !== undefined && typeof so === 'number')
          // Handle empty array case to avoid Math.max(...[]) returning -Infinity
          sortOrder = sortOrders.length > 0 ? Math.max(...sortOrders) + 1 : 0
        }
      }
      
      const styleJsonPayload = buildStyleJsonForProductSave(formData.imageUrl, formData.styleJson)

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
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
          sortOrder: sortOrder,
          styleJson: styleJsonPayload,
        }),
      })

      if (response.ok) {
        toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công')
        setShowForm(false)
        setEditingProduct(null)
        setSelectedProduct(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          categoryIds: categoryId ? [categoryId] : [],
          imageUrl: '',
          isAvailable: true,
          sortOrder: 0,
          styleJson: '',
        })
        await fetchData()
        // Trigger menu update
        await updateMenu()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Có lỗi xảy ra khi lưu sản phẩm')
    }
  }

  const updateMenu = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !store) return

      // Trigger menu regeneration
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/menu-html`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ menuHtml: null }), // Clear to trigger regeneration
      })
    } catch (error) {
      console.error('Error updating menu:', error)
    }
  }

  const applyCommonProductStyle = async () => {
    if (!store) return
    if (products.length === 0) {
      toast.error('Chưa có sản phẩm để áp dụng style')
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const styleJson = commonProductStyleJson.trim()

      for (const product of products) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            price: Number(product.price),
            // Preserve categories if empty (avoid sending [] which would clear mapping)
            categoryIds: product.categoryIds && product.categoryIds.length > 0 ? product.categoryIds : null,
            imageUrl: product.imageUrl,
            isAvailable: product.isAvailable,
            sortOrder: product.sortOrder,
            styleJson,
          }),
        })
      }

      toast.success('Đã áp dụng style sản phẩm dùng chung cho tất cả sản phẩm')
      await fetchData()
      await updateMenu()
    } catch (error) {
      console.error('Error applying common product style:', error)
      toast.error('Không thể áp dụng style sản phẩm dùng chung')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const token = localStorage.getItem('token')
      if (!token || !store) return

      const oldIndex = products.findIndex((p) => p.id === active.id)
      const newIndex = products.findIndex((p) => p.id === over.id)

      const newProducts = arrayMove(products, oldIndex, newIndex)
      setProducts(newProducts)

      // Update sort orders
      try {
        for (let i = 0; i < newProducts.length; i++) {
          const product = newProducts[i]
          if (product.sortOrder !== i) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products/${product.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: product.name,
                description: product.description,
                price: product.price,
                // `categoryIds` is returned by menu endpoint; using it prevents clearing categories unintentionally
                categoryIds: product.categoryIds || [],
                imageUrl: product.imageUrl,
                isAvailable: product.isAvailable,
                sortOrder: i,
                styleJson:
                  product.styleJson ??
                  (product.style && Object.keys(product.style).length > 0
                    ? JSON.stringify(product.style)
                    : ''),
              }),
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.message || `Failed to update product ${product.name}: ${response.status}`)
            }
          }
        }
        await updateMenu()
        toast.success('Đã cập nhật thứ tự sản phẩm')
      } catch (error) {
        console.error('Error updating sort order:', error)
        toast.error('Có lỗi khi cập nhật thứ tự')
        fetchData() // Revert on error
      }
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      categoryIds: product.categoryIds || [],
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
      sortOrder: product.sortOrder || 0,
      styleJson: JSON.stringify(product.style || {}),
    })
    setShowForm(true)
  }

  const handleDelete = async (product: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Đã xóa sản phẩm')
        setSelectedProduct(null)
        await fetchData()
        await updateMenu()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Có lỗi xảy ra khi xóa sản phẩm')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Có lỗi xảy ra khi xóa sản phẩm')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold text-text mb-6">Sản phẩm</h1>
        <div className="mb-6 flex justify-between items-center gap-2">
          <p className="text-text-muted">Quản lý sản phẩm trong menu</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCommonStyleEditor(true)}
              className="px-4 py-2 border border-border rounded-md hover:bg-background-muted text-sm"
            >
              Style dùng chung
            </button>
            <button
              onClick={() => {
                setEditingProduct(null)
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  categoryIds: categoryId ? [categoryId] : [],
                  imageUrl: '',
                  isAvailable: true,
                  sortOrder: 0,
                  styleJson: '',
                })
                setShowForm(true)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer shadow-soft hover:shadow-soft-md"
            >
              Thêm sản phẩm
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="absolute inset-0 p-4 overflow-y-auto">
              <div className="mx-auto max-w-6xl card p-6">
                <h2 className="font-heading text-lg font-semibold text-text mb-4">
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4" method="post" action="#">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Gà nướng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Giá (VNĐ) *
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
                    Mô tả
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả sản phẩm..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Style thẻ sản phẩm (ghi đè)</label>
                <ProductStyleEditor
                  valueJson={formData.styleJson}
                  onJsonChange={(j) => setFormData((prev) => ({ ...prev, styleJson: j }))}
                  previewSample={{
                    name: formData.name || 'Món mẫu',
                    price: Number.isFinite(parseFloat(formData.price)) ? parseFloat(formData.price) : 45000,
                    description: formData.description || 'Mô tả mẫu',
                    imageUrl: formData.imageUrl || undefined,
                  }}
                  previewContext={{
                    categories: (() => {
                      const source = categories || []
                      const productId = editingProduct?.id
                      if (!productId) return source
                      return source.map((cat: any) => ({
                        ...cat,
                        products: (cat.products || []).map((p: any) =>
                          p.id === productId
                            ? {
                                ...p,
                                name: formData.name || p.name,
                                description: formData.description || p.description,
                                price:
                                  Number.isFinite(parseFloat(formData.price)) && parseFloat(formData.price) > 0
                                    ? parseFloat(formData.price)
                                    : p.price,
                                imageUrl: formData.imageUrl || p.imageUrl,
                                style: parseStyleJsonSafe(formData.styleJson),
                              }
                            : p
                        ),
                      }))
                    })(),
                    highlightProductId: editingProduct?.id,
                  }}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh sản phẩm
                </label>
                <CloudinaryUpload
                  onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="product-images"
                  buttonText="Upload ảnh"
                  currentImageUrl={formData.imageUrl || undefined}
                  className="mb-2"
                />
                {formData.imageUrl && (
                  <div className="relative mt-2 h-32 w-full max-w-md rounded border overflow-hidden">
                    <Image
                      src={formData.imageUrl}
                      alt="Xem trước"
                      fill
                      className="object-cover"
                      sizes="448px"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
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
                  Có sẵn để đặt món
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
                >
                  {editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      categoryIds: categoryId ? [categoryId] : [],
                      imageUrl: '',
                      isAvailable: true,
                      sortOrder: 0,
                      styleJson: '',
                    })
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showCommonStyleEditor && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCommonStyleEditor(false)} />
            <div className="absolute inset-0 p-4 overflow-y-auto">
              <div className="mx-auto max-w-6xl card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-text">Style thẻ sản phẩm dùng chung</h2>
                    <p className="text-sm text-text-muted">
                      Chỉnh một lần để áp dụng cho toàn bộ sản phẩm, vẫn có thể ghi đè riêng từng sản phẩm.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-border"
                    onClick={() => setShowCommonStyleEditor(false)}
                  >
                    Đóng
                  </button>
                </div>
                <ProductStyleEditor
                  valueJson={commonProductStyleJson}
                  onJsonChange={setCommonProductStyleJson}
                  previewContext={{
                    categories: (categories || []).map((cat: any) => ({
                      ...cat,
                      products: (cat.products || []).map((p: any) => ({
                        ...p,
                        style: { ...(p.style || {}), ...parseStyleJsonSafe(commonProductStyleJson) },
                      })),
                    })),
                  }}
                />
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button type="button" onClick={applyCommonProductStyle} className="btn-primary" disabled={products.length === 0}>
                    Áp dụng cho tất cả sản phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommonProductStyleJson('')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    disabled={!commonProductStyleJson.trim()}
                  >
                    Xóa style dùng chung (form)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {products.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-8">
                      ⋮⋮
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="bg-white divide-y divide-border">
                    {products.map((product) => (
                      <SortableProductRow
                        key={product.id}
                        product={product}
                        isSelected={selectedProduct === product.id}
                        onSelect={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                        onEdit={() => handleEdit(product)}
                        onDelete={() => handleDelete(product)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-text-muted mb-4">Chưa có sản phẩm. Hãy tạo sản phẩm đầu tiên để xây dựng menu.</p>
            {categories.length === 0 && (
              <p className="text-sm text-text-muted mb-4">Mẹo: Hãy tạo danh mục trước để sắp xếp sản phẩm tốt hơn.</p>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer shadow-soft hover:shadow-soft-md"
            >
              Thêm sản phẩm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableProductRow({ product, isSelected, onSelect, onEdit, onDelete }: {
  product: any
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-background-muted transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onSelect}
    >
      <td className="px-6 py-4 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <span className="text-gray-400">⋮⋮</span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-text">{product.name}</div>
        {product.description && (
          <div className="text-sm text-text-muted">{product.description}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-text-muted">{product.categoryName || 'Chưa phân loại'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-text">
          {product.price?.toLocaleString('vi-VN')} VNĐ
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-background-muted text-text-muted'}`}>
          {product.isAvailable ? 'Có sẵn' : 'Không có sẵn'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors duration-200 cursor-pointer"
          >
            Sửa
          </button>
          {isSelected && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors duration-200 cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Đang tải...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
