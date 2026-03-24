'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/identity/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        const roles: string[] = data.roles || []
        // Store JWT token
        localStorage.setItem('token', data.token)
        localStorage.setItem('auth_user', JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          roles,
        }))
        const isWaiterOnly = roles.includes('WAITER') && !roles.includes('STORE_OWNER')
        router.push(isWaiterOnly ? '/staff' : '/dashboard')
      } else {
        // Handle error - try to get error message from response
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 
                           Object.values(errorData).join(', ') || 
                           'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.'
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Login error:', error)
        setError(`Lỗi kết nối: ${error instanceof Error ? error.message : 'Vui lòng thử lại'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 card shadow-soft-lg p-8 sm:p-10">
        <div>
          <h2 className="font-heading mt-6 text-center text-3xl font-bold text-text">
            Đăng nhập vào tài khoản của bạn
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Nhập thông tin để truy cập trang quản lý
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="post" action="#">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text mb-1">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="input-field"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm text-red-800 font-medium">
                {error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/register"
              className="block text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded transition-colors duration-200 cursor-pointer"
            >
              Bạn chưa có tài khoản? Đăng ký chủ cửa hàng
            </Link>
            <Link
              href="/auth/register-staff"
              className="block text-sm text-amber-700 hover:text-amber-800"
            >
              Đăng ký làm nhân viên (WAITER)
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
