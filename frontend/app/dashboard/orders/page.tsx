'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { isWaiterOnlyFromClient } from '@/lib/authRoles'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [accessInfo, setAccessInfo] = useState<{ allowed: boolean; isOwner: boolean; isWaiter: boolean } | null>(null)
  const [tableInput, setTableInput] = useState('')
  const [appliedTableFilter, setAppliedTableFilter] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const waiterClient = isWaiterOnlyFromClient()

      // Waiters are assigned via store_staff; /stores/my-store would wrongly auto-create an owner store.
      const storeUrl = waiterClient
        ? `${apiUrl}/catalog/staff/my-store`
        : `${apiUrl}/catalog/stores/my-store`

      const storeResponse = await fetch(storeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!storeResponse.ok) {
        const errBody = await storeResponse.json().catch(() => ({}))
        const msg =
          errBody.message ||
          errBody.error ||
          (waiterClient
            ? 'Bạn chưa được chủ cửa hàng gán vào nhân viên. Liên hệ chủ quán hoặc đăng nhập đúng tài khoản.'
            : 'Không tải được thông tin cửa hàng.')
        toast.error(typeof msg === 'string' ? msg : 'Không tải được thông tin cửa hàng.')
        setStore(null)
        setOrders([])
        setBills([])
        setAccessInfo(null)
        return
      }

      const raw = await storeResponse.json()
      const storeData = waiterClient
        ? { id: raw.id, name: raw.name, slug: raw.slug }
        : raw
      setStore(storeData)

      const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}')
      if (authUser?.userId) {
        const accessRes = await fetch(`${apiUrl}/catalog/stores/${storeData.id}/staff/access?userId=${authUser.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (accessRes.ok) {
          const accessData = await accessRes.json()
          setAccessInfo({
            allowed: !!accessData.allowed,
            isOwner: !!accessData.isOwner,
            isWaiter: !!accessData.isWaiter,
          })
        }
      }

      const tq = appliedTableFilter.trim()
      const tableQuery = tq ? `?table=${encodeURIComponent(tq)}` : ''
      const ordersResponse = await fetch(`${apiUrl}/order/orders/stores/${storeData.id}${tableQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData || [])
      } else {
        setOrders([])
      }

      if (!waiterClient) {
        const billsResponse = await fetch(`${apiUrl}/order/bills/stores/${storeData.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (billsResponse.ok) {
          const billsData = await billsResponse.json()
          setBills(billsData || [])
        } else {
          setBills([])
        }
      } else {
        setBills([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Lỗi khi tải đơn hàng.')
    } finally {
      setLoading(false)
    }
  }, [router, apiUrl])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await fetchOrders()
  }, [fetchOrders])

  const handleExportBill = useCallback(async (orderId: string) => {
    if (isWaiterOnlyFromClient()) return
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`${apiUrl}/order/bills?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Xuất bill thất bại')
      }

      toast.success('Đã xuất bill')
      await refreshAll()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Xuất bill thất bại')
    } finally {
      setActionLoading(false)
    }
  }, [apiUrl, refreshAll, router])

  const handleUpdateBillStatus = useCallback(async (billId: string, status: string) => {
    if (isWaiterOnlyFromClient()) return
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`${apiUrl}/order/bills/${billId}/status?status=${encodeURIComponent(status)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Cập nhật bill thất bại')
      }

      toast.success('Đã cập nhật bill')
      await refreshAll()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Cập nhật bill thất bại')
    } finally {
      setActionLoading(false)
    }
  }, [apiUrl, refreshAll, router])

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`${apiUrl}/order/orders/${orderId}/status?status=${encodeURIComponent(status)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Cập nhật trạng thái đơn thất bại')
      }

      toast.success('Đã cập nhật trạng thái đơn')
      await refreshAll()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Cập nhật trạng thái đơn thất bại')
    } finally {
      setActionLoading(false)
    }
  }, [apiUrl, refreshAll, router])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Đang tải...</div>
      </div>
    )
  }

  const billsByOrderId = new Map<string, any>()
  for (const bill of bills) {
    if (bill?.orderId) billsByOrderId.set(bill.orderId, bill)
  }
  const canManageOrders = !!accessInfo?.isWaiter || !!accessInfo?.isOwner
  const canManageBills = !!accessInfo?.isOwner
  const hideBillUi = isWaiterOnlyFromClient()
  const tableColSpan = hideBillUi ? 7 : 8

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold text-text mb-6">Đơn hàng</h1>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Lọc theo bàn</label>
            <input
              type="text"
              className="input-field w-48"
              placeholder="VD: 5, A12"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setAppliedTableFilter(tableInput.trim())}
          >
            Áp dụng
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border border-border text-sm"
            onClick={() => {
              setTableInput('')
              setAppliedTableFilter('')
            }}
          >
            Xoá lọc
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bàn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Món
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái đơn
                </th>
                {!hideBillUi && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái bill
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => {
                  const bill = billsByOrderId.get(order.id)
                  const billStatus = bill?.status || '-'
                  const isBillExported = bill?.status === 'EXPORTED'
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.tableLabel?.trim() ? order.tableLabel : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.items?.length || 0} món
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.totalAmount?.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                      {!hideBillUi && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            {billStatus}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!bill && canManageBills ? (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition"
                            disabled={actionLoading}
                            onClick={() => handleExportBill(order.id)}
                          >
                            Xuất bill
                          </button>
                        ) : bill ? (
                          <div className="flex gap-2">
                            {canManageBills && <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                setSelectedBill(bill)
                                setIsBillModalOpen(true)
                              }}
                              disabled={!bill || !isBillExported}
                            >
                              Xem bill
                            </button>}
                            {canManageBills && <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading || !isBillExported}
                              onClick={() => handleUpdateBillStatus(bill.id, 'COMPLETED')}
                            >
                              Hoàn thành
                            </button>}
                            {canManageBills && <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading || !isBillExported}
                              onClick={() => handleUpdateBillStatus(bill.id, 'CANCELLED')}
                            >
                              Hủy
                            </button>}
                          </div>
                        ) : null}
                        {canManageOrders && (
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading || order.status !== 'PENDING'}
                              onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                            >
                              Xác nhận
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading || order.status === 'DONE' || order.status === 'CANCELLED'}
                              onClick={() => handleUpdateOrderStatus(order.id, 'DONE')}
                            >
                              Done
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={actionLoading || order.status === 'DONE' || order.status === 'CANCELLED'}
                              onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                            >
                              Huỷ đơn
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center">
                    <div className="text-gray-600 mb-2">Chưa có đơn hàng.</div>
                    <div className="text-sm text-gray-500">Khi khách đặt món, các đơn sẽ hiển thị tại đây.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!hideBillUi && isBillModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsBillModalOpen(false)
              setSelectedBill(null)
            }}
          />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background border border-border rounded-lg shadow-xl p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-text">Chi tiết bill</h2>
                <div className="text-sm text-text-muted mt-1">
                  Mã bill: {selectedBill.id?.substring?.(0, 8) || ''}
                </div>
              </div>
              <button
                type="button"
                className="text-text-muted hover:text-text transition"
                onClick={() => {
                  setIsBillModalOpen(false)
                  setSelectedBill(null)
                }}
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-border rounded-lg p-3 bg-background-muted">
                <div className="text-sm text-text-muted">Mã đơn</div>
                <div className="font-semibold text-text mt-1">
                  {selectedBill.orderId?.substring?.(0, 8) || ''}
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 bg-background-muted">
                <div className="text-sm text-text-muted">Tổng</div>
                <div className="font-semibold text-text mt-1">
                  {Number(selectedBill.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Món
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background">
                  {(selectedBill.items || []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2 text-sm text-text">{it.productName}</td>
                      <td className="px-4 py-2 text-sm text-text">{it.quantity}</td>
                      <td className="px-4 py-2 text-sm text-text">
                        {Number(it.priceAtTime || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-2 text-sm text-text-muted">{it.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
