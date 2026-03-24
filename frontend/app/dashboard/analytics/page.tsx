'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { isWaiterOnlyFromClient } from '@/lib/authRoles'

type OrderItem = {
  productId?: string
  productName?: string
  quantity?: number
  priceAtTime?: number
}

type Order = {
  id: string
  totalAmount?: number
  status?: string
  createdAt?: string
  items?: OrderItem[]
}

type AggregatedPoint = {
  label: string
  orders: number
  revenue: number
}

type ProductPoint = {
  productName: string
  quantity: number
  revenue: number
}

const DAY_WINDOW_OPTIONS = [7, 14, 30]
const MONTH_WINDOW_OPTIONS = [6, 12]

const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN')

function formatCurrency(value: number) {
  return `${CURRENCY_FORMATTER.format(Math.round(value))} VNĐ`
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function makeLastDays(windowSize: number): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = windowSize - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

function makeLastMonths(windowSize: number): Date[] {
  const months: Date[] = []
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = windowSize - 1; i >= 0; i -= 1) {
    const d = new Date(base)
    d.setMonth(base.getMonth() - i)
    months.push(d)
  }
  return months
}

export default function AnalyticsPage() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [mode, setMode] = useState<'day' | 'month'>('day')
  const [dayWindow, setDayWindow] = useState<number>(14)
  const [monthWindow, setMonthWindow] = useState<number>(12)

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const waiterClient = isWaiterOnlyFromClient()
      const storeUrl = waiterClient
        ? `${apiUrl}/catalog/staff/my-store`
        : `${apiUrl}/catalog/stores/my-store`

      const storeRes = await fetch(storeUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!storeRes.ok) {
        throw new Error('Không tải được cửa hàng')
      }

      const storeData = await storeRes.json()
      setStoreName(storeData?.name || 'Cửa hàng')

      const ordersRes = await fetch(`${apiUrl}/order/orders/stores/${storeData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!ordersRes.ok) {
        throw new Error('Không tải được đơn hàng')
      }

      const ordersData = await ordersRes.json()
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Lỗi khi tải thống kê')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const validOrders = useMemo(
    () => orders.filter((order) => order.status !== 'CANCELLED' && !!order.createdAt),
    [orders]
  )

  const summary = useMemo(() => {
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    const totalOrders = validOrders.length
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0
    return { revenue, totalOrders, avgOrderValue }
  }, [validOrders])

  const dailySeries = useMemo<AggregatedPoint[]>(() => {
    const buckets = makeLastDays(dayWindow)
    const map = new Map<string, AggregatedPoint>()
    for (const d of buckets) {
      const key = formatDayKey(d)
      const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      map.set(key, { label, orders: 0, revenue: 0 })
    }

    for (const order of validOrders) {
      const dt = new Date(order.createdAt as string)
      const key = formatDayKey(dt)
      const point = map.get(key)
      if (!point) continue
      point.orders += 1
      point.revenue += Number(order.totalAmount || 0)
    }

    return Array.from(map.values())
  }, [dayWindow, validOrders])

  const monthlySeries = useMemo<AggregatedPoint[]>(() => {
    const buckets = makeLastMonths(monthWindow)
    const map = new Map<string, AggregatedPoint>()
    for (const d of buckets) {
      const key = formatMonthKey(d)
      const label = d.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' })
      map.set(key, { label, orders: 0, revenue: 0 })
    }

    for (const order of validOrders) {
      const dt = new Date(order.createdAt as string)
      const key = formatMonthKey(dt)
      const point = map.get(key)
      if (!point) continue
      point.orders += 1
      point.revenue += Number(order.totalAmount || 0)
    }

    return Array.from(map.values())
  }, [monthWindow, validOrders])

  const topProducts = useMemo<ProductPoint[]>(() => {
    const map = new Map<string, ProductPoint>()
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const name = (item.productName || 'Món không tên').trim() || 'Món không tên'
        const qty = Number(item.quantity || 0)
        const revenue = qty * Number(item.priceAtTime || 0)
        if (!map.has(name)) {
          map.set(name, { productName: name, quantity: 0, revenue: 0 })
        }
        const cur = map.get(name)!
        cur.quantity += qty
        cur.revenue += revenue
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [validOrders])

  const activeSeries = mode === 'day' ? dailySeries : monthlySeries
  const maxRevenue = Math.max(...activeSeries.map((s) => s.revenue), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-text-muted">Đang tải trang thống kê...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Phân tích kinh doanh</h1>
          <p className="text-sm text-text-muted mt-1">Theo dõi doanh thu và hiệu suất món của {storeName}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-sm text-text-muted">Tổng doanh thu (không tính đơn huỷ)</div>
            <div className="text-2xl font-semibold text-text mt-1">{formatCurrency(summary.revenue)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-text-muted">Tổng số đơn</div>
            <div className="text-2xl font-semibold text-text mt-1">{summary.totalOrders}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-text-muted">Giá trị trung bình / đơn</div>
            <div className="text-2xl font-semibold text-text mt-1">{formatCurrency(summary.avgOrderValue)}</div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-heading text-lg font-semibold text-text">Doanh thu theo thời gian</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-sm border ${
                  mode === 'day' ? 'bg-primary-600 text-white border-primary-600' : 'border-border'
                }`}
                onClick={() => setMode('day')}
              >
                Theo ngày
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded text-sm border ${
                  mode === 'month' ? 'bg-primary-600 text-white border-primary-600' : 'border-border'
                }`}
                onClick={() => setMode('month')}
              >
                Theo tháng
              </button>

              {mode === 'day' ? (
                <select
                  className="input-field py-1.5"
                  value={dayWindow}
                  onChange={(e) => setDayWindow(Number(e.target.value))}
                >
                  {DAY_WINDOW_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v} ngày gần nhất
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="input-field py-1.5"
                  value={monthWindow}
                  onChange={(e) => setMonthWindow(Number(e.target.value))}
                >
                  {MONTH_WINDOW_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v} tháng gần nhất
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              {activeSeries.map((item) => {
                const widthPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>{item.label}</span>
                      <span>{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="h-3 rounded bg-background-muted overflow-hidden">
                      <div className="h-full bg-primary-500 transition-all" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Mốc</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Số đơn</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSeries.map((item) => (
                    <tr key={item.label} className="border-t border-border">
                      <td className="px-4 py-2 text-sm text-text">{item.label}</td>
                      <td className="px-4 py-2 text-sm text-text">{item.orders}</td>
                      <td className="px-4 py-2 text-sm text-text">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-4">Top món bán chạy</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Món</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Số lượng</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((item) => (
                    <tr key={item.productName} className="border-t border-border">
                      <td className="px-4 py-2 text-sm text-text">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-text">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-text">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-sm text-text-muted text-center">
                      Chưa có dữ liệu món để phân tích.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
