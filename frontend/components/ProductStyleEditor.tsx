'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryItem, CustomizationSettings, ProductItem, ProductStyle } from '@/lib/menuEditor/types'
import { generateMenuHTML } from '@/lib/menuEditor/menuGenerator'
import { parseProductStyleJson, serializeProductStyle } from '@/lib/menuEditor/styleJson'
import { StyleNumberStepper, StyleSection, StyleToggleGroup, StyleUnitStepper } from '@/components/style/StyleControls'

const PRODUCT_STYLE_PRESETS: Array<{
  id: string
  label: string
  style: Partial<ProductStyle>
}> = [
  {
    id: 'compact',
    label: 'Gọn nhẹ',
    style: {
      cardLayout: 'minimal',
      showImage: false,
      showDescription: false,
      showPrice: true,
      fontSize: '1rem',
      fontWeight: '600',
      borderRadius: '8px',
      backgroundColor: 'rgba(255,255,255,0.45)',
      boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'balanced',
    label: 'Cân bằng',
    style: {
      cardLayout: 'detailed',
      showImage: true,
      showDescription: true,
      showPrice: true,
      fontSize: '1.1rem',
      fontWeight: '650',
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.58)',
      boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
    },
  },
  {
    id: 'image-focus',
    label: 'Ưu tiên ảnh',
    style: {
      cardLayout: 'image-focused',
      showImage: true,
      showDescription: false,
      showPrice: true,
      fontSize: '1rem',
      fontWeight: '700',
      borderRadius: '14px',
      backgroundColor: 'rgba(255,255,255,0.68)',
      boxShadow: '0 12px 30px rgba(15,23,42,0.16)',
    },
  },
]

const PREVIEW_CUSTOMIZATION: CustomizationSettings = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  theme: 'light',
  globalFontFamily: 'system-ui, -apple-system, sans-serif',
  globalTextColor: '#1f2937',
  globalBackgroundColor: '#e5e7eb',
  globalSpacing: '16px',
}

export interface ProductStylePreviewSample {
  name: string
  price: number
  description: string
  imageUrl?: string
}

function parseBoxShadow(raw?: string) {
  const fallback = { x: 0, y: 2, blur: 8, spread: 0, opacity: 0.08 }
  if (!raw) return fallback
  const m = raw.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px(?:\s+(-?\d+)px)?\s+rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/i)
  if (!m) return fallback
  return {
    x: Number(m[1]),
    y: Number(m[2]),
    blur: Number(m[3]),
    spread: Number(m[4] || 0),
    opacity: Number(m[8]),
  }
}

function buildBoxShadow(x: number, y: number, blur: number, spread: number, opacity: number) {
  const o = Math.max(0, Math.min(1, opacity))
  return `${x}px ${y}px ${blur}px ${spread}px rgba(0,0,0,${o.toFixed(2)})`
}

function buildPreviewProduct(style: Partial<ProductStyle>, sample: ProductStylePreviewSample): ProductItem {
  return {
    id: 'preview-product',
    name: sample.name,
    description: sample.description,
    price: sample.price,
    imageUrl: sample.imageUrl,
    isAvailable: true,
    sortOrder: 0,
    categoryIds: ['preview-category'],
    style: { ...style },
  }
}

export default function ProductStyleEditor({
  valueJson,
  onJsonChange,
  previewSample,
  previewContext,
  /** Nếu true, ẩn hoàn toàn khối JSON (ví dụ màn hình rất gọn). Mặc định: hiện trong mục đóng sẵn. */
  hideAdvancedJson = false,
}: {
  valueJson: string
  onJsonChange: (json: string) => void
  previewSample?: ProductStylePreviewSample
  previewContext?: {
    categories?: CategoryItem[]
    highlightProductId?: string
  }
  hideAdvancedJson?: boolean
}) {
  const [style, setStyle] = useState<Partial<ProductStyle>>(() => parseProductStyleJson(valueJson))
  const [jsonDraft, setJsonDraft] = useState(valueJson)
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    const parsed = parseProductStyleJson(valueJson)
    setStyle(parsed)
    setJsonDraft(valueJson)
    setJsonError(null)
  }, [valueJson])

  const notifyChange = useCallback(
    (next: Partial<ProductStyle>) => {
      setStyle(next)
      onJsonChange(serializeProductStyle(next))
      setJsonDraft(serializeProductStyle(next))
      setJsonError(null)
    },
    [onJsonChange]
  )

  const patch = (p: Partial<ProductStyle>) => {
    notifyChange({ ...style, ...p })
  }

  const previewHtml = useMemo(() => {
    const sample: ProductStylePreviewSample = previewSample || {
      name: 'Món mẫu',
      price: 45000,
      description: 'Mô tả mẫu để xem trước style trên menu.',
      imageUrl: undefined,
    }
    const categories =
      previewContext?.categories && previewContext.categories.length > 0
        ? previewContext.categories.map((cat) => ({
            ...cat,
            products: (cat.products || []).map((p) =>
              p.id === previewContext.highlightProductId ? { ...p, style: { ...p.style, ...style } } : p
            ),
          }))
        : [
            {
              id: 'preview-category',
              name: 'Danh mục mẫu',
              sortOrder: 0,
              products: [buildPreviewProduct(style, sample)],
              style: { layout: 'grid', columns: 1 },
            } as CategoryItem,
          ]

    const html = generateMenuHTML(categories, [], PREVIEW_CUSTOMIZATION, 'Xem trước menu', undefined, false)
    const target = previewContext?.highlightProductId
      ? `.product-card[data-product-id="${previewContext.highlightProductId}"]`
      : '.product-card:first-of-type'
    const previewHighlightCss = `
      ${target} {
        position: relative;
        outline: 2px dashed #16a34a;
        outline-offset: 6px;
        margin-top: 24px;
      }
      ${target}::before {
        content: 'Sản phẩm đang được preview style';
        position: absolute;
        top: -26px;
        left: 0;
        font-size: 11px;
        font-weight: 700;
        color: #166534;
        background: #dcfce7;
        border: 1px solid #86efac;
        border-radius: 999px;
        padding: 2px 8px;
      }
    `
    return html.replace('</style>', `${previewHighlightCss}</style>`)
  }, [style, previewSample, previewContext])

  const applyJsonDraft = () => {
    const trimmed = jsonDraft.trim()
    if (!trimmed) {
      notifyChange({})
      return
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setJsonError('JSON phải là object')
        return
      }
      notifyChange(parsed as Partial<ProductStyle>)
    } catch {
      setJsonError('JSON không hợp lệ')
    }
  }

  const showImage = style.showImage !== false
  const showDescription = style.showDescription !== false
  const showPrice = style.showPrice !== false
  const [previewScale, setPreviewScale] = useState<'desktop' | 'mobile'>('desktop')
  const cardLayout = style.cardLayout || 'detailed'

  const shadow = parseBoxShadow(style.boxShadow)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <StyleSection title="Preset nhanh" description="Chọn nhanh phong cách phổ biến rồi tinh chỉnh thêm.">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-background-muted text-text"
                onClick={() => notifyChange({ ...preset.style })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </StyleSection>

        <StyleSection title="Bố cục thẻ sản phẩm" description="Chọn phong cách hiển thị và bật/tắt thành phần.">
          <StyleToggleGroup
            label="Kiểu thẻ"
            value={cardLayout}
            options={[
              { value: 'minimal', label: 'Tối giản' },
              { value: 'detailed', label: 'Chi tiết' },
              { value: 'image-focused', label: 'Ưu tiên ảnh' },
            ]}
            onChange={(v) => patch({ cardLayout: v })}
          />
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={showImage}
                onChange={(e) => patch({ showImage: e.target.checked })}
              />
              <span className="text-sm text-text">Hiện ảnh sản phẩm (khi có URL)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={showDescription}
                onChange={(e) => patch({ showDescription: e.target.checked })}
              />
              <span className="text-sm text-text">Hiện mô tả</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={showPrice}
                onChange={(e) => patch({ showPrice: e.target.checked })}
              />
              <span className="text-sm text-text">Hiện giá</span>
            </label>
          </div>
        </StyleSection>

        <StyleSection title="Typography & Colors" description="Tùy chỉnh chữ, màu và bóng đổ.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StyleUnitStepper
            label="Cỡ chữ"
            rawValue={style.fontSize}
            fallbackValue={1}
            fallbackUnit="rem"
            min={0.5}
            max={4}
            step={0.1}
            onChange={(v) => patch({ fontSize: v })}
          />
          <StyleNumberStepper
            label="Độ đậm chữ"
            value={Number(style.fontWeight || 600)}
            min={100}
            max={900}
            step={100}
            onChange={(v) => patch({ fontWeight: String(v) })}
          />
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Màu chữ</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                value={style.textColor?.startsWith('#') && style.textColor.length >= 4 ? style.textColor : '#111827'}
                onChange={(e) => patch({ textColor: e.target.value })}
              />
              <input
                type="text"
                className="input-field text-sm flex-1"
                value={style.textColor ?? ''}
                onChange={(e) => patch({ textColor: e.target.value || undefined })}
                placeholder="#111827"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nền thẻ (tùy chọn)</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                value={
                  style.backgroundColor?.startsWith('#') && style.backgroundColor.length >= 4
                    ? style.backgroundColor
                    : '#ffffff'
                }
                onChange={(e) => patch({ backgroundColor: e.target.value })}
              />
              <input
                type="text"
                className="input-field text-sm flex-1"
                value={style.backgroundColor ?? ''}
                onChange={(e) => patch({ backgroundColor: e.target.value || undefined })}
                placeholder="transparent hoặc #fff"
              />
            </div>
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StyleNumberStepper label="Shadow X" value={shadow.x} min={-20} max={20} onChange={(v) => patch({ boxShadow: buildBoxShadow(v, shadow.y, shadow.blur, shadow.spread, shadow.opacity) })} />
            <StyleNumberStepper label="Shadow Y" value={shadow.y} min={-20} max={40} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, v, shadow.blur, shadow.spread, shadow.opacity) })} />
            <StyleNumberStepper label="Blur" value={shadow.blur} min={0} max={60} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, v, shadow.spread, shadow.opacity) })} />
            <StyleNumberStepper label="Spread" value={shadow.spread} min={-20} max={30} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, shadow.blur, v, shadow.opacity) })} />
            <StyleNumberStepper label="Opacity (%)" value={Math.round(shadow.opacity * 100)} min={0} max={100} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, shadow.blur, shadow.spread, v / 100) })} />
          </div>
          </div>
        </StyleSection>

        <StyleSection title="Khoảng cách & kích thước" description="Padding, margin, bo góc, width/height.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StyleUnitStepper
              label="Padding"
              rawValue={style.padding}
              fallbackValue={12}
              min={0}
              step={2}
              onChange={(v) => patch({ padding: v })}
            />
            <StyleUnitStepper
              label="Margin dưới"
              rawValue={style.marginBottom}
              fallbackValue={8}
              min={0}
              step={2}
              onChange={(v) => patch({ marginBottom: v })}
            />
            <StyleUnitStepper
              label="Bo góc"
              rawValue={style.borderRadius}
              fallbackValue={10}
              min={0}
              step={1}
              onChange={(v) => patch({ borderRadius: v })}
            />
            <StyleUnitStepper
              label="Khoảng cách phần tử"
              rawValue={style.gap}
              fallbackValue={8}
              min={0}
              step={1}
              onChange={(v) => patch({ gap: v })}
            />
            <StyleUnitStepper
              label="Chiều rộng"
              rawValue={style.width}
              fallbackValue={100}
              fallbackUnit="%"
              min={10}
              step={5}
              onChange={(v) => patch({ width: v })}
            />
            <StyleUnitStepper
              label="Chiều cao tối thiểu"
              rawValue={style.minHeight}
              fallbackValue={0}
              min={0}
              step={4}
              onChange={(v) => patch({ minHeight: v })}
            />
            <StyleNumberStepper
              label="Opacity (%)"
              value={Math.round((parseFloat(style.opacity || '1') || 1) * 100)}
              min={0}
              max={100}
              onChange={(n) => patch({ opacity: String(n / 100) })}
            />
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Display</label>
              <select
                className="input-field text-sm"
                value={style.display || 'block'}
                onChange={(e) => patch({ display: e.target.value as ProductStyle['display'] })}
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline block</option>
              </select>
            </div>
          </div>
        </StyleSection>

        {!hideAdvancedJson && (
          <details className="border border-border rounded-lg p-3 bg-background-muted/50">
            <summary className="cursor-pointer text-sm font-medium text-text">
              Tùy chọn nâng cao — chỉnh JSON trực tiếp
            </summary>
            <p className="text-xs text-text-muted mt-2 mb-2">
              Sửa trực tiếp rồi nhấn &quot;Áp dụng JSON&quot;. Form phía trên sẽ đồng bộ sau khi parse thành công.
            </p>
            <textarea
              className="input-field resize-none font-mono text-xs w-full"
              rows={5}
              value={jsonDraft}
              onChange={(e) => {
                setJsonDraft(e.target.value)
                setJsonError(null)
              }}
            />
            {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
            <button
              type="button"
              className="mt-2 px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
              onClick={applyJsonDraft}
            >
              Áp dụng JSON
            </button>
          </details>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-text">Xem trước (giống menu công khai)</h4>
          <StyleToggleGroup
            label=""
            value={previewScale}
            options={[
              { value: 'desktop', label: 'Desktop' },
              { value: 'mobile', label: 'Mobile' },
            ]}
            onChange={setPreviewScale}
          />
        </div>
        <div className={`rounded-lg border border-border overflow-hidden bg-white shadow-sm ${previewScale === 'mobile' ? 'max-w-[430px] mx-auto' : ''}`}>
          <iframe
            title="Xem trước style sản phẩm"
            srcDoc={previewHtml}
            className={`w-full ${previewScale === 'mobile' ? 'h-[640px]' : 'h-[min(480px,70vh)]'} border-0 bg-gray-100`}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
