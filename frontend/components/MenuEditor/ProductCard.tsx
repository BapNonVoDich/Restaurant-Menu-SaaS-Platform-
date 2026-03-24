'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ProductItem, CustomElement, ProductStyle } from '@/lib/menuEditor/types'
import CustomElementComponent from './CustomElementComponent'
import { createDefaultProductElements } from '@/lib/menuEditor/productHelpers'

interface ProductCardProps {
  product: ProductItem
  categoryId: string
  isSelected: boolean
  onSelect: (e?: React.MouseEvent) => void
  onUpdate: (updates: Partial<ProductItem>) => void
  onDelete?: () => void
  onCustomElementSelect?: (elementId: string, e?: React.MouseEvent) => void
  onCustomElementUpdate?: (elementId: string, updates: Partial<CustomElement>) => void
  onCustomElementDelete?: (elementId: string) => void
  selectedCustomElementId?: string | null
  globalProductCardStyle?: ProductStyle
}

export default function ProductCard({
  product,
  categoryId,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onCustomElementSelect,
  onCustomElementUpdate,
  onCustomElementDelete,
  selectedCustomElementId,
  globalProductCardStyle
}: ProductCardProps) {
  // Initialize product with default nested elements if not present
  useEffect(() => {
    if (!product.children || product.children.length === 0) {
      const defaultElements = createDefaultProductElements(product, globalProductCardStyle)
      onUpdate({ children: defaultElements })
    }
  }, [product.id, product.children, onUpdate, globalProductCardStyle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get filtered nested elements based on show/hide toggles
  const getVisibleElements = () => {
    if (!product.children) return []
    
    // Merge global style with product style, with defaults
    const mergedStyle = {
      showImage: true,
      showDescription: true,
      showPrice: true,
      ...globalProductCardStyle,
      ...product.style
    }
    
    return product.children
      .filter(element => {
        // Filter based on show/hide toggles
        if (element.type === 'product-image' && !mergedStyle.showImage) return false
        if (element.type === 'product-description' && !mergedStyle.showDescription) return false
        if (element.type === 'product-price' && !mergedStyle.showPrice) return false
        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const visibleElements = getVisibleElements()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: product.id,
    data: { type: 'product', categoryId }
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 9999 : 1,
    cursor: isDragging ? 'grabbing' : 'move',
    position: isDragging ? 'relative' : undefined,
    pointerEvents: isDragging ? 'none' : undefined
  } as React.CSSProperties

  // Build style object from product.style, merging with global style
  const buildStyleObject = () => {
    // Merge global style with product style, ensuring defaults
    const mergedStyle = {
      showImage: true,
      showDescription: true,
      showPrice: true,
      ...globalProductCardStyle,
      ...product.style
    }
    const style = mergedStyle
    const styleObj: React.CSSProperties = {}
    
    // Colors — default transparent card to match public menu over background image
    if (style.backgroundColor) styleObj.backgroundColor = style.backgroundColor
    else styleObj.backgroundColor = 'transparent'
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
    
    // Effects
    if (style.boxShadow) styleObj.boxShadow = style.boxShadow
    if (style.opacity) styleObj.opacity = style.opacity
    if (style.transition) styleObj.transition = style.transition
    
    // Merge with drag styles
    return { ...styleObj, ...dragStyle }
  }

  const productStyle = buildStyleObject()

  // Handle nested element updates that affect product data
  const handleCustomElementUpdate = (elementId: string, updates: Partial<CustomElement>) => {
    const element = product.children?.find(e => e.id === elementId)
    if (!element) return

    const updatedElement = { ...element, ...updates }
    const updatedChildren = product.children?.map(e => e.id === elementId ? updatedElement : e) || []
    
    // Update product data from element
    const productUpdates: Partial<ProductItem> = { children: updatedChildren }
    if (element.fieldData?.fieldType === 'name' && updates.content !== undefined) {
      productUpdates.name = updates.content
    } else if (element.fieldData?.fieldType === 'price' && updates.content !== undefined) {
      const price = parseFloat(updates.content)
      if (!isNaN(price)) {
        productUpdates.price = price
      }
    } else if (element.fieldData?.fieldType === 'description' && updates.content !== undefined) {
      productUpdates.description = updates.content
    } else if (element.fieldData?.fieldType === 'image' && updates.content !== undefined) {
      productUpdates.imageUrl = updates.content
    }
    // Availability is handled directly via checkbox, not through nested elements
    
    onUpdate(productUpdates)
    onCustomElementUpdate?.(elementId, updates)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...productStyle,
        ...dragStyle
      }}
      {...attributes}
      {...listeners}
      className={`border-2 rounded-lg cursor-pointer transition-all relative bg-transparent ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-gray-200/70 hover:border-gray-300'
      } ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-move'} ${
        !product.isAvailable ? 'opacity-60' : ''
      }`}
      onClick={(e) => {
        // Only select if not dragging
        if (!isDragging) {
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
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 z-10"
          title="Xóa sản phẩm"
        >
          ✕
        </button>
      )}
      <div className="flex items-start gap-2 mb-2">

        <div className="flex-1">
          {/* Render all nested elements (including product fields) */}
          <SortableContext
            items={visibleElements.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {visibleElements.map((element) => (
                <CustomElementComponent
                  key={element.id}
                  element={element}
                  isSelected={selectedCustomElementId === element.id}
                  isMultiSelected={false}
                  onSelect={(e) => {
                    e.stopPropagation()
                    onCustomElementSelect?.(element.id, e)
                  }}
                  onUpdate={(updates) => handleCustomElementUpdate(element.id, updates)}
                  onDelete={() => {
                    // Don't allow deleting product field elements
                    if (!element.fieldData) {
                      onCustomElementDelete?.(element.id)
                    }
                  }}
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
                            parentType: 'product'
                          }
                          return { ...e, children: [...(e.children || []), newElement] }
                        }
                        if (e.children && e.children.length > 0) {
                          return { ...e, children: addChildRecursive(e.children) }
                        }
                        return e
                      })
                    }
                    
                    const updatedChildren = addChildRecursive(product.children || [])
                    onUpdate({ children: updatedChildren })
                  }}
                />
              ))}
            </div>
          </SortableContext>

          {/* Availability checkbox - not a nested element */}
          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.isAvailable}
                onChange={(e) => {
                  e.stopPropagation()
                  onUpdate({ isAvailable: e.target.checked })
                }}
                className="w-4 h-4 text-green-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-gray-600">
                {product.isAvailable ? 'Có sẵn' : 'Hết hàng'}
              </span>
            </label>
          </div>

          {/* Add nested element button - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newElement: CustomElement = {
                id: `nested-${Date.now()}-${Math.random()}`,
                type: 'text',
                content: 'Nội dung mới',
                style: {},
                sortOrder: (product.children?.length || 0),
                parentId: product.id,
                parentType: 'product'
              }
              onUpdate({
                children: [...(product.children || []), newElement]
              })
            }}
            className="mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            + Thêm element con
          </button>
        </div>
      </div>
    </div>
  )
}
