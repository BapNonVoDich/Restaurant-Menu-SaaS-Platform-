// Base component for all draggable elements with common functionality
'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BaseDraggableElementProps {
  id: string
  isSelected: boolean
  onSelect: (e: React.MouseEvent) => void
  onDelete?: () => void
  children: ReactNode
  dragData?: any
  className?: string
  style?: React.CSSProperties
  showDragHandle?: boolean
  disabled?: boolean
}

export default function BaseDraggableElement({
  id,
  isSelected,
  onSelect,
  onDelete,
  children,
  dragData,
  className = '',
  style = {},
  showDragHandle = false,
  disabled = false
}: BaseDraggableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    data: dragData || { id }
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      className={`relative border-2 rounded-lg transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-transparent hover:border-gray-300'
      } ${isDragging ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-move'} ${className}`}
      onClick={onSelect}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
    >
      {/* Delete button */}
      {isSelected && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-20 shadow-lg"
          title="Xóa"
        >
          ✕
        </button>
      )}

      {/* Drag handle */}
      {showDragHandle && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 z-10 bg-white rounded p-1 shadow-sm border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          title="Kéo để sắp xếp"
        >
          <span className="text-xs">⋮⋮</span>
        </div>
      )}

      <div className={showDragHandle && !disabled ? 'ml-6' : ''}>
        {children}
      </div>
    </div>
  )
}
