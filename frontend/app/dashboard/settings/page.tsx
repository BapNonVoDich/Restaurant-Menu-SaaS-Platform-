'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PublicMenuLinkBlock from '@/components/PublicMenuLinkBlock'

export default function SettingsPage() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staffSearch, setStaffSearch] = useState('')
  const [staffSearchResults, setStaffSearchResults] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [staffList, setStaffList] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffSearching, setStaffSearching] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    tableOrderingEnabled: false,
  })
  const [domainInput, setDomainInput] = useState('')
  const [domainBusy, setDomainBusy] = useState(false)
  const [domainMessage, setDomainMessage] = useState<string | null>(null)

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
        setFormData({
          name: storeData.name || '',
          slug: storeData.slug || '',
          description: storeData.description || '',
          tableOrderingEnabled: !!storeData.tableOrderingEnabled,
        })
        setDomainInput(storeData.customDomain || '')
        setDomainMessage(null)
        await fetchStoreStaff(storeData.id, token)
      }
    } catch (error) {
      console.error('Error fetching store:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchStoreStaff = async (storeId: string, token: string) => {
    try {
      setStaffLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${storeId}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStaffList(Array.isArray(data) ? data : [])
      } else {
        setStaffList([])
      }
    } finally {
      setStaffLoading(false)
    }
  }

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    // Show confirmation dialog
    if (!confirm('Bạn có chắc chắn muốn lưu thay đổi?')) {
      return // Early return - saving state remains false
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Chưa đăng nhập')
        setSaving(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          tableOrderingEnabled: formData.tableOrderingEnabled,
        }),
      })

      if (response.ok) {
        toast.success('Lưu thay đổi thành công')
        fetchStore()
      } else {
        const error = await response.json().catch(() => ({ error: 'Cập nhật cửa hàng thất bại' }))
        toast.error(error.error || 'Có lỗi xảy ra khi lưu thay đổi')
      }
    } catch (error) {
      console.error('Error updating store:', error)
      toast.error('Có lỗi xảy ra khi lưu thay đổi')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomDomain = async () => {
    if (!store) return
    try {
      setDomainBusy(true)
      setDomainMessage(null)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Chưa đăng nhập')
        return
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const res = await fetch(`${apiUrl}/catalog/stores/${store.id}/custom-domain`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: domainInput.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Không lưu được tên miền')
        return
      }
      setDomainMessage(data.instructions || 'Đã cập nhật tên miền.')
      toast.success('Đã cập nhật tên miền')
      await fetchStore()
    } catch (e) {
      toast.error('Lỗi khi lưu tên miền')
    } finally {
      setDomainBusy(false)
    }
  }

  const handleVerifyCustomDomain = async () => {
    if (!store) return
    try {
      setDomainBusy(true)
      setDomainMessage(null)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Chưa đăng nhập')
        return
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const res = await fetch(`${apiUrl}/catalog/stores/${store.id}/custom-domain/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Không kiểm tra được DNS')
        return
      }
      setDomainMessage(data.instructions || (data.domainVerified ? 'Đã xác minh.' : 'Chưa thấy TXT hợp lệ.'))
      toast[data.domainVerified ? 'success' : 'error'](
        data.domainVerified ? 'Xác minh tên miền thành công' : 'Chưa xác minh được — kiểm tra bản ghi TXT',
      )
      await fetchStore()
    } catch (e) {
      toast.error('Lỗi khi kiểm tra DNS')
    } finally {
      setDomainBusy(false)
    }
  }

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !selectedStaff?.id) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Chưa đăng nhập')
        return
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedStaff.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Không thể thêm nhân viên')
      }
      toast.success('Đã thêm nhân viên')
      setSelectedStaff(null)
      setStaffSearch('')
      setStaffSearchResults([])
      await fetchStoreStaff(store.id, token)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm nhân viên')
    }
  }

  const handleSearchStaff = async () => {
    if (!staffSearch.trim()) return
    try {
      setStaffSearching(true)
      const token = localStorage.getItem('token')
      if (!token) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const res = await fetch(`${apiUrl}/identity/users/search?query=${encodeURIComponent(staffSearch.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Không thể tìm nhân viên')
      const data = await res.json()
      const normalized = Array.isArray(data) ? data : []
      setStaffSearchResults(normalized)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tìm nhân viên')
      setStaffSearchResults([])
    } finally {
      setStaffSearching(false)
    }
  }

  const handleRemoveWaiter = async (userId: string) => {
    if (!store) return
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Chưa đăng nhập')
        return
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/staff/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Không thể xoá nhân viên')
      }
      toast.success('Đã xoá nhân viên')
      await fetchStoreStaff(store.id, token)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xoá nhân viên')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold text-text mb-6">Cài đặt cửa hàng</h1>
        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-4">Thông tin cửa hàng</h2>
          <form onSubmit={handleSubmit} className="space-y-4" method="post" action="#">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Tên cửa hàng *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Đường dẫn (slug) *
              </label>
              <input
                type="text"
                required
                pattern="[a-z0-9-]+"
                className="input-field font-mono"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="my-restaurant"
              />
              <p className="mt-1 text-sm text-text-muted">
                Menu công khai (sau khi lưu slug): /menu/{formData.slug || 'menu-cua-ban'}
              </p>
              {formData.slug?.trim() ? (
                <div className="mt-4 p-3 rounded-lg border border-border bg-background-muted">
                  <p className="text-xs font-medium text-text-muted mb-2">Truy cập nhanh menu trực tuyến</p>
                  <PublicMenuLinkBlock slug={formData.slug.trim()} />
                </div>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Mô tả
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả cửa hàng..."
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-background-muted">
              <input
                id="table-ordering"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border"
                checked={formData.tableOrderingEnabled}
                onChange={(e) => setFormData({ ...formData, tableOrderingEnabled: e.target.checked })}
              />
              <label htmlFor="table-ordering" className="text-sm text-text cursor-pointer">
                <span className="font-medium">Đặt món theo bàn</span>
                <p className="text-text-muted mt-1">
                  Khi bật, khách phải nhập mã bàn (hoặc dùng link có <code className="text-xs bg-background px-1 rounded">?table=</code>) trên menu công khai.
                </p>
              </label>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6 mt-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-2">Tên miền tùy chỉnh (menu)</h2>
          <p className="text-sm text-text-muted mb-4">
            Sau khi xác minh TXT, truy cập bằng hostname này sẽ mở menu công khai. Xem file{' '}
            <code className="text-xs bg-background-muted px-1 rounded">docs/CUSTOM_DOMAIN.md</code> trong repo để cấu hình DNS và TLS.
          </p>
          <div className="space-y-3 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Hostname (vd. menu.nhahang.com)</label>
              <input
                type="text"
                className="input-field font-mono"
                placeholder="menu.example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onBlur={() => setDomainInput((s) => s.trim().toLowerCase())}
                disabled={domainBusy}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary disabled:opacity-50"
                disabled={domainBusy}
                onClick={handleSaveCustomDomain}
              >
                {domainBusy ? 'Đang xử lý...' : 'Lưu tên miền'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded border border-border text-sm disabled:opacity-50"
                disabled={domainBusy || !domainInput.trim()}
                onClick={handleVerifyCustomDomain}
              >
                Kiểm tra DNS
              </button>
            </div>
            {store?.domainVerified ? (
              <p className="text-sm text-green-700">Tên miền đã xác minh — trỏ DNS (A/CNAME) về máy chủ chạy frontend.</p>
            ) : domainInput.trim() ? (
              <p className="text-sm text-text-muted">Trạng thái: chưa xác minh TXT.</p>
            ) : null}
            {domainMessage ? (
              <p className="text-sm text-text border border-border rounded p-3 bg-background-muted whitespace-pre-wrap">
                {domainMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-4">Nhân viên theo cửa hàng (WAITER)</h2>
          <p className="text-sm text-text-muted mb-4">
            Tìm theo username hoặc email. Có thể thêm tài khoản chủ cửa khác hoặc tài khoản đăng ký riêng làm nhân viên (WAITER).
          </p>
          <form onSubmit={handleAddWaiter} className="flex gap-2 mb-4" method="post" action="#">
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo username hoặc email"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
            />
            <button type="button" className="px-4 py-2 rounded border border-border" onClick={handleSearchStaff}>
              {staffSearching ? 'Đang tìm...' : 'Tìm'}
            </button>
            <button type="submit" className="btn-primary">Thêm nhân viên</button>
          </form>
          {selectedStaff && (
            <div className="text-sm text-text-muted mb-3">
              Đã chọn: <span className="font-medium text-text">{selectedStaff.username}</span> ({selectedStaff.email})
              {Array.isArray(selectedStaff.roles) && selectedStaff.roles.length > 0 && (
                <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                  {selectedStaff.roles.map((r: string) => (
                    <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
                      {r}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}
          {staffSearchResults.length > 0 && (
            <div className="space-y-2 mb-4">
              {staffSearchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full text-left border border-border rounded p-2 hover:bg-background-muted"
                  onClick={() => setSelectedStaff(user)}
                >
                  <div className="font-medium text-text">{user.username}</div>
                  <div className="text-xs text-text-muted">{user.email}</div>
                  {Array.isArray(user.roles) && user.roles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.roles.map((r: string) => (
                        <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {staffLoading ? (
            <div className="text-sm text-text-muted">Đang tải danh sách nhân viên...</div>
          ) : (
            <div className="space-y-2">
              {staffList.length === 0 && <div className="text-sm text-text-muted">Chưa có nhân viên được gán.</div>}
              {staffList.map((staff) => (
                <div key={staff.id || staff.userId} className="flex items-center justify-between border border-border rounded p-2">
                  <div className="text-sm text-text">
                    <span className="font-mono">{staff.userId}</span> - {staff.role}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition"
                    onClick={() => handleRemoveWaiter(staff.userId)}
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
