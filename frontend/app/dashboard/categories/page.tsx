'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import CategoryStyleEditor from '@/components/CategoryStyleEditor'

function parseStyleJsonSafe(raw: string) {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showCommonStyleEditor, setShowCommonStyleEditor] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', sortOrder: 0, styleJson: '' })
  const [commonCategoryStyleJson, setCommonCategoryStyleJson] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Get store first
      const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (storeResponse.ok) {
        const storeData = await storeResponse.json()
        setStore(storeData)

        const catResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (catResponse.ok) {
          const rows = await catResponse.json()
          const normalized = (rows as Array<{ id: string; name: string; sortOrder: number; styleJson?: string | null; productCount?: number }>).map((c) => {
            let style: Record<string, unknown> = {}
            if (c.styleJson?.trim()) {
              try {
                style = JSON.parse(c.styleJson) as Record<string, unknown>
              } catch {
                style = {}
              }
            }
            return {
              id: c.id,
              name: c.name,
              sortOrder: c.sortOrder,
              style,
              productCount: typeof c.productCount === 'number' ? c.productCount : 0,
            }
          })
          setCategories(normalized)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    try {
      const token = localStorage.getItem('token')
      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/categories`
      
      // Auto-calculate sort order for new categories
      let sortOrder = formData.sortOrder
      if (!editingCategory) {
        if (categories.length === 0) {
          sortOrder = 0
        } else {
          // Filter out null/undefined values, then map to numbers
          const sortOrders = categories
            .map(c => c.sortOrder)
            .filter((so): so is number => so !== null && so !== undefined && typeof so === 'number')
          // Handle empty array case to avoid Math.max(...[]) returning -Infinity
          sortOrder = sortOrders.length > 0 ? Math.max(...sortOrders) + 1 : 0
        }
      }
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, sortOrder }),
      })

      if (response.ok) {
        toast.success(editingCategory ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công')
        setShowForm(false)
        setEditingCategory(null)
        setSelectedCategory(null)
        setFormData({ name: '', sortOrder: 0, styleJson: '' })
        await fetchCategories()
        await updateMenu()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Có lỗi xảy ra khi lưu danh mục')
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

  const applyCommonCategoryStyle = async () => {
    if (!store) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const styleJson = commonCategoryStyleJson

      // Apply the same style to all categories to emulate "common style".
      for (const category of categories) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/categories/${category.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: category.name,
            sortOrder: category.sortOrder,
            styleJson,
          }),
        })
      }

      toast.success(
        styleJson.trim()
          ? 'Đã áp dụng style danh mục dùng chung cho tất cả danh mục'
          : 'Đã gỡ style tùy chỉnh — các danh mục dùng mặc định theo template menu'
      )
      await fetchCategories()
      await updateMenu()
    } catch (error) {
      console.error('Error applying common category style:', error)
      toast.error('Không thể áp dụng style danh mục dùng chung')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const token = localStorage.getItem('token')
      if (!token || !store) return

      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)
      setCategories(newCategories)

      // Update sort orders
      try {
        for (let i = 0; i < newCategories.length; i++) {
          const category = newCategories[i]
          if (category.sortOrder !== i) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/categories/${category.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: category.name,
                sortOrder: i,
                styleJson: category.style ? JSON.stringify(category.style) : '',
              }),
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.message || `Failed to update category ${category.name}: ${response.status}`)
            }
          }
        }
        await updateMenu()
        toast.success('Đã cập nhật thứ tự danh mục')
      } catch (error) {
        console.error('Error updating sort order:', error)
        toast.error('Có lỗi khi cập nhật thứ tự')
        fetchCategories() // Revert on error
      }
    }
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      sortOrder: category.sortOrder || 0,
      styleJson: JSON.stringify(category.style || {}),
    })
    setShowForm(true)
  }

  const handleDelete = async (category: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Đã xóa danh mục')
        setSelectedCategory(null)
        await fetchCategories()
        await updateMenu()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Có lỗi xảy ra khi xóa danh mục')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Có lỗi xảy ra khi xóa danh mục')
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
        <h1 className="font-heading text-2xl font-bold text-text mb-6">Danh mục</h1>
        <div className="mb-6 flex justify-between items-center gap-2">
          <p className="text-gray-600">Sắp xếp menu của bạn theo danh mục</p>
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
                setEditingCategory(null)
                setFormData({ name: '', sortOrder: 0, styleJson: '' })
                setShowForm(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
            >
              Thêm danh mục
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="absolute inset-0 p-4 overflow-y-auto">
              <div className="mx-auto max-w-4xl card p-6">
                <h2 className="font-heading text-lg font-semibold text-text mb-4">
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4" method="post" action="#">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Món khai vị, Món chính, Tráng miệng"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Giao diện riêng danh mục này</h3>
                <p className="text-xs text-text-muted mb-3">
                  Để trống = dùng mô tả chung phía trên hoặc mặc định template. Chỉnh ở đây sẽ ghi đè cho mỗi danh mục.
                </p>
                <CategoryStyleEditor
                  valueJson={formData.styleJson}
                  onJsonChange={(json) => setFormData({ ...formData, styleJson: json })}
                  previewContext={{
                    categories: categories.map((c) =>
                      c.id === editingCategory?.id
                        ? { ...c, name: formData.name || c.name, style: parseStyleJsonSafe(formData.styleJson) }
                        : c
                    ),
                    highlightCategoryId: editingCategory?.id,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setFormData({ name: '', sortOrder: 0, styleJson: '' })
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
              <div className="mx-auto max-w-5xl card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-text">Style danh mục dùng chung</h2>
                    <p className="text-sm text-text-muted">
                      Chỉnh cho tất cả danh mục, hoặc ghi đè riêng khi sửa từng danh mục.
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
                <CategoryStyleEditor
                  valueJson={commonCategoryStyleJson}
                  onJsonChange={setCommonCategoryStyleJson}
                  previewContext={{
                    categories: categories.map((c) => ({
                      ...c,
                      style: { ...(c.style || {}), ...parseStyleJsonSafe(commonCategoryStyleJson) },
                    })),
                  }}
                />
                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="button" onClick={applyCommonCategoryStyle} className="btn-primary">
                    Áp dụng cho tất cả danh mục
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommonCategoryStyleJson('')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                  >
                    Xóa style và đặt lại mặc định
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {categories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      ⋮⋮
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <SortableCategoryRow
                        key={category.id}
                        category={category}
                        isSelected={selectedCategory === category.id}
                        onSelect={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                        onEdit={() => handleEdit(category)}
                        onDelete={() => handleDelete(category)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-text-muted mb-4">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên để sắp xếp menu.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Tạo danh mục
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableCategoryRow({ category, isSelected, onSelect, onEdit, onDelete }: {
  category: any
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
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onSelect}
    >
      <td className="px-6 py-4 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <span className="text-gray-400">⋮⋮</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{category.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{(category as { productCount?: number }).productCount ?? category.products?.length ?? 0} sản phẩm</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/products?category=${category.id}`}
            className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors duration-200 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            Xem sản phẩm
          </Link>
          <button
            onClick={onEdit}
            className="text-green-600 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 rounded transition-colors duration-200 cursor-pointer"
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
