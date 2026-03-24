'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isWaiterOnlyFromClient } from '@/lib/authRoles'

const WAITER_DASHBOARD_PATH = '/dashboard/orders'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isWaiterOnlyFromClient()) return
    const onOrders =
      pathname === WAITER_DASHBOARD_PATH || pathname?.startsWith(`${WAITER_DASHBOARD_PATH}/`)
    if (onOrders) return
    router.replace(WAITER_DASHBOARD_PATH)
  }, [pathname, router])

  return <>{children}</>
}
