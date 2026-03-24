'use client'

import { useState, useEffect, useRef } from 'react'
import { ProductItem } from '@/lib/menuEditor/types'
import { createDefaultProductElements } from '@/lib/menuEditor/productHelpers'
import toast from 'react-hot-toast'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId: string
  storeId: string
  token: string
  onProductAdded: (product: ProductItem) => void
}

export default function AddProductModal({
  isOpen,
  onClose,
  categoryId,
  storeId,
  token,
  onProductAdded
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    sortOrder: 0
  })
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        isAvailable: true,
        sortOrder: 0
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ Prevent multiple simultaneous submissions
    if (isSubmittingRef.current) {
      return
    }
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Vui lòng nhập giá hợp lệ')
      return
    }

    isSubmittingRef.current = true
    
    try {
      // ✅ Chỉ tạo product trong state, không gọi API
      // Product sẽ được sync với DB khi user nhấn "Lưu"
      // Note: createDefaultProductElements is imported at top level to avoid race conditions
      
      const newProduct: ProductItem = {
        id: `prod-${Date.now()}-${Math.random()}`, // Temporary ID
        name: formData.name,
        description: formData.description || '',
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || '',
        isAvailable: formData.isAvailable,
        sortOrder: formData.sortOrder || 0,
        categoryIds: [categoryId],
        style: {
          cardLayout: 'detailed',
          showImage: !!formData.imageUrl,
          showDescription: !!formData.description,
          showPrice: true
        },
        children: [] // Will be initialized with default elements
      }
      
      // Initialize with default nested elements
      newProduct.children = createDefaultProductElements(newProduct)

      onProductAdded(newProduct)
      toast.success('Đã thêm sản phẩm vào danh sách. Nhấn "Lưu" để lưu vào cơ sở dữ liệu.')
      onClose()
    } finally {
      isSubmittingRef.current = false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Gà nướng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Mô tả sản phẩm..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL hình ảnh
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              (Cloudinary integration sẽ được thêm sau)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thứ tự sắp xếp
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 text-green-600 rounded"
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">
              Sản phẩm có sẵn
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Thêm sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
