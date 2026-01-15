'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function DashboardPage() {
  const router = useRouter()
  const t = useTranslation()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)

  const checkStoreStatus = useCallback(async () => {
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

      if (response.status === 404) {
        // Store should be auto-created, but if not found, try refreshing
        // The backend will auto-create it on next request
        setTimeout(() => checkStoreStatus(), 1000)
        return
      }

      if (response.ok) {
        const storeData = await response.json()
        setStore(storeData)

        // Allow dashboard access regardless of subscription status
        // Users can edit/view their menu even if not published (INACTIVE)
        // Subscription is only needed to PUBLISH the menu (make it public)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking store status:', error)
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkStoreStatus()
  }, [checkStoreStatus])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t.dashboard.status.active
      case 'INACTIVE':
        return t.dashboard.status.inactive
      case 'TRIAL':
        return t.dashboard.status.trial
      case 'EXPIRED':
        return t.dashboard.status.expired
      default:
        return status
    }
  }
  
  const getTrialDaysLeft = () => {
    if (!store?.trialEndDate) return null
    const endDate = new Date(store.trialEndDate)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
  
  const isTrialActive = () => {
    if (!store?.trialStartDate || !store?.trialEndDate) return false
    const start = new Date(store.trialStartDate)
    const end = new Date(store.trialEndDate)
    const now = new Date()
    return now >= start && now <= end
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-text">{t.dashboard.title}</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border rounded-md hover:bg-background-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
          >
            {t.common.logout}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {store && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="card p-4 space-y-2">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-text bg-primary-50 rounded-md font-medium transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.overview}
                </Link>
                <Link
                  href="/dashboard/menu"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.menuManagement}
                </Link>
                <Link
                  href="/dashboard/categories"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.categories}
                </Link>
                <Link
                  href="/dashboard/products"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.products}
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.orders}
                </Link>
                <Link
                  href="/setup/subscription"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.subscription}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-text-muted hover:bg-background-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                >
                  {t.dashboard.storeSettings}
                </Link>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Store Info Card */}
              <div className="card p-6">
                <div className="mb-4 pb-4 border-b border-border">
                  <h2 className="font-heading text-2xl font-semibold text-text">{store.name}</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-text-muted block mb-1">{t.dashboard.urlSlug}:</span>
                    <p className="text-base text-text font-mono bg-background-muted px-3 py-2 rounded border border-border">{store.slug}</p>
                    <p className="text-xs text-text-muted mt-1">{t.dashboard.menuUrl}: <span className="font-mono">/menu/{store.slug}</span></p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-muted block mb-1">{t.dashboard.publicationStatus}:</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(store.subStatus)}`}>
                      {getStatusText(store.subStatus)}
                    </span>
                    {isTrialActive() && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {t.dashboard.trialStatus.active} - {t.dashboard.trialStatus.daysLeft.replace('{days}', getTrialDaysLeft()?.toString() || '0')}
                        </span>
                      </div>
                    )}
                  </div>
                  {store.description && (
                    <div>
                      <span className="text-sm font-medium text-text-muted block mb-1">{t.dashboard.description}:</span>
                      <p className="text-base text-text">{store.description}</p>
                    </div>
                  )}
                  {!store.description && (
                    <div>
                      <span className="text-sm font-medium text-text-muted block mb-1">{t.dashboard.description}:</span>
                      <p className="text-sm text-text-light italic">{t.dashboard.noDescription} <Link href="/dashboard/settings" className="text-primary-600 hover:underline">{t.common.edit}</Link></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="font-heading text-lg font-semibold text-text mb-4">{t.dashboard.quickActions}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/dashboard/products"
                    className="card-hover block p-4"
                  >
                    <h4 className="font-medium text-text mb-1">{t.dashboard.addProduct}</h4>
                    <p className="text-sm text-text-muted">{t.dashboard.addProductDesc}</p>
                  </Link>
                  <Link
                    href="/dashboard/categories"
                    className="card-hover block p-4"
                  >
                    <h4 className="font-medium text-text mb-1">{t.dashboard.manageCategories}</h4>
                    <p className="text-sm text-text-muted">{t.dashboard.manageCategoriesDesc}</p>
                  </Link>
                  {store.subStatus !== 'ACTIVE' && (
                    <Link
                      href="/setup/subscription"
                      className="card-hover block p-4 border-primary-300 bg-primary-50"
                    >
                      <h4 className="font-medium text-blue-900 mb-1">{t.dashboard.publishMenu}</h4>
                      <p className="text-sm text-blue-700">{t.dashboard.publishMenuDesc}</p>
                    </Link>
                  )}
                  {store.subStatus === 'ACTIVE' && (
                    <div className="block p-4 border border-green-300 rounded-lg bg-green-50">
                      <h4 className="font-medium text-green-900 mb-1">{t.dashboard.menuIsLive}</h4>
                      <p className="text-sm text-green-700">
                        {t.dashboard.menuIsLiveDesc}: <span className="font-mono text-xs">/menu/{store.slug}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {store.subStatus === 'INACTIVE' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">{t.dashboard.banner.private}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Trial Status Banner */}
              {isTrialActive() && store.subStatus === 'INACTIVE' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">{t.subscription.trialActive}</span> {t.dashboard.trialStatus.daysLeft.replace('{days}', getTrialDaysLeft()?.toString() || '0')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
