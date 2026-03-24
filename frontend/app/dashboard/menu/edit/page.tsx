'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Check = { id: string; label: string; done: boolean; hint?: string }

export default function MenuEditHubPage() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<{ id: string; slug: string; subStatus?: string; menuTemplateKey?: string } | null>(
    null
  )
  const [categoryCount, setCategoryCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [previewSeen, setPreviewSeen] = useState(false)

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const storeRes = await fetch(`${apiUrl}/catalog/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!storeRes.ok) {
        setStore(null)
        return
      }
      const storeData = await storeRes.json()
      setStore(storeData)

      const menuRes = await fetch(`${apiUrl}/catalog/stores/my-store/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (menuRes.ok) {
        const menu = await menuRes.json()
        const cats = menu.categories || []
        setCategoryCount(cats.length)
        const pCount = cats.reduce((acc: number, c: { products?: unknown[] }) => acc + (c.products?.length || 0), 0)
        setProductCount(pCount)
      } else {
        setCategoryCount(0)
        setProductCount(0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, router])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const read = () => {
      try {
        setPreviewSeen(sessionStorage.getItem('menu_preview_seen') === '1')
      } catch {
        setPreviewSeen(false)
      }
    }
    read()
    document.addEventListener('visibilitychange', read)
    return () => document.removeEventListener('visibilitychange', read)
  }, [])

  const checks: Check[] = useMemo(() => {
    const published = store?.subStatus === 'ACTIVE'
    return [
      {
        id: 'cat',
        label: 'Đã có ít nhất một danh mục',
        done: categoryCount > 0,
        hint: 'Nhóm món theo chủ đề (khai vị, món chính…).',
      },
      {
        id: 'prod',
        label: 'Đã có ít nhất một món',
        done: productCount > 0,
        hint: 'Thêm tên, giá, ảnh và bật/tắt hiển thị trên menu.',
      },
      {
        id: 'design',
        label: 'Đã vào trang Giao diện menu (bố cục, nền, dễ đọc, xem trước)',
        done: previewSeen,
        hint: 'Mở «Giao diện menu» ít nhất một lần trong phiên này — checklist sẽ tự cập nhật.',
      },
      {
        id: 'pub',
        label: 'Menu đã xuất bản (hiển thị cho khách)',
        done: published,
        hint: published ? 'Khách có thể quét QR hoặc mở link menu.' : 'Hoàn tất gói / kích hoạt để khách xem menu công khai.',
      },
    ]
  }, [categoryCount, productCount, previewSeen, store?.subStatus])

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Chỉnh menu — bắt đầu tại đây</h1>
        <p className="text-text-muted mb-8">
          Làm theo thứ tự: <strong className="text-text">Nội dung</strong> →{' '}
          <strong className="text-text">Giao diện</strong> → <strong className="text-text">Xem trước / xuất bản</strong>.
          Bạn không cần chỉnh mã hay JSON trừ khi mở phần nâng cao.
        </p>

        <ol className="space-y-4 mb-10">
          {checks.map((c, i) => (
            <li
              key={c.id}
              className={`card p-4 flex gap-3 border-l-4 ${c.done ? 'border-l-green-500 bg-green-50/40' : 'border-l-border'}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  c.done ? 'bg-green-600 text-white' : 'bg-background-muted text-text-muted'
                }`}
              >
                {c.done ? '✓' : i + 1}
              </span>
              <div>
                <div className="font-medium text-text">{c.label}</div>
                {c.hint && <p className="text-sm text-text-muted mt-1">{c.hint}</p>}
              </div>
            </li>
          ))}
        </ol>

        <h2 className="font-heading text-lg font-semibold text-text mb-3">Đi tới trang chỉnh sửa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/categories" className="card-hover card p-4 block">
            <div className="font-medium text-text">Danh mục</div>
            <p className="text-sm text-text-muted mt-1">Tạo nhóm món, sắp xếp thứ tự.</p>
          </Link>
          <Link href="/dashboard/products" className="card-hover card p-4 block">
            <div className="font-medium text-text">Sản phẩm</div>
            <p className="text-sm text-text-muted mt-1">Thêm món, giá, ảnh, kiểu hiển thị thẻ.</p>
          </Link>
          <Link href="/dashboard/menu" className="card-hover card p-4 block border-primary-200 bg-primary-50/30">
            <div className="font-medium text-text">Giao diện menu</div>
            <p className="text-sm text-text-muted mt-1">Bố cục A/B/C, ảnh nền, dễ đọc trên ảnh, xem trước.</p>
          </Link>
          <Link
            href={store.slug ? `/menu/${store.slug}` : '/dashboard/menu'}
            className="card-hover card p-4 block"
            target={store.slug ? '_blank' : undefined}
          >
            <div className="font-medium text-text">Xem menu như khách</div>
            <p className="text-sm text-text-muted mt-1">
              {store.subStatus === 'ACTIVE' ? 'Mở tab mới (menu công khai).' : 'Cần xuất bản để khách xem — tạm xem trước ở Giao diện menu.'}
            </p>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">
            ← Về tổng quan
          </Link>
        </div>
      </div>
    </div>
  )
}
