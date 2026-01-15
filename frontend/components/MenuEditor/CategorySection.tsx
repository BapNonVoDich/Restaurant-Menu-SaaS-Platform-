'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CategoryItem, ProductItem, CustomElement } from '@/lib/menuEditor/types'
import ProductCard from './ProductCard'
import CustomElementComponent from './CustomElementComponent'

interface CategorySectionProps {
  category: CategoryItem
  isSelected: boolean
  isMultiSelected: boolean
  onSelect: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<CategoryItem>) => void
  onDelete?: () => void
  onProductSelect: (productId: string, e?: React.MouseEvent) => void
  onProductUpdate: (productId: string, updates: Partial<ProductItem>) => void
  onProductDelete?: (productId: string) => void
  activeDragId: string | null
  onAddProduct: (categoryId: string) => void
  onCustomElementSelect?: (elementId: string, e?: React.MouseEvent) => void
  onCustomElementUpdate?: (elementId: string, updates: Partial<CustomElement>) => void
  onCustomElementDelete?: (elementId: string) => void
  selectedCustomElementId?: string | null
  globalCategoryStyle?: any
  globalProductCardStyle?: any
  onAddChild?: (parentId: string) => void
}

export default function CategorySection({
  category,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
  onDelete,
  onProductSelect,
  onProductUpdate,
  onProductDelete,
  activeDragId,
  onAddProduct,
  onCustomElementSelect,
  onCustomElementUpdate,
  onCustomElementDelete,
  selectedCustomElementId,
  globalCategoryStyle,
  globalProductCardStyle
}: CategorySectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id, data: { type: 'category' } })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // No transition while dragging
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 9999 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    scale: isDragging ? 1.02 : 1
  }

  // Build style object from category.style, merging with global style
  const buildStyleObject = () => {
    const style = { ...globalCategoryStyle, ...category.style } // Global style as base, category style overrides
    const styleObj: React.CSSProperties = {}
    
    // Colors
    if (style.backgroundColor) styleObj.backgroundColor = style.backgroundColor
    if (style.textColor) styleObj.color = style.textColor
    
    // Typography
    if (style.fontFamily) styleObj.fontFamily = style.fontFamily
    if (style.fontSize) styleObj.fontSize = style.fontSize
    if (style.fontWeight) styleObj.fontWeight = style.fontWeight as any
    if (style.lineHeight) styleObj.lineHeight = style.lineHeight
    if (style.textAlign) styleObj.textAlign = style.textAlign as any
    
    // Spacing
    if (style.padding) styleObj.padding = style.padding
    else {
      if (style.paddingTop) styleObj.paddingTop = style.paddingTop
      if (style.paddingRight) styleObj.paddingRight = style.paddingRight
      if (style.paddingBottom) styleObj.paddingBottom = style.paddingBottom
      if (style.paddingLeft) styleObj.paddingLeft = style.paddingLeft
    }
    if (style.margin) styleObj.margin = style.margin
    else {
      if (style.marginTop) styleObj.marginTop = style.marginTop
      if (style.marginRight) styleObj.marginRight = style.marginRight
      if (style.marginBottom) styleObj.marginBottom = style.marginBottom
      if (style.marginLeft) styleObj.marginLeft = style.marginLeft
    }
    
    // Border
    if (style.border) styleObj.border = style.border
    else {
      if (style.borderWidth) styleObj.borderWidth = style.borderWidth
      if (style.borderStyle) styleObj.borderStyle = style.borderStyle as any
      if (style.borderColor) styleObj.borderColor = style.borderColor
    }
    if (style.borderRadius) styleObj.borderRadius = style.borderRadius
    
    // Display & Layout
    if (style.display) styleObj.display = style.display as any
    if (style.flexDirection) styleObj.flexDirection = style.flexDirection as any
    if (style.justifyContent) styleObj.justifyContent = style.justifyContent as any
    if (style.alignItems) styleObj.alignItems = style.alignItems as any
    if (style.gap) styleObj.gap = style.gap
    
    // Size
    if (style.width) styleObj.width = style.width
    if (style.height) styleObj.height = style.height
    if (style.minWidth) styleObj.minWidth = style.minWidth
    if (style.minHeight) styleObj.minHeight = style.minHeight
    if (style.maxWidth) styleObj.maxWidth = style.maxWidth
    if (style.maxHeight) styleObj.maxHeight = style.maxHeight
    
    // Effects
    if (style.boxShadow) styleObj.boxShadow = style.boxShadow
    if (style.opacity) styleObj.opacity = style.opacity
    if (style.transform) styleObj.transform = style.transform
    if (style.transition) styleObj.transition = style.transition
    
    // Merge with drag styles
    return { ...styleObj, ...dragStyle }
  }

  const categoryStyle = buildStyleObject()

  // Build header style
  const buildHeaderStyle = () => {
    const style = category.style
    const styleObj: React.CSSProperties = {}
    
    if (style.fontFamily) styleObj.fontFamily = style.fontFamily
    if (style.fontSize) styleObj.fontSize = style.fontSize || '2rem'
    if (style.fontWeight) styleObj.fontWeight = style.fontWeight as any
    if (style.textColor) styleObj.color = style.textColor
    if (style.textAlign) styleObj.textAlign = style.textAlign as any
    
    return styleObj
  }

  const headerStyle = buildHeaderStyle()

  const handleNameBlur = () => {
    if (editName !== category.name) {
      onUpdate({ name: editName })
    }
    setIsEditing(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur()
    } else if (e.key === 'Escape') {
      setEditName(category.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={categoryStyle}
      className={`rounded-lg shadow-md border-2 transition-all relative ${
        isSelected || isMultiSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
      onClick={(e) => {
        // Only select category if clicking on the category container itself, not on products
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.category-header')) {
          onSelect(e)
        }
      }}
    >
      {/* Delete button */}
      {isSelected && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
          title="Xóa danh mục"
        >
          ✕
        </button>
      )}
      {/* Category Header */}
      <div 
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition: isDragging ? 'none' : transition,
          opacity: isDragging ? 0.8 : 1,
          cursor: isDragging ? 'grabbing' : 'move',
          position: isDragging ? 'relative' : undefined,
          pointerEvents: isDragging ? 'none' : undefined
        } as React.CSSProperties}
        {...attributes}
        {...listeners}
        className="flex items-center gap-3 mb-4"
      >

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="flex-1 text-2xl font-bold border-2 border-blue-500 rounded px-3 py-1 focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h2
            className="flex-1 text-2xl font-bold cursor-text"
            style={headerStyle}
            onDoubleClick={() => setIsEditing(true)}
          >
            {category.name}
          </h2>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddProduct(category.id)
            }}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition flex items-center gap-1"
          >
            + Thêm sản phẩm
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Add nested element
              const newElement: CustomElement = {
                id: `nested-${Date.now()}-${Math.random()}`,
                type: 'text',
                content: 'Nội dung mới',
                style: {},
                sortOrder: (category.children?.length || 0),
                parentId: category.id,
                parentType: 'category'
              }
              onUpdate({
                children: [...(category.children || []), newElement]
              })
            }}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition flex items-center gap-1"
          >
            + Thêm element con
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <SortableContext
        items={category.products
          .filter(p => p.categoryIds.includes(category.id))
          .map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`grid gap-4 ${
            category.style.layout === 'grid'
              ? `grid-cols-${category.style.columns || 3}`
              : 'grid-cols-1'
          }`}
          style={{
            gridTemplateColumns: category.style.layout === 'grid'
              ? `repeat(${category.style.columns || 3}, 1fr)`
              : '1fr'
          }}
        >
          {category.products
            .filter(p => p.categoryIds.includes(category.id))
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryId={category.id}
                isSelected={activeDragId === product.id}
                onSelect={(e) => onProductSelect(product.id, e)}
                onUpdate={(updates) => onProductUpdate(product.id, updates)}
                onDelete={onProductDelete ? () => onProductDelete(product.id) : undefined}
                globalProductCardStyle={globalProductCardStyle}
                onCustomElementSelect={onCustomElementSelect}
                onCustomElementUpdate={onCustomElementUpdate}
                onCustomElementDelete={onCustomElementDelete}
                selectedCustomElementId={selectedCustomElementId}
              />
            ))}
        </div>
      </SortableContext>

      {/* Nested Elements */}
      {category.children && category.children.length > 0 && (
        <SortableContext
          items={category.children.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-4 space-y-2">
            {category.children
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((element) => (
                <CustomElementComponent
                  key={element.id}
                  element={element}
                  isSelected={selectedCustomElementId === element.id}
                  isMultiSelected={false}
                  onSelect={(e) => {
                    e.stopPropagation()
                    onCustomElementSelect?.(element.id, e)
                  }}
                  onUpdate={(updates) => onCustomElementUpdate?.(element.id, updates)}
                  onDelete={() => onCustomElementDelete?.(element.id)}
                  onCustomElementSelect={onCustomElementSelect}
                  onCustomElementUpdate={onCustomElementUpdate}
                  onCustomElementDelete={onCustomElementDelete}
                  selectedCustomElementId={selectedCustomElementId}
                  onAddChild={(parentId) => {
                    // Recursively find and update the parent element
                    const addChildRecursive = (elements: CustomElement[]): CustomElement[] => {
                      return elements.map(e => {
                        if (e.id === parentId) {
                          const newElement: CustomElement = {
                            id: `nested-${Date.now()}-${Math.random()}`,
                            type: 'text',
                            content: 'Nội dung mới',
                            style: {},
                            sortOrder: (e.children?.length || 0),
                            parentId: parentId,
                            parentType: 'category'
                          }
                          return { ...e, children: [...(e.children || []), newElement] }
                        }
                        if (e.children && e.children.length > 0) {
                          return { ...e, children: addChildRecursive(e.children) }
                        }
                        return e
                      })
                    }
                    
                    const updatedChildren = addChildRecursive(category.children || [])
                    onUpdate({ children: updatedChildren })
                  }}
                />
              ))}
          </div>
        </SortableContext>
      )}

      {category.products.filter(p => p.categoryIds.includes(category.id)).length === 0 && 
       (!category.children || category.children.length === 0) && (
        <div className="text-center py-8 text-gray-400">
          Chưa có sản phẩm nào. Nhấp vào &quot;Thêm sản phẩm&quot; để bắt đầu.
        </div>
      )}
    </div>
  )
}
