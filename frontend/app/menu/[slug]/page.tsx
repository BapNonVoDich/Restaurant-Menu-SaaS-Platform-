import { notFound } from 'next/navigation'

interface MenuPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getStoreMenu(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${slug}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    const store = await res.json()

    // Check if store has active subscription
    if (store.subStatus !== 'ACTIVE') {
      return { ...store, closed: true }
    }

    // Fetch menu
    const menuRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/menu`, {
      cache: 'no-store',
    })

    if (menuRes.ok) {
      const menu = await menuRes.json()
      return { ...store, menu }
    }

    return store
  } catch (error) {
    console.error('Error fetching store menu:', error)
    return null
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params
  const storeData = await getStoreMenu(slug)

  if (!storeData) {
    notFound()
  }

  if (storeData.closed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Temporarily Closed</h1>
          <p className="text-gray-600">This store is not available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-2">{storeData.name}</h1>
          {storeData.description && (
            <p className="text-lg text-text-muted">{storeData.description}</p>
          )}
        </div>
        {/* TODO: Display menu items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Menu items will be rendered here */}
        </div>
      </div>
    </div>
  )
}
