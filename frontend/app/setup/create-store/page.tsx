'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateStorePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Redirect to subscription setup
        router.push('/setup/subscription')
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Failed to create store'
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error creating store:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 card shadow-soft-lg p-8 sm:p-10">
        <div>
          <h2 className="font-heading mt-6 text-center text-3xl font-bold text-text">
            Create Your Store
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Set up your restaurant profile to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="post" action="#">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
                Store Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="organization"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-text mb-1">
                URL Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                pattern="[a-z0-9-]+"
                placeholder="e.g., pizza-hanoi"
                className="input-field"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              />
              <p className="mt-1 text-xs text-text-muted">Only lowercase letters, numbers, and hyphens</p>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="input-field resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
