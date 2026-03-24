import Link from 'next/link'
import { buildMenuPreviewFullDocument, DEMO_STORE_MENU } from '@/lib/menuEditor/menuPreviewDocument'

/**
 * Trang công khai: xem giao diện menu mẫu không cần đăng ký / không cần cửa hàng ACTIVE.
 */
export default function DemoMenuPage() {
  const doc = buildMenuPreviewFullDocument('Nhà hàng mẫu', DEMO_STORE_MENU as Record<string, unknown>)

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-5xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-text-muted">
          Đây là <strong>menu mẫu</strong> để xem bố cục và ảnh nền — không cần tài khoản.
        </p>
        <Link href="/" className="text-sm font-medium text-primary-600 hover:underline shrink-0">
          ← Về trang chủ
        </Link>
      </div>
      <iframe
        srcDoc={doc}
        title="Menu mẫu"
        sandbox="allow-same-origin"
        className="w-full h-[min(90vh,920px)] rounded-lg border border-border shadow-sm bg-gray-100"
      />
    </div>
  )
}
