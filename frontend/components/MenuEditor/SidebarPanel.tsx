'use client'

import { useState } from 'react'
import { CategoryItem, ProductItem, CustomElement, CustomizationSettings } from '@/lib/menuEditor/types'
import { HexColorPicker } from 'react-colorful'
import AdvancedStyleEditor from './AdvancedStyleEditor'

interface SidebarPanelProps {
  selectedCategory: CategoryItem | null
  selectedProduct: ProductItem | null
  selectedSection: CustomElement | null
  selectedCustomElement: CustomElement | null
  customization: CustomizationSettings
  onUpdateCategory: (updates: Partial<CategoryItem>) => void
  onUpdateProduct: (updates: Partial<ProductItem>) => void
  onUpdateSection: (updates: Partial<CustomElement>) => void
  onUpdateCustomElement: (updates: Partial<CustomElement>) => void
  onUpdateCustomization: (updates: Partial<CustomizationSettings>) => void
  onClose: () => void
}

export default function SidebarPanel({
  selectedCategory,
  selectedProduct,
  selectedSection,
  selectedCustomElement,
  customization,
  onUpdateCategory,
  onUpdateProduct,
  onUpdateSection,
  onUpdateCustomElement,
  onUpdateCustomization,
  onClose
}: SidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<'item' | 'customization'>('item')

  // Always show panel, even when nothing is selected

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Tùy chỉnh</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('item')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              activeTab === 'item'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={!selectedCategory && !selectedProduct && !selectedSection && !selectedCustomElement}
          >
            Mục đã chọn
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              activeTab === 'customization'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎨 Toàn cục
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {activeTab === 'item' ? (
          <>
            {!selectedCategory && !selectedProduct && !selectedSection && !selectedCustomElement && (
              <div className="text-center text-gray-500 py-8">
                Chọn một mục để chỉnh sửa
              </div>
            )}
            {selectedCategory && (
              <div className="space-y-4">
                <CategoryEditor
                  category={selectedCategory}
                  onUpdate={onUpdateCategory}
                />
                <div className="border-t pt-4">
                  <AdvancedStyleEditor
                    style={selectedCategory.style}
                    onUpdate={(updates) => onUpdateCategory({ style: { ...selectedCategory.style, ...updates } })}
                    title="Tùy chỉnh CSS nâng cao"
                  />
                </div>
              </div>
            )}
            {selectedProduct && (
              <div className="space-y-4">
                <ProductEditor
                  product={selectedProduct}
                  onUpdate={onUpdateProduct}
                />
                <div className="border-t pt-4">
                  <AdvancedStyleEditor
                    style={selectedProduct.style}
                    onUpdate={(updates) => onUpdateProduct({ style: { ...selectedProduct.style, ...updates } })}
                    title="Tùy chỉnh CSS nâng cao"
                  />
                </div>
              </div>
            )}
            {selectedSection && (
              <div className="space-y-4">
                <SectionEditor
                  section={selectedSection}
                  onUpdate={onUpdateSection}
                />
                <div className="border-t pt-4">
                  <AdvancedStyleEditor
                    style={selectedSection.style}
                    onUpdate={(updates) => onUpdateSection({ style: { ...selectedSection.style, ...updates } })}
                    title="Tùy chỉnh CSS nâng cao"
                  />
                </div>
              </div>
            )}
            {selectedCustomElement && (
              <div className="space-y-4">
                <CustomElementEditor
                  element={selectedCustomElement}
                  onUpdate={onUpdateCustomElement}
                />
                <div className="border-t pt-4">
                  <AdvancedStyleEditor
                    style={selectedCustomElement.style}
                    onUpdate={(updates) => onUpdateCustomElement({ style: { ...selectedCustomElement.style, ...updates } })}
                    title="Tùy chỉnh CSS nâng cao"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <CustomizationEditor
            customization={customization}
            onUpdate={onUpdateCustomization}
          />
        )}
      </div>
    </div>
  )
}

// Category Editor
function CategoryEditor({
  category,
  onUpdate
}: {
  category: CategoryItem
  onUpdate: (updates: Partial<CategoryItem>) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">Danh mục: {category.name}</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bố cục
        </label>
        <select
          value={category.style.layout}
          onChange={(e) => onUpdate({
            style: { ...category.style, layout: e.target.value as 'grid' | 'list' | 'card' }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="grid">Lưới</option>
          <option value="list">Danh sách</option>
          <option value="card">Thẻ</option>
        </select>
      </div>

      {category.style.layout === 'grid' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số cột
          </label>
          <input
            type="number"
            min="1"
            max="6"
            value={category.style.columns || 3}
            onChange={(e) => onUpdate({
              style: { ...category.style, columns: parseInt(e.target.value) || 3 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      <div className="text-xs text-gray-500 mb-2">
        Sử dụng tab &quot;Tùy chỉnh CSS nâng cao&quot; bên dưới để chỉnh sửa đầy đủ các thuộc tính CSS
      </div>
    </div>
  )
}

// Product Editor
function ProductEditor({
  product,
  onUpdate
}: {
  product: ProductItem
  onUpdate: (updates: Partial<ProductItem>) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">Sản phẩm: {product.name}</h4>

      {/* Product Data Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sản phẩm
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhập tên sản phẩm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá (đ)
          </label>
          <input
            type="number"
            value={product.price}
            onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="0"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            value={product.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhập mô tả sản phẩm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL hình ảnh
          </label>
          <input
            type="url"
            value={product.imageUrl || ''}
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/image.jpg"
          />
          {product.imageUrl && (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="mt-2 max-w-full h-32 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.isAvailable}
              onChange={(e) => onUpdate({ isAvailable: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Có sẵn</span>
          </label>
        </div>
      </div>

      {/* Show/Hide Toggles */}
      <div className="border-t pt-4 space-y-2">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Hiển thị</h5>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={product.style.showImage}
            onChange={(e) => onUpdate({
              style: { ...product.style, showImage: e.target.checked }
            })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Hiển thị hình ảnh</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={product.style.showDescription}
            onChange={(e) => onUpdate({
              style: { ...product.style, showDescription: e.target.checked }
            })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Hiển thị mô tả</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={product.style.showPrice}
            onChange={(e) => onUpdate({
              style: { ...product.style, showPrice: e.target.checked }
            })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Hiển thị giá</span>
        </label>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Sử dụng tab &quot;Tùy chỉnh CSS nâng cao&quot; bên dưới để chỉnh sửa đầy đủ các thuộc tính CSS
      </div>
    </div>
  )
}

// Section Editor
function SectionEditor({
  section,
  onUpdate
}: {
  section: CustomElement
  onUpdate: (updates: Partial<CustomElement>) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">Element tùy chỉnh</h4>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Element tùy chỉnh</strong> là một container có thể chứa các element con.
        </p>
        <p className="text-xs text-blue-600">
          Nhấp vào nút &quot;Thêm element con&quot; trên element để thêm text, image, button, divider, hoặc các element tùy chỉnh khác.
        </p>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Sử dụng tab &quot;Tùy chỉnh CSS nâng cao&quot; bên dưới để chỉnh sửa đầy đủ các thuộc tính CSS
      </div>
    </div>
  )
}

// Nested Element Editor
function CustomElementEditor({
  element,
  onUpdate
}: {
  element: CustomElement
  onUpdate: (updates: Partial<CustomElement>) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">
        Element con: {element.type === 'text' && 'Văn bản'}
        {element.type === 'image' && 'Hình ảnh'}
        {element.type === 'divider' && 'Phân cách'}
        {element.type === 'button' && 'Nút'}
        {element.type === 'custom' && 'Element tùy chỉnh'}
      </h4>
      
      {element.type === 'custom' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Element tùy chỉnh</strong> là một container có thể chứa các element con.
          </p>
          <p className="text-xs text-blue-600">
            Nhấp vào nút &quot;Thêm element con&quot; trên element để thêm text, image, button, divider, hoặc các element tùy chỉnh khác.
          </p>
        </div>
      )}

      {/* Don't show type selector for product field elements */}
      {!element.fieldData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại
          </label>
          <select
            value={element.type}
            onChange={(e) => onUpdate({ type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="text">Văn bản</option>
            <option value="image">Hình ảnh</option>
            <option value="divider">Phân cách</option>
            <option value="button">Nút</option>
            <option value="custom">Element tùy chỉnh (Container)</option>
          </select>
        </div>
      )}
      
      {/* Show info for product field elements */}
      {element.fieldData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Đây là trường dữ liệu sản phẩm ({element.fieldData.fieldType}). Loại không thể thay đổi.
          </p>
        </div>
      )}

      {(element.type === 'text' || element.type === 'button') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung
          </label>
          <textarea
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
          />
        </div>
      )}

      {element.type === 'image' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL hình ảnh
          </label>
          <input
            type="url"
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )}

      <div className="text-xs text-gray-500 mb-2">
        Sử dụng tab &quot;Tùy chỉnh CSS nâng cao&quot; bên dưới để chỉnh sửa đầy đủ các thuộc tính CSS
      </div>
    </div>
  )
}

// Customization Editor
function CustomizationEditor({
  customization,
  onUpdate
}: {
  customization: CustomizationSettings
  onUpdate: (updates: Partial<CustomizationSettings>) => void
}) {
  const [activeGlobalTab, setActiveGlobalTab] = useState<'general' | 'category' | 'product'>('general')

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">Tùy chỉnh toàn cục</h4>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        {(['general', 'category', 'product'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveGlobalTab(tab)}
            className={`px-3 py-1.5 text-xs rounded-t-md transition flex-shrink-0 ${
              activeGlobalTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'general' && '🌐 Chung'}
            {tab === 'category' && '📁 Danh mục'}
            {tab === 'product' && '📦 Sản phẩm'}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeGlobalTab === 'general' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font chữ
            </label>
            <select
              value={customization.globalFontFamily}
              onChange={(e) => onUpdate({ globalFontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="system-ui, -apple-system, sans-serif">System</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
            </select>
          </div>

          <ColorPicker
            label="Màu chữ toàn cục"
            value={customization.globalTextColor}
            onChange={(color) => onUpdate({ globalTextColor: color })}
          />

          <ColorPicker
            label="Màu nền toàn cục"
            value={customization.globalBackgroundColor}
            onChange={(color) => onUpdate({ globalBackgroundColor: color })}
          />


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng cách
            </label>
            <input
              type="text"
              value={customization.globalSpacing}
              onChange={(e) => onUpdate({ globalSpacing: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="20px"
            />
          </div>
        </div>
      )}

      {/* Category Global Settings */}
      {activeGlobalTab === 'category' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Các cài đặt này sẽ áp dụng cho tất cả các danh mục mới. Danh mục hiện có vẫn giữ nguyên style riêng của chúng.
          </p>
          <AdvancedStyleEditor
            style={customization.globalCategoryStyle || {}}
            onUpdate={(updates) => onUpdate({ 
              globalCategoryStyle: { ...customization.globalCategoryStyle, ...updates } 
            })}
            title="Style mặc định cho danh mục"
          />
        </div>
      )}

      {/* Product Global Settings */}
      {activeGlobalTab === 'product' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Các cài đặt này sẽ áp dụng cho tất cả các sản phẩm mới. Sản phẩm hiện có vẫn giữ nguyên style riêng của chúng.
          </p>
          
          {/* Field Order Configuration */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thứ tự hiển thị thông tin sản phẩm (bằng số)
            </label>
            <div className="space-y-2">
              {['name', 'image', 'description', 'price'].map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <label className="flex-1 text-sm text-gray-600 capitalize">
                    {field === 'name' ? 'Tên' : field === 'image' ? 'Hình ảnh' : field === 'description' ? 'Mô tả' : 'Giá'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={customization.globalProductCardStyle?.fieldOrder?.[field as keyof typeof customization.globalProductCardStyle.fieldOrder] ?? 
                      (field === 'name' ? 0 : field === 'image' ? 1 : field === 'description' ? 2 : 3)}
                    onChange={(e) => {
                      const newOrder = parseInt(e.target.value) || 0
                      onUpdate({
                        globalProductCardStyle: {
                          ...customization.globalProductCardStyle,
                          fieldOrder: {
                            ...customization.globalProductCardStyle?.fieldOrder,
                            [field]: newOrder
                          }
                        }
                      })
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Số nhỏ hơn sẽ hiển thị trước. Mặc định: Tên (0), Hình ảnh (1), Mô tả (2), Giá (3)
            </p>
          </div>

          {/* Global Product Field Styles */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Tùy chỉnh toàn cục cho thông tin sản phẩm</h5>
            <div className="space-y-3">
              {['name', 'image', 'description', 'price'].map((field) => (
                <div key={field} className="border border-gray-200 rounded p-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2 capitalize">
                    {field === 'name' ? 'Tên sản phẩm' : field === 'image' ? 'Hình ảnh' : field === 'description' ? 'Mô tả' : 'Giá'}
                  </label>
                  <AdvancedStyleEditor
                    style={customization.globalProductFieldStyles?.[field as keyof typeof customization.globalProductFieldStyles] || {}}
                    onUpdate={(updates) => onUpdate({ 
                      globalProductFieldStyles: {
                        ...customization.globalProductFieldStyles,
                        [field]: {
                          ...(customization.globalProductFieldStyles?.[field as keyof typeof customization.globalProductFieldStyles] || {}),
                          ...updates
                        }
                      }
                    })}
                    title={`Style cho ${field === 'name' ? 'tên' : field === 'image' ? 'hình ảnh' : field === 'description' ? 'mô tả' : 'giá'}`}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <AdvancedStyleEditor
            style={customization.globalProductCardStyle || {}}
            onUpdate={(updates) => onUpdate({ 
              globalProductCardStyle: { ...customization.globalProductCardStyle, ...updates } 
            })}
            title="Style mặc định cho sản phẩm"
          />
        </div>
      )}
    </div>
  )
}

// Color Picker Component
function ColorPicker({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 border-2 border-gray-300 rounded cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      {showPicker && (
        <div className="mt-2 p-3 bg-white border border-gray-300 rounded-md shadow-lg">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
