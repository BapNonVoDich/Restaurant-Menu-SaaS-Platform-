'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeInfo, setStoreInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token')
        const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const isOwner = (authUser?.roles || []).includes('STORE_OWNER')
        if (isOwner) {
          router.push('/dashboard/orders')
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
        const response = await fetch(`${apiUrl}/catalog/staff/my-store`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Không tìm thấy cửa hàng được phân công')
        }
        setStoreInfo(await response.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router])

  if (loading) return <div className="p-8">Đang tải cổng nhân viên...</div>

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto card p-6">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Cổng nhân viên</h1>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <p className="text-text-muted mb-4">
              Bạn đang thao tác cho cửa hàng: <strong>{storeInfo?.name}</strong>
            </p>
            <div className="flex gap-3">
              <button className="btn-primary" onClick={() => router.push('/dashboard/orders')}>
                Vào màn hình xử lý đơn
              </button>
              {storeInfo?.slug && (
                <button
                  className="px-4 py-2 rounded border border-border hover:bg-background-muted"
                  onClick={() => router.push(`/menu/${storeInfo.slug}`)}
                >
                  Xem menu công khai
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
