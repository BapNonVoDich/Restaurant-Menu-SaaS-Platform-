import { notFound } from 'next/navigation'
import { generateMenuInlineFragment } from '@/lib/menuEditor/menuGenerator'
import MenuOrderClient from '@/components/MenuOrder/MenuOrderClient'

interface MenuPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ table?: string }>
}

async function getStoreBySlug(slug: string) {
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

    return store
  } catch (error) {
    console.error('Error fetching store:', error)
    return null
  }
}

export default async function MenuPage({ params, searchParams }: MenuPageProps) {
  const { slug } = await params
  const sp = await searchParams
  const tableFromQuery = typeof sp?.table === 'string' ? sp.table : ''
  const storeData = await getStoreBySlug(slug)

  if (!storeData) {
    notFound()
  }

  if (storeData.closed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cửa hàng tạm thời đóng cửa</h1>
          <p className="text-gray-600">Hiện tại cửa hàng chưa sẵn sàng.</p>
        </div>
      </div>
    )
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
  const menuRes = await fetch(`${apiUrl}/catalog/stores/${storeData.id}/menu`, {
    cache: 'no-store',
  })

  if (!menuRes.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Menu hiện không khả dụng</h1>
          <p className="text-gray-600">Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  const menuData = await menuRes.json()
  const tableOrderingEnabled = Boolean(menuData?.tableOrderingEnabled)

  const backgroundUrl = menuData?.backgroundUrl || ''
  const isPdfBackground = backgroundUrl.trim().toLowerCase().endsWith('.pdf')

  // Keep legacy behavior for PDF upload.
  if (isPdfBackground) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-2">{storeData.name}</h1>
            {storeData.description && (
              <p className="text-lg text-text-muted">{storeData.description}</p>
            )}
          </div>
          <div className="flex justify-center items-center">
            <iframe
              src={backgroundUrl}
              className="w-full h-screen border-0"
              title="Menu PDF"
            />
          </div>
        </div>
      </div>
    )
  }

  const normalizedCategories = (menuData.categories || []).map((category: any) => ({
    ...category,
    style: category.style || {},
    products: (category.products || []).map((product: any) => ({
      ...product,
      style: product.style || {},
      categoryIds: product.categoryIds || [],
      sortOrder: product.sortOrder ?? 0,
      isAvailable: product.isAvailable ?? true,
      // Ensure price is a number for menuGenerator (Jackson BigDecimal should already be numeric,
      // but we normalize to avoid surprises).
      price: typeof product.price === 'string' ? Number(product.price) : product.price,
    })),
  }))

  const safeBgUrl = backgroundUrl.trim()
    ? String(backgroundUrl).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    : ''

  return (
    <div
      className={`min-h-screen w-full ${!safeBgUrl ? 'bg-background' : ''}`}
      style={
        safeBgUrl
          ? {
              backgroundImage: `url("${safeBgUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      <div
        dangerouslySetInnerHTML={{
          __html: generateMenuInlineFragment(
            normalizedCategories,
            [],
            menuData.customization || {},
            storeData.name,
            true
          ),
        }}
      />
      <MenuOrderClient
        storeId={storeData.id}
        tableOrderingEnabled={tableOrderingEnabled}
        initialTableLabel={typeof tableFromQuery === 'string' ? tableFromQuery : ''}
      />
    </div>
  )
}
