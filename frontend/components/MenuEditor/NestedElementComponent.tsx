'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CustomElement } from '@/lib/menuEditor/types'

interface CustomElementComponentProps {
  element: CustomElement
  isSelected: boolean
  isMultiSelected: boolean
  onSelect: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<CustomElement>) => void
  onDelete: () => void
  onCustomElementSelect?: (elementId: string, e?: React.MouseEvent) => void
  onCustomElementUpdate?: (elementId: string, updates: Partial<CustomElement>) => void
  onCustomElementDelete?: (elementId: string) => void
  onAddChild?: (parentId: string) => void
  selectedCustomElementId?: string | null
}

export default function CustomElementComponent({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
  onDelete,
  onCustomElementSelect,
  onCustomElementUpdate,
  onCustomElementDelete,
  onAddChild,
  selectedCustomElementId
}: CustomElementComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(element.content)

  // All nested elements should be sortable
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: element.id,
    data: { type: 'nested-element', parentId: element.parentId, parentType: element.parentType }
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // No transition while dragging for smoother feel
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 9999 : 1,
    scale: isDragging ? 1.05 : 1
  }

  useEffect(() => {
    setEditContent(element.content)
  }, [element.content])

  const buildStyleObject = () => {
    const style = element.style
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
    
    // Effects
    if (style.boxShadow) styleObj.boxShadow = style.boxShadow
    if (style.opacity) styleObj.opacity = style.opacity
    if (style.transform) styleObj.transform = style.transform
    
    return styleObj
  }

  const styleObj = buildStyleObject()

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <div style={styleObj}>
            <p>{element.content}</p>
          </div>
        )
      
      case 'image':
        return (
          <div style={styleObj}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={element.content}
              alt="Nested"
              className="max-w-full h-auto rounded-lg"
              style={{
                borderRadius: element.style.borderRadius || '8px'
              }}
            />
          </div>
        )
      
      case 'divider':
        return (
          <div
            className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"
            style={styleObj}
          />
        )
      
      case 'button':
        return (
          <button
            style={styleObj}
            className="px-4 py-2 rounded-md transition"
          >
            {element.content}
          </button>
        )
      
      case 'custom':
        // Custom element is a container that can have children
        // Children will be rendered by parent component using SortableContext
        return (
          <div style={styleObj} className="min-h-[50px] relative">
            {(!element.children || element.children.length === 0) && (
              <div className="text-gray-400 text-sm italic p-4 text-center">
                Nhấp vào &quot;Thêm element con&quot; để thêm nội dung
              </div>
            )}
          </div>
        )
      
      // Product field types - these are editable inline
      case 'product-name':
        return (
          <div style={styleObj} className="inline-block w-full">
            {isEditing ? (
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={() => {
                  onUpdate({ content: editContent })
                  setIsEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdate({ content: editContent })
                    setIsEditing(false)
                  } else if (e.key === 'Escape') {
                    setEditContent(element.content)
                    setIsEditing(false)
                  }
                }}
                className="w-full font-semibold text-gray-900 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3
                className="font-semibold text-gray-900 cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                {element.content}
              </h3>
            )}
          </div>
        )
      
      case 'product-price':
        return (
          <div style={styleObj} className="inline-block">
            {isEditing ? (
              <input
                type="number"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={() => {
                  const price = parseFloat(editContent)
                  if (!isNaN(price)) {
                    onUpdate({ content: price.toString() })
                  } else {
                    setEditContent(element.content)
                  }
                  setIsEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const price = parseFloat(editContent)
                    if (!isNaN(price)) {
                      onUpdate({ content: price.toString() })
                    }
                    setIsEditing(false)
                  } else if (e.key === 'Escape') {
                    setEditContent(element.content)
                    setIsEditing(false)
                  }
                }}
                className="font-bold text-blue-600 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="font-bold text-blue-600 cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                {parseFloat(element.content || '0').toLocaleString('vi-VN')} VNĐ
              </span>
            )}
          </div>
        )
      
      case 'product-description':
        return (
          <div style={styleObj} className="inline-block w-full">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={() => {
                  onUpdate({ content: editContent })
                  setIsEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditContent(element.content)
                    setIsEditing(false)
                  }
                }}
                className="w-full text-sm text-gray-600 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                rows={2}
              />
            ) : (
              <p
                className="text-sm text-gray-600 cursor-text"
                onDoubleClick={() => setIsEditing(true)}
              >
                {element.content}
              </p>
            )}
          </div>
        )
      
      case 'product-image':
        return (
          <div style={styleObj} className="inline-block w-full">
            {isEditing ? (
              <input
                type="url"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={() => {
                  onUpdate({ content: editContent })
                  setIsEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdate({ content: editContent })
                    setIsEditing(false)
                  } else if (e.key === 'Escape') {
                    setEditContent(element.content)
                    setIsEditing(false)
                  }
                }}
                className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
                placeholder="URL hình ảnh"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={element.content}
                  alt="Product"
                  className="max-w-full h-auto rounded-lg cursor-pointer"
                  style={{
                    borderRadius: element.style.borderRadius || '8px',
                    width: element.style.width || '100%',
                    height: element.style.height || 'auto',
                    objectFit: 'cover'
                  }}
                  onDoubleClick={() => setIsEditing(true)}
                />
                {!element.content && (
                  <div
                    className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300"
                    onDoubleClick={() => setIsEditing(true)}
                  >
                    <span className="text-gray-400">Double click để thêm URL hình ảnh</span>
                  </div>
                )}
              </>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div
      ref={setSortableRef}
      style={dragStyle}
      className={`relative border-2 rounded-lg transition-all ${
        isSelected || isMultiSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-transparent hover:border-gray-300'
      } ${isDragging ? 'cursor-grabbing z-50 shadow-2xl' : 'cursor-grab'}`}
      onClick={onSelect}
    >
      {/* Drag handle - always visible, larger and more prominent */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 hover:bg-gray-50 z-10 bg-white rounded-md p-1.5 shadow-md border border-gray-200 transition-all"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        title="Kéo để sắp xếp"
      >
        <span className="text-sm font-bold">⋮⋮</span>
      </div>
      <div className="ml-6">
        {renderElement()}
        {/* Render children for custom elements */}
        {element.type === 'custom' && (
          <>
            {element.children && element.children.length > 0 && (
              <SortableContext
                items={element.children.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-2 space-y-2">
                  {element.children
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((child) => (
                      <CustomElementComponent
                        key={child.id}
                        element={child}
                        isSelected={selectedCustomElementId === child.id}
                        isMultiSelected={false}
                        onSelect={(e) => {
                          e.stopPropagation()
                          onCustomElementSelect?.(child.id, e)
                        }}
                        onUpdate={(updates) => onCustomElementUpdate?.(child.id, updates)}
                        onDelete={() => onCustomElementDelete?.(child.id)}
                        onCustomElementSelect={onCustomElementSelect}
                        onCustomElementUpdate={onCustomElementUpdate}
                        onCustomElementDelete={onCustomElementDelete}
                        selectedCustomElementId={selectedCustomElementId}
                        onAddChild={onAddChild}
                      />
                    ))}
                </div>
              </SortableContext>
            )}
            {/* Add nested element button for custom elements */}
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild?.(element.id)
                }}
                className="mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
              >
                + Thêm element con
              </button>
            )}
          </>
        )}
      </div>
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
        >
          ✕
        </button>
      )}
    </div>
  )
}
