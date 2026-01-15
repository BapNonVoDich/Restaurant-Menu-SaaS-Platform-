'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

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
        })
      }
    } catch (error) {
      console.error('Error fetching store:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      // TODO: Implement update store endpoint
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/catalog/stores/${store.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(formData),
      // })

      // if (response.ok) {
      // Could add toast notification here for success
      //   fetchStore()
      // } else {
      // Could add toast notification here for error
      // }
      console.warn('Store update endpoint not yet implemented')
    } catch (error) {
      console.error('Error updating store:', error)
      // Could add toast notification here
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-text">Store Settings</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-text-muted bg-white border border-border rounded-md hover:bg-background-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-4">Store Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4" method="post" action="#">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Store Name *
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
                URL Slug *
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
                Your menu will be available at: /menu/{formData.slug || 'your-slug'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Description
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Store description..."
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
