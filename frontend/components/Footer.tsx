'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface FooterProps {
  showFullLinks?: boolean
}

export default function Footer({ showFullLinks = true }: FooterProps) {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Public menu for customers: no marketing footer (Header already hidden on /menu/)
  if (pathname?.startsWith('/menu/')) {
    return null
  }
  // Auth: keep focus on login/register without product links
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-heading font-bold text-saas-blue mb-4">
              Nền tảng SaaS nhà hàng
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Nền tảng quản lý thực đơn và đơn hàng số cho nhà hàng. 
              Tạo menu đẹp, quản lý đơn hàng dễ dàng, tăng trải nghiệm khách hàng.
            </p>
            <p className="text-xs text-text-muted">
              © {currentYear} Nhà hàng SaaS. Bảo lưu mọi quyền.
            </p>
          </div>

          {/* Quick Links */}
          {showFullLinks && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-text mb-4">Sản phẩm</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/dashboard/menu" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Trình chỉnh sửa Menu
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/orders" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Quản lý Đơn hàng
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/products" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Quản lý Sản phẩm
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text mb-4">Hỗ trợ</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/dashboard/settings" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Cài đặt
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Tài liệu
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-text-muted hover:text-saas-blue transition-colors">
                      Liên hệ
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
