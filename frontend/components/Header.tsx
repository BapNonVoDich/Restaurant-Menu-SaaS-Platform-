'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isWaiterOnlyFromClient } from '@/lib/authRoles'

interface HeaderProps {
  storeName?: string
  showNavigation?: boolean
}

export default function Header({ storeName, showNavigation = true }: HeaderProps) {
  const pathname = usePathname()
  const [waiterOnly, setWaiterOnly] = useState(false)
  const isDashboard = pathname?.startsWith('/dashboard')
  const isAuth = pathname?.startsWith('/auth')

  useEffect(() => {
    setWaiterOnly(isWaiterOnlyFromClient())
  }, [pathname])

  // Don't show header on auth pages or menu public pages
  if (isAuth || pathname?.startsWith('/menu/')) {
    return null
  }

  return (
    <header className="bg-white shadow-soft border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={isDashboard ? (waiterOnly ? '/dashboard/orders' : '/dashboard') : '/'}
              className="flex items-center space-x-2"
            >
              <span className="text-2xl font-heading font-bold text-saas-blue">
                {storeName || 'SaaS nhà hàng'}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {showNavigation && isDashboard && (
            <nav className="hidden md:flex items-center space-x-1">
              {!waiterOnly && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-saas-blue text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    Tổng quan
                  </Link>
                  <Link
                    href="/dashboard/menu"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard/menu'
                        ? 'bg-saas-blue text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    Thực đơn
                  </Link>
                  <Link
                    href="/dashboard/categories"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard/categories'
                        ? 'bg-saas-blue text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    Danh mục
                  </Link>
                  <Link
                    href="/dashboard/products"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard/products'
                        ? 'bg-saas-blue text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    Sản phẩm
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/orders"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dashboard/orders'
                    ? 'bg-saas-blue text-white'
                    : 'text-text hover:bg-gray-100'
                }`}
              >
                Đơn hàng
              </Link>
              {waiterOnly && (
                <Link
                  href="/staff"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/staff'
                      ? 'bg-amber-600 text-white'
                      : 'text-text hover:bg-gray-100'
                  }`}
                >
                  Cổng nhân viên
                </Link>
              )}
              {!waiterOnly && (
                <Link
                  href="/dashboard/settings"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/dashboard/settings'
                      ? 'bg-saas-blue text-white'
                      : 'text-text hover:bg-gray-100'
                  }`}
                >
                  Cài đặt
                </Link>
              )}
            </nav>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isDashboard ? (
              <button
                onClick={() => {
                  // Clear token and redirect to login
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('auth_user')
                    window.location.href = '/auth/login'
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-text hover:text-saas-blue transition-colors"
              >
                Đăng xuất
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-text hover:text-saas-blue transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
