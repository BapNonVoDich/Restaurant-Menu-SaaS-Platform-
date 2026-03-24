'use client'

import Image from 'next/image'
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
  onDelete?: () => void
  activeDragId?: string | null
  onCustomElementSelect?: (elementId: string, e?: React.MouseEvent) => void
  onCustomElementUpdate?: (elementId: string, updates: Partial<CustomElement>) => void
  onCustomElementDelete?: (elementId: string) => void
  selectedCustomElementId?: string | null
  onAddChild?: (parentId: string) => void
}

export default function CustomElementComponent({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
  onDelete,
  activeDragId,
  onCustomElementSelect,
  onCustomElementUpdate,
  onCustomElementDelete,
  selectedCustomElementId,
  onAddChild
}: CustomElementComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: element.id, data: { type: 'custom' } })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 9999 : 1,
    cursor: isDragging ? 'grabbing' : 'move',
    position: isDragging ? 'relative' : undefined,
    pointerEvents: isDragging ? 'none' : undefined
  } as React.CSSProperties

  const buildStyleObject = () => {
    const style = element.style
    const styleObj: React.CSSProperties = {}
    
    // Background - prioritize element style
    if (style.backgroundColor) {
      styleObj.backgroundColor = style.backgroundColor
    }
    if (style.backgroundImage) {
      styleObj.backgroundImage = `url(${style.backgroundImage})`
    }
    if (style.backgroundSize) styleObj.backgroundSize = style.backgroundSize
    if (style.backgroundPosition) styleObj.backgroundPosition = style.backgroundPosition
    
    // Colors
    if (style.textColor) {
      styleObj.color = style.textColor
    }
    
    // Typography
    if (style.fontFamily) styleObj.fontFamily = style.fontFamily
    if (style.fontSize) styleObj.fontSize = style.fontSize
    if (style.fontWeight) styleObj.fontWeight = style.fontWeight as any
    if (style.lineHeight) styleObj.lineHeight = style.lineHeight
    if (style.textAlign) styleObj.textAlign = style.textAlign as any
    if (style.textDecoration) styleObj.textDecoration = style.textDecoration as any
    if (style.textTransform) styleObj.textTransform = style.textTransform as any
    if (style.letterSpacing) styleObj.letterSpacing = style.letterSpacing
    
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
    if (style.position) styleObj.position = style.position as any
    
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
    if (style.zIndex) styleObj.zIndex = style.zIndex as any

    const hasBg = !!(style.backgroundColor || style.backgroundImage)
    const skipTransparentBg =
      element.type === 'divider' ||
      element.type === 'image' ||
      element.type === 'product-image' ||
      element.type === 'button'
    if (!hasBg && !skipTransparentBg) {
      styleObj.backgroundColor = styleObj.backgroundColor || 'transparent'
    }

    return styleObj
  }

  const renderElement = () => {
    const styleObj = buildStyleObject()
    
    // Render based on element type
    switch (element.type) {
      case 'text':
        return (
          <div style={styleObj} className="min-h-[30px]">
            {element.content || 'Text content'}
          </div>
        )
      case 'image':
        return element.content ? (
          <Image
            src={element.content}
            alt="Custom"
            width={800}
            height={600}
            style={styleObj}
            className="max-w-full h-auto w-auto"
            unoptimized
          />
        ) : null
      case 'button':
        return (
          <button style={styleObj} className="px-4 py-2 rounded">
            {element.content || 'Button'}
          </button>
        )
      case 'divider':
        return <hr style={styleObj} className="my-4" />
      case 'product-name':
        return (
          <div style={styleObj} className="min-h-[30px] font-semibold">
            {element.content || 'Tên sản phẩm'}
          </div>
        )
      case 'product-price':
        return (
          <div style={styleObj} className="min-h-[30px] font-bold">
            {element.content ? `${parseFloat(element.content).toLocaleString('vi-VN')} đ` : '0 đ'}
          </div>
        )
      case 'product-description':
        return (
          <div style={styleObj} className="min-h-[30px]">
            {element.content || 'Mô tả sản phẩm'}
          </div>
        )
      case 'product-image':
        return element.content ? (
          <Image
            src={element.content}
            alt="Product"
            width={800}
            height={600}
            style={styleObj}
            className="max-w-full h-auto w-auto"
            unoptimized
          />
        ) : (
          <div style={styleObj} className="min-h-[100px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Không có hình ảnh
          </div>
        )
      case 'custom':
      default:
        // Container element - render children
        return (
          <div style={styleObj} className="min-h-[50px] relative">
            {(!element.children || element.children.length === 0) && (
              <div className="text-gray-400 text-sm italic p-4 text-center">
                Nhấp vào &quot;Thêm element con&quot; để thêm nội dung
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
      className={`border-2 rounded-lg p-4 transition-all relative bg-transparent ${
        isSelected || isMultiSelected || activeDragId === element.id
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200/70 hover:border-gray-300'
      } ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-move'}`}
      onClick={onSelect}
    >
      {/* Don't show delete button for product fields */}
      {isSelected && onDelete && !element.fieldData && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
          title="Xóa element"
        >
          ✕
        </button>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase">
          {element.type.startsWith('product-') 
            ? `Thông tin sản phẩm (${element.type.replace('product-', '')})`
            : `Element tùy chỉnh (${element.type})`}
        </span>
        {isSelected && element.type === 'custom' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newElement: CustomElement = {
                id: `custom-${Date.now()}-${Math.random()}`,
                type: 'text',
                content: 'Nội dung mới',
                style: {},
                sortOrder: (element.children?.length || 0),
                parentId: element.id,
                parentType: 'custom'
              }
              onUpdate({
                children: [...(element.children || []), newElement]
              })
            }}
            className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            + Thêm element con
          </button>
        )}
      </div>
      <div className="relative">
        {renderElement()}
        {/* Render nested custom elements inside the container */}
        {element.children && element.children.length > 0 && (
          <div className="mt-2 space-y-2">
            <SortableContext
              items={element.children.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
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
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  )
}
