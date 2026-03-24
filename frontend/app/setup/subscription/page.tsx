'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [store, setStore] = useState<any>(null)

  const fetchStore = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const storeData = await response.json()
        setStore(storeData)
      }
    } catch (error) {
      console.error('Error fetching store:', error)
    }
  }, [router])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  const handleSubscribe = async () => {
    if (!store) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/payment/subscriptions/pay?storeId=${store.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType: 'MONTHLY',
          amount: 500000, // 500k VND
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to VNPay payment URL
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          toast.error('Không nhận được link thanh toán từ máy chủ')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error((errorData as { error?: string }).error || 'Không khởi tạo được thanh toán')
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      toast.error('Lỗi kết nối khi thanh toán')
    } finally {
      setLoading(false)
    }
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-text">Xuất bản menu của bạn</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border rounded-md hover:bg-background-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
          >
            Quay lại trang tổng quan
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-semibold text-text mb-2">Sẵn sàng xuất bản menu chưa?</h2>
            <p className="text-text-muted">
              Menu của bạn hiện đang ở chế độ riêng tư. Đăng ký để công khai và hiển thị qua mã QR cho khách hàng.
            </p>
          </div>

          {store.subStatus === 'ACTIVE' ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6">
              <p className="text-green-700">
                <span className="font-medium">Menu của bạn đã được đăng công khai!</span> Truy cập tại{' '}
                <span className="font-mono bg-green-100 px-2 py-1 rounded">/menu/{store.slug}</span>
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
              <p className="text-yellow-700">
                <span className="font-medium">Menu của bạn đang ở chế độ riêng tư.</span> Bạn có thể chỉnh sửa bất cứ lúc nào, nhưng khách hàng sẽ không truy cập được cho đến khi bạn đăng ký.
              </p>
            </div>
          )}

          <div className="border-t border-border pt-6">
            <h3 className="font-heading text-lg font-semibold text-text mb-4">Gói đăng ký</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card p-4">
                <h4 className="font-semibold text-text mb-2">Gói theo tháng</h4>
                <p className="text-2xl font-bold text-text mb-2">500,000 VNĐ</p>
                <p className="text-sm text-text-muted mb-4">mỗi tháng</p>
                <button
                  onClick={handleSubscribe}
                  disabled={loading || store.subStatus === 'ACTIVE'}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : store.subStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Đăng ký theo tháng'}
                </button>
              </div>
            </div>

            <div className="text-sm text-text-muted">
              <p className="mb-2">Sau khi đăng ký, menu của bạn sẽ:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Công khai qua mã QR</li>
                <li>Khách hàng có thể xem và đặt món</li>
                <li>Đầy đủ tính năng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
