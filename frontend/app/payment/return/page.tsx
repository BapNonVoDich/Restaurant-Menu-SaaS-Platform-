'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function PaymentReturnContent() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string>('Đang xử lý kết quả thanh toán…')

  useEffect(() => {
    const code = searchParams.get('vnp_ResponseCode')
    const txnRef = searchParams.get('vnp_TxnRef')
    if (!code) {
      setMessage('Không nhận được tham số từ cổng thanh toán. Nếu bạn đã thanh toán, vui lòng chờ vài phút rồi tải lại trang cửa hàng.')
      return
    }
    if (code === '00') {
      setMessage('Thanh toán thành công. Menu có thể đã được xuất bản — kiểm tra trạng thái bên dưới.')
      toast.success('Thanh toán thành công')
    } else {
      setMessage(`Thanh toán chưa hoàn tất (mã: ${code}). Bạn có thể thử lại từ trang đăng ký.`)
      toast.error('Thanh toán chưa thành công')
    }
    if (txnRef) {
      console.info('VNPay TxnRef:', txnRef)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-lg w-full p-8 text-center space-y-4">
        <h1 className="font-heading text-xl font-bold text-text">Kết quả thanh toán</h1>
        <p className="text-text-muted text-sm">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/dashboard" className="btn-primary text-center">
            Về tổng quan
          </Link>
          <Link href="/setup/subscription" className="px-4 py-2 border border-border rounded-md text-text hover:bg-background-muted">
            Trang đăng ký
          </Link>
        </div>
        <p className="text-xs text-text-muted pt-2">
          Xác nhận cuối cùng do máy chủ thực hiện qua IPN VNPay. Nếu trạng thái chưa đổi, đợi 1–2 phút rồi tải lại trang cửa hàng.
        </p>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-muted">Đang tải…</div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  )
}
