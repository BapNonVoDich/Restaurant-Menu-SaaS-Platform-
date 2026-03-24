'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PublicMenuLinkBlock from '@/components/PublicMenuLinkBlock'
import { buildMenuPreviewFullDocument } from '@/lib/menuEditor/menuPreviewDocument'
import { persistCustomizationPatch } from '@/lib/menuEditor/persistMenuCustomization'
import type { ReadabilityMode } from '@/lib/menuEditor/types'

type TemplateKey = 'A' | 'B' | 'C'
type MenuPresetId = 'classic' | 'modern' | 'bold'

const MENU_PRESETS: Array<{
  id: MenuPresetId
  label: string
  description: string
  templateKey: TemplateKey
  readabilityMode: ReadabilityMode
  readabilityStrength: number
}> = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Dễ đọc, cân bằng cho đa số menu.',
    templateKey: 'A',
    readabilityMode: 'soft_scrim',
    readabilityStrength: 0.4,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Nhấn mạnh khối kính, phù hợp ảnh nền đẹp.',
    templateKey: 'C',
    readabilityMode: 'glass_card',
    readabilityStrength: 0.55,
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Nổi bật mạnh, ưu tiên đọc rõ trên nền rối.',
    templateKey: 'B',
    readabilityMode: 'soft_scrim',
    readabilityStrength: 0.7,
  },
]

export default function MenuPage() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [savingTemplateKey, setSavingTemplateKey] = useState(false)

  const [templateKey, setTemplateKey] = useState<TemplateKey>('A')
  const [backgroundUrl, setBackgroundUrl] = useState<string>('')
  const [previewNonce, setPreviewNonce] = useState(0)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [menuPayload, setMenuPayload] = useState<Record<string, unknown> | null>(null)
  const [readabilityMode, setReadabilityMode] = useState<ReadabilityMode>('none')
  const [readabilityStrength, setReadabilityStrength] = useState(0.45)
  const [savingReadability, setSavingReadability] = useState(false)
  const [selectedMenuPreset, setSelectedMenuPreset] = useState<MenuPresetId>('classic')

  const getAbsoluteUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${apiUrl}${url}`
  }

  useEffect(() => {
    try {
      sessionStorage.setItem('menu_preview_seen', '1')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch(`${apiUrl}/catalog/stores/my-store`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setStore(data)
          setTemplateKey((data.menuTemplateKey as TemplateKey) || 'A')
          setBackgroundUrl(data.menuFileUrl || '')
          setPreviewNonce((n) => n + 1)
        }
      } catch (e) {
        console.error('Error fetching store:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [router, apiUrl])

  useEffect(() => {
    if (!store?.id || !store?.name) return
    const token = localStorage.getItem('token')
    if (!token) return

    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(null)

    ;(async () => {
      try {
        const res = await fetch(`${apiUrl}/catalog/stores/my-store/menu`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          if (!cancelled) {
            setPreviewError('Không tải được dữ liệu menu để xem trước.')
            setMenuPayload(null)
            setPreviewDoc(null)
          }
          return
        }
        const menuData = (await res.json()) as Record<string, unknown>
        if (cancelled) return
        setMenuPayload(menuData)
        const c = (menuData.customization || {}) as {
          readabilityMode?: string
          readabilityStrength?: number
        }
        const rm = c.readabilityMode
        setReadabilityMode(rm === 'soft_scrim' || rm === 'glass_card' ? rm : 'none')
        setReadabilityStrength(
          typeof c.readabilityStrength === 'number' && !Number.isNaN(c.readabilityStrength)
            ? Math.min(1, Math.max(0, c.readabilityStrength))
            : 0.45
        )
      } catch {
        if (!cancelled) {
          setPreviewError('Lỗi khi tải xem trước menu.')
          setMenuPayload(null)
          setPreviewDoc(null)
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiUrl, store?.id, store?.name, previewNonce])

  useEffect(() => {
    if (!menuPayload || !store?.name) {
      if (!previewLoading) setPreviewDoc(null)
      return
    }
    const doc = buildMenuPreviewFullDocument(
      store.name,
      menuPayload,
      backgroundUrl || (menuPayload.backgroundUrl as string) || '',
      {
        readabilityMode,
        readabilityStrength,
      }
    )
    setPreviewDoc(doc)
  }, [
    menuPayload,
    store?.name,
    backgroundUrl,
    readabilityMode,
    readabilityStrength,
    previewLoading,
  ])

  const handleBackgroundUpload = async (file: File) => {
    if (!store?.id) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ hỗ trợ ảnh nền (image/*)')
        return
      }

      setUploadingBackground(true)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${apiUrl}/catalog/stores/${store.id}/menu-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || err.message || 'Upload ảnh nền thất bại')
        return
      }

      toast.success('Đã upload ảnh nền thành công')

      const updated = await fetch(`${apiUrl}/catalog/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (updated.ok) {
        const data = await updated.json()
        setBackgroundUrl(data.menuFileUrl || '')
      }
      setPreviewNonce((n) => n + 1)
    } catch (e) {
      console.error('Upload background error:', e)
      toast.error('Có lỗi khi upload ảnh nền')
    } finally {
      setUploadingBackground(false)
    }
  }

  const handleBackgroundDelete = async () => {
    if (!store?.id) return
    const shouldDelete = confirm('Xóa ảnh nền của menu?')
    if (!shouldDelete) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`${apiUrl}/catalog/stores/${store.id}/menu-file`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || err.message || 'Không thể xóa ảnh nền')
        return
      }

      toast.success('Đã xóa ảnh nền')
      setBackgroundUrl('')
      setPreviewNonce((n) => n + 1)
    } catch (e) {
      console.error('Delete background error:', e)
      toast.error('Có lỗi khi xóa ảnh nền')
    }
  }

  const handleSaveTemplateKey = async () => {
    if (!store?.id) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      setSavingTemplateKey(true)

      const res = await fetch(`${apiUrl}/catalog/stores/${store.id}/menu-template-key`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ menuTemplateKey: templateKey }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || err.message || 'Không thể lưu template key')
        return
      }

      toast.success('Đã lưu template layout')

      const updated = await fetch(`${apiUrl}/catalog/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (updated.ok) {
        const data = await updated.json()
        setStore(data)
        setTemplateKey((data.menuTemplateKey as TemplateKey) || 'A')
      }
      setPreviewNonce((n) => n + 1)
    } catch (e) {
      console.error('Save template key error:', e)
      toast.error('Có lỗi khi lưu template key')
    } finally {
      setSavingTemplateKey(false)
    }
  }

  const applyMenuPreset = async (presetId: MenuPresetId) => {
    const preset = MENU_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedMenuPreset(presetId)
    setTemplateKey(preset.templateKey)
    setReadabilityMode(preset.readabilityMode)
    setReadabilityStrength(preset.readabilityStrength)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    const patchRes = await persistCustomizationPatch(apiUrl, store.id, token, {
      readabilityMode: preset.readabilityMode,
      readabilityStrength: preset.readabilityStrength,
    })
    if (!patchRes.ok) {
      toast.error(patchRes.error || 'Không thể áp dụng preset')
      return
    }

    await fetch(`${apiUrl}/catalog/stores/${store.id}/menu-template-key`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ menuTemplateKey: preset.templateKey }),
    })
    setPreviewNonce((n) => n + 1)
    toast.success(`Đã áp preset ${preset.label}`)
  }

  const handleSaveReadability = async () => {
    if (!store?.id) return
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setSavingReadability(true)
    try {
      const result = await persistCustomizationPatch(apiUrl, store.id, token, {
        readabilityMode,
        readabilityStrength,
      })
      if (!result.ok) {
        toast.error(result.error || 'Không lưu được cài đặt dễ đọc')
        return
      }
      toast.success('Đã lưu — chữ trên ảnh nền sẽ áp dụng cho menu công khai')
      setPreviewNonce((n) => n + 1)
    } catch (e) {
      console.error(e)
      toast.error('Có lỗi khi lưu')
    } finally {
      setSavingReadability(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Đang tải...</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Không tìm thấy cửa hàng</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard/menu/edit"
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            ← Về trang hướng dẫn chỉnh menu
          </Link>
        </div>
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Giao diện menu</h1>
        <p className="text-sm text-text-muted mb-6">
          Chọn bố cục, ảnh nền và cách làm chữ dễ đọc trên ảnh — khách sẽ thấy giống ô xem trước bên dưới.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-heading text-lg font-semibold text-text mb-3">Preset menu nhanh</h2>
              <p className="text-sm text-text-muted mb-4">
                Preset này áp dụng cho <strong className="text-text">toàn bộ giao diện menu</strong> (khác với layout từng
                danh mục trong trang Danh mục).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MENU_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyMenuPreset(preset.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      selectedMenuPreset === preset.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:bg-background-muted'
                    }`}
                  >
                    <div className="font-medium text-sm text-text">{preset.label}</div>
                    <div className="text-xs text-text-muted">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
            <h2 className="font-heading text-lg font-semibold text-text mb-4">
              Bố cục tổng thể menu (template)
            </h2>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-muted">
                Chọn layout (A/B/C)
              </label>

              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as TemplateKey)}
                className="input-field"
              >
                <option value="A">A - Lưới</option>
                <option value="B">B - Danh sách</option>
                <option value="C">C - Thẻ</option>
              </select>

              <button
                type="button"
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={savingTemplateKey}
                onClick={handleSaveTemplateKey}
              >
                {savingTemplateKey ? 'Đang lưu...' : 'Lưu template'}
              </button>

              <p className="text-sm text-text-muted">
                Đây là khung bố cục tổng thể của menu công khai. Layout chi tiết từng danh mục chỉnh ở trang Danh mục.
              </p>
            </div>
            </div>

            <div className="card p-6">
            <h2 className="font-heading text-lg font-semibold text-text mb-4">
              Ảnh nền menu công khai
            </h2>

            {backgroundUrl ? (
              <div className="mb-4">
                <p className="text-sm text-text-muted mb-2">Hiện tại:</p>
                <div className="relative w-full h-72 max-h-72 rounded border border-border overflow-hidden">
                  <Image
                    src={getAbsoluteUrl(backgroundUrl)}
                    alt="Menu background"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 896px"
                    unoptimized
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleBackgroundDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-text-muted">
                  Chưa có ảnh nền. Bạn có thể upload ảnh để hiển thị phía sau nội dung menu.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-muted">
                Upload ảnh nền
              </label>

              <input
                type="file"
                accept="image/*"
                disabled={uploadingBackground}
                className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  handleBackgroundUpload(file)
                  // allow uploading the same file again
                  e.currentTarget.value = ''
                }}
              />

              <p className="text-xs text-text-muted">
                File sẽ được lưu vào DB và dùng cho màn public menu: <span className="font-mono">/menu/{store.slug}</span>
              </p>
            </div>
            </div>

            <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-2">Dễ đọc trên ảnh nền</h2>
          <p className="text-sm text-text-muted mb-4">
            Khi ảnh nền sáng hoặc rối, chữ có thể khó đọc. Chọn một kiểu phủ — bạn xem kết quả ngay ở ô xem trước.
          </p>
          <div className="space-y-4 max-w-xl">
            <div>
              <span className="block text-sm font-medium text-text-muted mb-2">Kiểu hiển thị</span>
              <div className="flex flex-col sm:flex-row gap-2">
                {(
                  [
                    ['none', 'Mặc định (không phủ)'],
                    ['soft_scrim', 'Lớp tối nhẹ (scrim)'],
                    ['glass_card', 'Khối kính mờ (glass)'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/50"
                  >
                    <input
                      type="radio"
                      name="readabilityMode"
                      checked={readabilityMode === value}
                      onChange={() => setReadabilityMode(value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-text">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Độ đậm ({Math.round(readabilityStrength * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(readabilityStrength * 100)}
                onChange={(e) => setReadabilityStrength(Number(e.target.value) / 100)}
                className="w-full max-w-md"
              />
            </div>
            <button
              type="button"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={savingReadability || previewLoading}
              onClick={handleSaveReadability}
            >
              {savingReadability ? 'Đang lưu...' : 'Lưu cài đặt dễ đọc'}
            </button>
          </div>
            </div>
          </div>

          <div className="card p-6 lg:sticky lg:top-6 h-fit">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-text mb-1">
                  Xem trước (giống menu khách)
                </h2>
                <p className="text-sm text-text-muted">
                  Xem trước dùng dữ liệu menu của bạn (API chủ cửa hàng) — hoạt động kể cả khi menu công khai chưa kích hoạt.
                  {backgroundUrl.trim().toLowerCase().endsWith('.pdf') ? (
                    <span className="block mt-2 text-amber-800">
                      Ảnh nền dạng PDF: bản xem trước HTML có thể không hiển thị PDF; hãy mở menu công khai sau khi xuất bản.
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => window.open(`/menu/${store.slug}`, '_blank')}
                disabled={!store?.slug}
              >
                Thử đặt món
              </button>
            </div>
            {store?.slug ? (
              <div className="mb-4 p-3 rounded-lg border border-border bg-background-muted">
                <PublicMenuLinkBlock slug={store.slug} />
              </div>
            ) : null}

            {previewLoading && (
              <div className="flex h-[320px] items-center justify-center rounded border border-border bg-background-muted text-text-muted">
                Đang tải xem trước…
              </div>
            )}
            {previewError && !previewLoading && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{previewError}</div>
            )}
            {previewDoc && !previewLoading && (
              <iframe
                key={previewNonce}
                title="Xem trước menu (dữ liệu chủ cửa hàng)"
                srcDoc={previewDoc}
                sandbox="allow-same-origin"
                className="w-full h-[680px] rounded border border-border bg-gray-100"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
