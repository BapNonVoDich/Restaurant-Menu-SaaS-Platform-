'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryItem, CategoryStyle, CustomizationSettings, ProductItem } from '@/lib/menuEditor/types'
import { generateMenuHTML } from '@/lib/menuEditor/menuGenerator'
import { parseCategoryStyleJson, serializeCategoryStyle } from '@/lib/menuEditor/styleJson'
import { StyleNumberStepper, StyleSection, StyleToggleGroup, StyleUnitStepper } from '@/components/style/StyleControls'

const CATEGORY_STYLE_PRESETS: Array<{
  id: string
  label: string
  style: Partial<CategoryStyle>
}> = [
  {
    id: 'clean-grid',
    label: 'Lưới gọn',
    style: {
      layout: 'grid',
      columns: 3,
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'left',
      borderRadius: '14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
  },
  {
    id: 'elegant-list',
    label: 'Danh sách sang',
    style: {
      layout: 'list',
      fontSize: '2.2rem',
      fontWeight: '800',
      textAlign: 'left',
      textColor: '#0f172a',
      borderRadius: '10px',
      backgroundColor: 'rgba(255,255,255,0.55)',
    },
  },
  {
    id: 'centered-card',
    label: 'Card nổi bật',
    style: {
      layout: 'card',
      fontSize: '2rem',
      fontWeight: '800',
      textAlign: 'center',
      borderRadius: '18px',
      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
      backgroundColor: 'rgba(255,255,255,0.72)',
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

const PREVIEW_PRODUCTS: ProductItem[] = [
  {
    id: 'preview-p1',
    name: 'Món mẫu A',
    description: 'Mô tả ngắn để xem bố cục.',
    price: 35000,
    isAvailable: true,
    sortOrder: 0,
    categoryIds: ['preview-category'],
    style: { showImage: false, showDescription: true, showPrice: true, fontSize: '1rem' },
  },
  {
    id: 'preview-p2',
    name: 'Món mẫu B',
    description: '',
    price: 52000,
    isAvailable: true,
    sortOrder: 1,
    categoryIds: ['preview-category'],
    style: { showImage: false, showDescription: true, showPrice: true, fontSize: '1rem' },
  },
]

function parseBoxShadow(raw?: string) {
  const fallback = { x: 0, y: 4, blur: 12, spread: 0, opacity: 0.08 }
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

function buildPreviewCategory(style: Partial<CategoryStyle>): CategoryItem {
  const layout: CategoryStyle['layout'] =
    style.layout === 'list' || style.layout === 'card' || style.layout === 'grid'
      ? style.layout
      : 'grid'
  const columns = layout === 'grid' ? Math.min(6, Math.max(1, style.columns ?? 3)) : style.columns
  return {
    id: 'preview-category',
    name: 'Tiêu đề danh mục (mẫu)',
    sortOrder: 0,
    products: PREVIEW_PRODUCTS.map((p) => ({
      ...p,
      categoryIds: ['preview-category'],
    })),
    style: {
      ...style,
      layout,
      ...(layout === 'grid' && columns != null ? { columns } : {}),
    },
  }
}

export default function CategoryStyleEditor({
  valueJson,
  onJsonChange,
  hideAdvancedJson = false,
  previewContext,
}: {
  valueJson: string
  onJsonChange: (json: string) => void
  hideAdvancedJson?: boolean
  previewContext?: {
    categories?: CategoryItem[]
    highlightCategoryId?: string
  }
}) {
  const [style, setStyle] = useState<Partial<CategoryStyle>>(() => parseCategoryStyleJson(valueJson))
  const [jsonDraft, setJsonDraft] = useState(valueJson)
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    const parsed = parseCategoryStyleJson(valueJson)
    setStyle(parsed)
    setJsonDraft(valueJson)
    setJsonError(null)
  }, [valueJson])

  const notifyChange = useCallback(
    (next: Partial<CategoryStyle>) => {
      setStyle(next)
      onJsonChange(serializeCategoryStyle(next))
      setJsonDraft(serializeCategoryStyle(next))
      setJsonError(null)
    },
    [onJsonChange]
  )

  const patch = (p: Partial<CategoryStyle>) => {
    notifyChange({ ...style, ...p })
  }

  const previewHtml = useMemo(() => {
    const categories =
      previewContext?.categories && previewContext.categories.length > 0
        ? previewContext.categories.map((c) =>
            c.id === previewContext.highlightCategoryId
              ? {
                  ...c,
                  products: Array.isArray(c.products) && c.products.length > 0 ? c.products : PREVIEW_PRODUCTS,
                  style: { ...c.style, ...style },
                }
              : {
                  ...c,
                  products: Array.isArray(c.products) && c.products.length > 0 ? c.products : PREVIEW_PRODUCTS,
                }
          )
        : [buildPreviewCategory(style)]

    const html = generateMenuHTML(categories, [], PREVIEW_CUSTOMIZATION, 'Xem trước menu', undefined, false)
    const target = previewContext?.highlightCategoryId
      ? `.category-section[data-category-id="${previewContext.highlightCategoryId}"]`
      : '.category-section:first-of-type'
    const previewHighlightCss = `
      ${target} {
        position: relative;
        outline: 2px dashed #2563eb;
        outline-offset: 8px;
      }
      ${target}::before {
        content: 'Đang xem trước danh mục đang chỉnh';
        position: absolute;
        top: -14px;
        left: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #1d4ed8;
        background: #dbeafe;
        border: 1px solid #93c5fd;
        border-radius: 999px;
        padding: 2px 8px;
      }
    `
    return html.replace('</style>', `${previewHighlightCss}</style>`)
  }, [style, previewContext])

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
      notifyChange(parsed as Partial<CategoryStyle>)
    } catch {
      setJsonError('JSON không hợp lệ')
    }
  }

  const layoutUi = style.layout === 'list' || style.layout === 'card' || style.layout === 'grid' ? style.layout : 'grid'
  const columnsUi = typeof style.columns === 'number' && !Number.isNaN(style.columns) ? style.columns : 3
  const shadow = parseBoxShadow(style.boxShadow)
  const [previewScale, setPreviewScale] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <StyleSection title="Preset nhanh" description="Áp dụng nhanh một phong cách cơ bản rồi tinh chỉnh thêm.">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_STYLE_PRESETS.map((preset) => (
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

        <StyleSection title="Bố cục danh mục" description="Chọn layout chính và số cột nếu dùng dạng lưới.">
          <StyleToggleGroup
            label="Kiểu hiển thị"
            value={layoutUi}
            options={[
              { value: 'grid', label: 'Lưới' },
              { value: 'list', label: 'Danh sách' },
              { value: 'card', label: 'Thẻ' },
            ]}
            onChange={(v) => patch({ layout: v, columns: v === 'grid' ? columnsUi : undefined })}
          />
          {layoutUi === 'grid' ? (
            <StyleNumberStepper
              label="Số cột"
              value={columnsUi}
              min={1}
              max={6}
              onChange={(n) => patch({ columns: n })}
            />
          ) : null}
        </StyleSection>

        <StyleSection title="Tiêu đề danh mục" description="Cỡ chữ, căn lề và màu chữ.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StyleUnitStepper
              label="Cỡ chữ"
              rawValue={style.fontSize}
              fallbackValue={2}
              fallbackUnit="rem"
              min={0.8}
              max={5}
              step={0.1}
              onChange={(v) => patch({ fontSize: v })}
            />
            <StyleNumberStepper
              label="Độ đậm"
              value={Number(style.fontWeight || 700)}
              min={100}
              max={900}
              step={100}
              onChange={(n) => patch({ fontWeight: String(n) })}
            />
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Căn chữ</label>
              <select
                className="input-field text-sm"
                value={style.textAlign ?? 'left'}
                onChange={(e) =>
                  patch({
                    textAlign: e.target.value as CategoryStyle['textAlign'],
                  })
                }
              >
                <option value="left">Trái</option>
                <option value="center">Giữa</option>
                <option value="right">Phải</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Màu chữ tiêu đề</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                  value={
                    style.textColor?.startsWith('#') && style.textColor.length >= 4 ? style.textColor : '#111827'
                  }
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
          </div>
        </StyleSection>

        <StyleSection title="Khoảng cách & kích thước" description="Padding, margin, width/height cho khối danh mục.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StyleUnitStepper
              label="Padding"
              rawValue={style.padding}
              fallbackValue={16}
              min={0}
              step={2}
              onChange={(v) => patch({ padding: v })}
            />
            <StyleUnitStepper
              label="Margin dưới"
              rawValue={style.marginBottom}
              fallbackValue={24}
              min={0}
              step={2}
              onChange={(v) => patch({ marginBottom: v })}
            />
            <StyleUnitStepper
              label="Gap giữa sản phẩm"
              rawValue={style.gap}
              fallbackValue={16}
              min={0}
              step={2}
              onChange={(v) => patch({ gap: v })}
            />
            <StyleUnitStepper
              label="Chiều rộng tối đa"
              rawValue={style.maxWidth}
              fallbackValue={1200}
              min={200}
              step={20}
              onChange={(v) => patch({ maxWidth: v })}
            />
          </div>
        </StyleSection>

        <StyleSection title="Khối danh mục" description="Nền, viền, bo góc, đổ bóng cho khối danh mục.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Nền phía sau tiêu đề &amp; món</label>
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
                  placeholder="Để trống = trong suốt"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <StyleUnitStepper
                label="Bo góc"
                rawValue={style.borderRadius}
                fallbackValue={12}
                min={0}
                step={1}
                onChange={(v) => patch({ borderRadius: v })}
              />
            </div>
            <div className="sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StyleNumberStepper label="Shadow X" value={shadow.x} min={-20} max={20} onChange={(v) => patch({ boxShadow: buildBoxShadow(v, shadow.y, shadow.blur, shadow.spread, shadow.opacity) })} />
                <StyleNumberStepper label="Shadow Y" value={shadow.y} min={-20} max={40} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, v, shadow.blur, shadow.spread, shadow.opacity) })} />
                <StyleNumberStepper label="Blur" value={shadow.blur} min={0} max={60} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, v, shadow.spread, shadow.opacity) })} />
                <StyleNumberStepper label="Spread" value={shadow.spread} min={-20} max={30} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, shadow.blur, v, shadow.opacity) })} />
                <StyleNumberStepper label="Opacity (%)" value={Math.round(shadow.opacity * 100)} min={0} max={100} onChange={(v) => patch({ boxShadow: buildBoxShadow(shadow.x, shadow.y, shadow.blur, shadow.spread, v / 100) })} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StyleUnitStepper
                  label="Độ dày viền"
                  rawValue={style.borderWidth}
                  fallbackValue={0}
                  min={0}
                  step={1}
                  onChange={(v) => patch({ borderWidth: v })}
                />
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Kiểu viền</label>
                  <select
                    className="input-field text-sm"
                    value={style.borderStyle || 'solid'}
                    onChange={(e) => patch({ borderStyle: e.target.value as CategoryStyle['borderStyle'] })}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </StyleSection>

        <StyleSection title="Hiển thị nâng cao" description="Display, opacity và căn chỉnh cho khối danh mục.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Display</label>
              <select
                className="input-field text-sm"
                value={style.display || 'block'}
                onChange={(e) => patch({ display: e.target.value as CategoryStyle['display'] })}
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline block</option>
              </select>
            </div>
            <StyleNumberStepper
              label="Opacity (%)"
              value={Math.round((parseFloat(style.opacity || '1') || 1) * 100)}
              min={0}
              max={100}
              onChange={(n) => patch({ opacity: String(n / 100) })}
            />
          </div>
        </StyleSection>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-background-muted text-text"
            onClick={() => notifyChange({})}
          >
            Đặt lại (dùng mặc định theo template menu)
          </button>
        </div>

        {!hideAdvancedJson && (
          <details className="border border-border rounded-lg p-3 bg-background-muted/50">
            <summary className="cursor-pointer text-sm font-medium text-text">
              Tùy chọn nâng cao — chỉnh JSON trực tiếp
            </summary>
            <p className="text-xs text-text-muted mt-2 mb-2">
              Dùng khi cần thuộc tính CSS chi tiết. Sau khi áp dụng, form phía trên đồng bộ theo JSON hợp lệ.
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
            title="Xem trước style danh mục"
            srcDoc={previewHtml}
            className={`w-full ${previewScale === 'mobile' ? 'h-[640px]' : 'h-[min(480px,70vh)]'} border-0 bg-gray-100`}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
