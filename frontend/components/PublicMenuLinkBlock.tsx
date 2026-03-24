'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'

/**
 * Full public menu URL, copy, open, and QR — for store owners (dashboard / settings).
 */
export default function PublicMenuLinkBlock({
  slug,
  className = '',
  showQr = true,
}: {
  slug: string
  className?: string
  showQr?: boolean
}) {
  const [origin, setOrigin] = useState(() => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const path = `/menu/${slug}`
  const fullUrl = useMemo(() => (origin ? `${origin}${path}` : path), [origin, path])

  const copyFullUrl = async () => {
    const toCopy = origin ? fullUrl : typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    try {
      await navigator.clipboard.writeText(toCopy)
      toast.success('Đã sao chép link menu công khai')
    } catch {
      toast.error('Không thể sao chép — hãy chọn và copy thủ công')
    }
  }

  if (!slug?.trim()) {
    return <p className="text-sm text-text-muted">Chưa có slug cửa hàng.</p>
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          Mở menu công khai
        </Link>
        <button
          type="button"
          onClick={() => copyFullUrl()}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-background-muted transition"
        >
          Sao chép link đầy đủ
        </button>
      </div>
      <p className="text-xs text-text-muted break-all font-mono bg-background-muted px-2 py-1.5 rounded border border-border">
        {origin ? fullUrl : `${path} (đường dẫn tương đối — đặt NEXT_PUBLIC_APP_URL để hiện URL tuyệt đối khi SSR)`}
      </p>
      {showQr && origin ? (
        <div className="flex items-start gap-3 pt-1">
          <div className="p-2 bg-white rounded-lg border border-border inline-block">
            <QRCode value={fullUrl} size={112} level="M" />
          </div>
          <p className="text-xs text-text-muted max-w-xs pt-1">Quét mã QR để mở menu (cùng URL như trên).</p>
        </div>
      ) : null}
    </div>
  )
}
