'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

type MenuOrderClientProps = {
  storeId: string
  tableOrderingEnabled?: boolean
  initialTableLabel?: string
}

type CartItem = {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  notes: string
}

export default function MenuOrderClient({
  storeId,
  tableOrderingEnabled = false,
  initialTableLabel = '',
}: MenuOrderClientProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

  const [cart, setCart] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableLabel, setTableLabel] = useState(() => (initialTableLabel || '').trim())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setTableLabel((initialTableLabel || '').trim())
  }, [initialTableLabel])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart])
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [cart],
  )

  const addToCart = (payload: { productId: string; productName: string; unitPrice: number }) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === payload.productId)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [
        ...prev,
        {
          productId: payload.productId,
          productName: payload.productName,
          unitPrice: payload.unitPrice,
          quantity: 1,
          notes: '',
        },
      ]
    })
    setIsOpen(true)
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const btn = target.closest('button[data-action="order"]') as HTMLButtonElement | null
      if (!btn) return

      const productId = btn.dataset.productId
      const productName = btn.dataset.productName
      const unitPrice = Number(btn.dataset.productPrice || 0)

      if (!productId || !productName || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        return
      }

      addToCart({ productId, productName, unitPrice })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const updateQuantity = (productId: string, nextQty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, nextQty) } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  const updateNotes = (productId: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, notes } : i)))
  }

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setTableLabel((initialTableLabel || '').trim())
    setIsOpen(false)
  }

  const submitOrder = async () => {
    if (!cart.length) {
      toast.error('Giỏ hàng đang trống')
      return
    }
    if (tableOrderingEnabled && !tableLabel.trim()) {
      toast.error('Vui lòng nhập mã bàn')
      return
    }

    setSubmitting(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const res = await fetch(`${apiUrl}/order/orders?storeId=${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          tableLabel: tableOrderingEnabled ? tableLabel.trim() || undefined : undefined,
          items: cart.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            priceAtTime: i.unitPrice,
            notes: i.notes || undefined,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Tạo đơn thất bại')
      }

      const order = await res.json()
      toast.success(`Đã gửi đơn thành công. Mã đơn: ${order?.id?.substring?.(0, 8) || ''}`)
      clearCart()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Gửi đơn thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {cartCount > 0 && (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition"
          onClick={() => setIsOpen(true)}
        >
          Giỏ hàng ({cartCount})
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-text">Giỏ hàng</h2>
                <p className="text-sm text-text-muted">Tổng: {cartTotal.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <button
                type="button"
                className="text-text-muted hover:text-text transition"
                onClick={() => setIsOpen(false)}
              >
                Đóng
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-text-muted">Giỏ hàng đang trống</div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-text">{item.productName}</div>
                        <div className="text-sm text-text-muted">
                          {item.unitPrice.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 transition text-sm"
                        onClick={() => removeItem(item.productId)}
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-border text-text hover:bg-background-muted transition"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <div className="min-w-[40px] text-center font-semibold">{item.quantity}</div>
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-border text-text hover:bg-background-muted transition"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm text-text-muted mb-1">Ghi chú</label>
                      <textarea
                        className="w-full border border-border rounded-md p-2 text-sm resize-none"
                        rows={2}
                        value={item.notes}
                        onChange={(e) => updateNotes(item.productId, e.target.value)}
                        placeholder="Ví dụ: không hành, cay ít..."
                      />
                    </div>
                  </div>
                ))}

                <div className="border border-border rounded-lg p-3">
                  <h3 className="font-semibold text-text mb-3">Thông tin khách hàng</h3>

                  <div className="space-y-3">
                    {tableOrderingEnabled && (
                      <div>
                        <label className="block text-sm text-text-muted mb-1">
                          Mã bàn / số bàn <span className="text-red-600">*</span>
                        </label>
                        <input
                          className="w-full border border-border rounded-md p-2 text-sm"
                          value={tableLabel}
                          onChange={(e) => setTableLabel(e.target.value)}
                          placeholder="Ví dụ: 5, A12..."
                          required
                        />
                        <p className="text-xs text-text-muted mt-1">
                          Có thể điền sẵn qua link QR (tham số ?table=...).
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Họ tên (tuỳ chọn)</label>
                      <input
                        className="w-full border border-border rounded-md p-2 text-sm"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Số điện thoại (tuỳ chọn)</label>
                      <input
                        className="w-full border border-border rounded-md p-2 text-sm"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                      onClick={() => clearCart()}
                    >
                      Xoá giỏ
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                      onClick={submitOrder}
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đơn'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

