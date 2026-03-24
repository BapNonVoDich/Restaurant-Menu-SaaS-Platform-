'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/identity/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        // Store JWT token and redirect to dashboard
        // Store will be auto-created when dashboard loads
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('auth_user', JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          roles: data.roles || [],
        }))
        router.push('/dashboard')
      } else {
        // Handle error - try to get error message from response
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = ''
        
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'object') {
          // Handle validation errors (object with field names as keys)
          errorMessage = Object.entries(errorData)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n')
        } else {
          errorMessage = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 card shadow-soft-lg p-8 sm:p-10">
        <div>
          <h2 className="font-heading mt-6 text-center text-3xl font-bold text-text">
            Tạo tài khoản của bạn
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Bắt đầu với nền tảng quản lý nhà hàng của bạn
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
              <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                autoComplete="new-password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="input-field"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm text-red-800 whitespace-pre-line font-medium">
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
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/login"
              className="block text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded transition-colors duration-200 cursor-pointer"
            >
              Bạn đã có tài khoản? Đăng nhập
            </Link>
            <Link href="/auth/register-staff" className="block text-sm text-amber-700 hover:text-amber-800">
              Bạn là nhân viên? Đăng ký tài khoản WAITER
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
