'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WYSIWYGMenuEditor from '@/components/MenuEditor/WYSIWYGMenuEditor'

export default function MenuPage() {
  console.log('MenuPage component rendering')
  const router = useRouter()
  const [store, setStore] = useState<any>(null)

  useEffect(() => {
    console.log('MenuPage useEffect running')
    const token = localStorage.getItem('token')
    console.log('Token:', token ? 'exists' : 'missing')
    if (!token) {
      console.log('No token, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Get store ID for the editor
    console.log('Fetching store data...')
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        console.log('Store response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Store data received:', data)
        setStore(data)
      })
      .catch(err => {
        console.error('Error fetching store:', err)
      })
  }, [router])

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  console.log('MenuPage render:', { hasToken: !!token, hasStore: !!store, store })

  if (!token || !store) {
    console.log('MenuPage: Waiting for token/store')
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Đang tải...</div>
      </div>
    )
  }

  console.log('MenuPage: Rendering WYSIWYGMenuEditor with:', { storeId: store.id, storeName: store.slug })
  return (
    <WYSIWYGMenuEditor
      storeId={store.id}
      storeName={store.slug}
      token={token}
    />
  )
}
