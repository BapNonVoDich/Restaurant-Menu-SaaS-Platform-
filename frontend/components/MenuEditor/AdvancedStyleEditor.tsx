'use client'

import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import NumberInput from './NumberInput'

interface AdvancedStyleEditorProps {
  style: any
  onUpdate: (updates: any) => void
  title: string
}

export default function AdvancedStyleEditor({ style, onUpdate, title }: AdvancedStyleEditorProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'spacing' | 'border' | 'typography' | 'layout' | 'effects'>('colors')
  const [colorPicker, setColorPicker] = useState<{ field: string; value: string } | null>(null)

  const updateStyle = (field: string, value: string) => {
    const updates: any = { [field]: value }
    
    // If setting padding/margin "all", clear individual values
    if (field === 'padding' && value) {
      updates.paddingTop = undefined
      updates.paddingRight = undefined
      updates.paddingBottom = undefined
      updates.paddingLeft = undefined
    } else if (field === 'margin' && value) {
      updates.marginTop = undefined
      updates.marginRight = undefined
      updates.marginBottom = undefined
      updates.marginLeft = undefined
    }
    
    // If setting individual padding/margin, clear "all" value
    if (field.startsWith('padding') && field !== 'padding') {
      updates.padding = undefined
    } else if (field.startsWith('margin') && field !== 'margin') {
      updates.margin = undefined
    }
    
    // If setting border "all", clear individual border values
    if (field === 'border' && value) {
      updates.borderWidth = undefined
      updates.borderStyle = undefined
      updates.borderColor = undefined
      updates.borderTop = undefined
      updates.borderRight = undefined
      updates.borderBottom = undefined
      updates.borderLeft = undefined
    }
    
    // If setting individual border properties, clear "all" border
    if (field.startsWith('border') && field !== 'border' && field !== 'borderRadius') {
      updates.border = undefined
    }
    
    onUpdate(updates)
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        {(['colors', 'spacing', 'border', 'typography', 'layout', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs rounded-t-md transition flex-shrink-0 ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'colors' && '🎨 Màu sắc'}
            {tab === 'spacing' && '📏 Khoảng cách'}
            {tab === 'border' && '🔲 Viền'}
            {tab === 'typography' && '✍️ Chữ'}
            {tab === 'layout' && '📐 Bố cục'}
            {tab === 'effects' && '✨ Hiệu ứng'}
          </button>
        ))}
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-3">
          <ColorField
            label="Màu nền"
            value={style.backgroundColor || ''}
            onChange={(val) => updateStyle('backgroundColor', val)}
            onColorPicker={(val) => setColorPicker({ field: 'backgroundColor', value: val })}
          />
          <ColorField
            label="Màu chữ"
            value={style.textColor || ''}
            onChange={(val) => updateStyle('textColor', val)}
            onColorPicker={(val) => setColorPicker({ field: 'textColor', value: val })}
          />
          <ColorField
            label="Màu viền"
            value={style.borderColor || ''}
            onChange={(val) => updateStyle('borderColor', val)}
            onColorPicker={(val) => setColorPicker({ field: 'borderColor', value: val })}
          />
          {style.backgroundImage !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình nền (URL)</label>
              <input
                type="url"
                value={style.backgroundImage || ''}
                onChange={(e) => updateStyle('backgroundImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </div>
      )}

      {/* Spacing Tab */}
      {activeTab === 'spacing' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Padding (tất cả)</label>
              <NumberInput
                value={style.padding || '0px'}
                onChange={(val) => updateStyle('padding', val)}
                placeholder="0px"
              />
              <p className="text-xs text-gray-500 mt-1">Đặt giá trị này sẽ ghi đè các giá trị chi tiết</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margin (tất cả)</label>
              <NumberInput
                value={style.margin || '0px'}
                onChange={(val) => updateStyle('margin', val)}
                placeholder="0px"
              />
              <p className="text-xs text-gray-500 mt-1">Đặt giá trị này sẽ ghi đè các giá trị chi tiết</p>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Chi tiết Padding:</p>
            <div className="grid grid-cols-2 gap-2">
              <SpacingField label="Top" value={style.paddingTop || '0px'} onChange={(val) => updateStyle('paddingTop', val)} />
              <SpacingField label="Right" value={style.paddingRight || '0px'} onChange={(val) => updateStyle('paddingRight', val)} />
              <SpacingField label="Bottom" value={style.paddingBottom || '0px'} onChange={(val) => updateStyle('paddingBottom', val)} />
              <SpacingField label="Left" value={style.paddingLeft || '0px'} onChange={(val) => updateStyle('paddingLeft', val)} />
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Chi tiết Margin:</p>
            <div className="grid grid-cols-2 gap-2">
              <SpacingField label="Top" value={style.marginTop || '0px'} onChange={(val) => updateStyle('marginTop', val)} />
              <SpacingField label="Right" value={style.marginRight || '0px'} onChange={(val) => updateStyle('marginRight', val)} />
              <SpacingField label="Bottom" value={style.marginBottom || '0px'} onChange={(val) => updateStyle('marginBottom', val)} />
              <SpacingField label="Left" value={style.marginLeft || '0px'} onChange={(val) => updateStyle('marginLeft', val)} />
            </div>
          </div>
        </div>
      )}

      {/* Border Tab */}
      {activeTab === 'border' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Border (tất cả)</label>
            <input
              type="text"
              value={style.border || ''}
              onChange={(e) => updateStyle('border', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="1px solid #000"
            />
            <p className="text-xs text-gray-500 mt-1">Đặt giá trị này sẽ ghi đè các giá trị chi tiết</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <NumberInput
                value={style.borderWidth || '0px'}
                onChange={(val) => updateStyle('borderWidth', val)}
                placeholder="0px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
              <select
                value={style.borderStyle || 'none'}
                onChange={(e) => updateStyle('borderStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
            <NumberInput
              value={style.borderRadius || '0px'}
              onChange={(val) => updateStyle('borderRadius', val)}
              placeholder="0px"
            />
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Từng cạnh:</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={style.borderTop || ''}
                onChange={(e) => updateStyle('borderTop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Top"
              />
              <input
                type="text"
                value={style.borderRight || ''}
                onChange={(e) => updateStyle('borderRight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Right"
              />
              <input
                type="text"
                value={style.borderBottom || ''}
                onChange={(e) => updateStyle('borderBottom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Bottom"
              />
              <input
                type="text"
                value={style.borderLeft || ''}
                onChange={(e) => updateStyle('borderLeft', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Left"
              />
            </div>
          </div>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
            <select
              value={style.fontFamily || ''}
              onChange={(e) => updateStyle('fontFamily', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Inherit</option>
              <option value="system-ui, -apple-system, sans-serif">System</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <NumberInput
                value={style.fontSize || '16px'}
                onChange={(val) => updateStyle('fontSize', val)}
                placeholder="16px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
              <select
                value={style.fontWeight || ''}
                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Normal</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Line Height</label>
            <NumberInput
              value={style.lineHeight || '1.5'}
              onChange={(val) => updateStyle('lineHeight', val)}
              placeholder="1.5"
              allowSpecialValues={true}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
            <select
              value={style.textAlign || 'left'}
              onChange={(e) => updateStyle('textAlign', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Decoration</label>
              <select
                value={style.textDecoration || 'none'}
                onChange={(e) => updateStyle('textDecoration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Line Through</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Transform</label>
              <select
                value={style.textTransform || 'none'}
                onChange={(e) => updateStyle('textTransform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Letter Spacing</label>
            <NumberInput
              value={style.letterSpacing || '0px'}
              onChange={(val) => updateStyle('letterSpacing', val)}
              placeholder="0px"
            />
          </div>
        </div>
      )}

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display</label>
            <select
              value={style.display || 'block'}
              onChange={(e) => updateStyle('display', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="block">Block</option>
              <option value="inline">Inline</option>
              <option value="inline-block">Inline Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
              <option value="none">None</option>
            </select>
          </div>
          {style.display === 'flex' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flex Direction</label>
                <select
                  value={style.flexDirection || 'row'}
                  onChange={(e) => updateStyle('flexDirection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                  <option value="row-reverse">Row Reverse</option>
                  <option value="column-reverse">Column Reverse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justify Content</label>
                <select
                  value={style.justifyContent || 'flex-start'}
                  onChange={(e) => updateStyle('justifyContent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="flex-start">Flex Start</option>
                  <option value="flex-end">Flex End</option>
                  <option value="center">Center</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                  <option value="space-evenly">Space Evenly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Align Items</label>
                <select
                  value={style.alignItems || 'stretch'}
                  onChange={(e) => updateStyle('alignItems', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="flex-start">Flex Start</option>
                  <option value="flex-end">Flex End</option>
                  <option value="center">Center</option>
                  <option value="stretch">Stretch</option>
                  <option value="baseline">Baseline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gap</label>
                <NumberInput
                  value={style.gap || '0px'}
                  onChange={(val) => updateStyle('gap', val)}
                  placeholder="0px"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={style.position || 'static'}
              onChange={(e) => updateStyle('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="static">Static</option>
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
              <option value="sticky">Sticky</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <NumberInput
                value={style.width || 'auto'}
                onChange={(val) => updateStyle('width', val)}
                placeholder="auto"
                allowSpecialValues={true}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <NumberInput
                value={style.height || 'auto'}
                onChange={(val) => updateStyle('height', val)}
                placeholder="auto"
                allowSpecialValues={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Box Shadow</label>
            <input
              type="text"
              value={style.boxShadow || ''}
              onChange={(e) => updateStyle('boxShadow', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="0 2px 4px rgba(0,0,0,0.1)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={style.opacity || '1'}
              onChange={(e) => updateStyle('opacity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transform</label>
            <input
              type="text"
              value={style.transform || ''}
              onChange={(e) => updateStyle('transform', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="scale(1.1) rotate(5deg)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transition</label>
            <input
              type="text"
              value={style.transition || ''}
              onChange={(e) => updateStyle('transition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="all 0.3s ease"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Z-Index</label>
            <input
              type="number"
              value={style.zIndex || ''}
              onChange={(e) => updateStyle('zIndex', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {colorPicker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setColorPicker(null)}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <HexColorPicker
                color={colorPicker.value || '#000000'}
                onChange={(color) => {
                  updateStyle(colorPicker.field, color)
                  setColorPicker({ ...colorPicker, value: color })
                }}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorPicker.value || ''}
                onChange={(e) => {
                  updateStyle(colorPicker.field, e.target.value)
                  setColorPicker({ ...colorPicker, value: e.target.value })
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="#000000"
              />
              <button
                onClick={() => setColorPicker(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
  onColorPicker
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onColorPicker: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 border-2 border-gray-300 rounded cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value || '#ffffff' }}
          onClick={() => onColorPicker(value || '#ffffff')}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

function SpacingField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <NumberInput
        value={value}
        onChange={onChange}
        placeholder="0"
        className="w-full"
      />
    </div>
  )
}
