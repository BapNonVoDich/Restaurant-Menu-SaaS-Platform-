import { generateMenuHTML } from './menuGenerator'
import type { CategoryItem, CustomizationSettings } from './types'

function mergeCustomization(
  base: CustomizationSettings | Record<string, unknown>,
  override?: Partial<CustomizationSettings>
): CustomizationSettings {
  if (!override || Object.keys(override).length === 0) {
    return base as CustomizationSettings
  }
  return { ...(base as CustomizationSettings), ...override }
}

/**
 * Normalize catalog API menu JSON for generateMenuHTML (same rules as public menu page).
 */
export function normalizeMenuApiCategories(menuData: { categories?: unknown[] }): CategoryItem[] {
  return (menuData.categories || []).map((category: any) => ({
    ...category,
    style: category.style || {},
    products: (category.products || []).map((product: any) => ({
      ...product,
      style: product.style || {},
      categoryIds: product.categoryIds || [],
      sortOrder: product.sortOrder ?? 0,
      isAvailable: product.isAvailable ?? true,
      price: typeof product.price === 'string' ? Number(product.price) : product.price,
    })),
  })) as CategoryItem[]
}

/**
 * Full HTML document for iframe srcDoc — dùng dữ liệu owner API (không cần cửa hàng ACTIVE).
 */
export function buildMenuPreviewFullDocument(
  storeName: string,
  menuData: Record<string, unknown>,
  backgroundUrl?: string | null,
  customizationOverride?: Partial<CustomizationSettings>
): string {
  const bg = (backgroundUrl ?? (menuData as { backgroundUrl?: string }).backgroundUrl ?? '').trim()
  const isPdf = bg.toLowerCase().endsWith('.pdf')
  const effectiveBg = isPdf ? '' : bg

  const categories = normalizeMenuApiCategories(menuData as { categories?: unknown[] })
  const baseCustom = ((menuData as { customization?: CustomizationSettings }).customization ||
    {}) as CustomizationSettings
  const customization = mergeCustomization(baseCustom, customizationOverride)

  return generateMenuHTML(
    categories,
    [],
    customization,
    storeName,
    effectiveBg || undefined,
    true
  )
}

/** Dữ liệu mẫu cho trang /demo/menu (không cần đăng nhập). */
export const DEMO_STORE_MENU = {
  backgroundUrl:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80&auto=format&fit=crop',
  customization: {
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    globalFontFamily: 'system-ui, -apple-system, sans-serif',
    globalTextColor: '#1f2937',
    globalBackgroundColor: '#ffffff',
    globalSpacing: '20px',
    theme: 'light' as const,
  },
  categories: [
    {
      id: 'demo-category',
      name: 'Thực đơn mẫu',
      sortOrder: 0,
      style: { layout: 'grid' as const, columns: 2 },
      products: [
        {
          id: 'demo-product-1',
          name: 'Món đặc trưng',
          description: 'Đây là dòng mô tả mẫu — bạn có thể chỉnh trên dashboard.',
          price: 89000,
          isAvailable: true,
          sortOrder: 0,
          categoryIds: ['demo-category'],
          style: {
            showImage: false,
            showDescription: true,
            showPrice: true,
          },
        },
        {
          id: 'demo-product-2',
          name: 'Đồ uống',
          description: '',
          price: 35000,
          isAvailable: true,
          sortOrder: 1,
          categoryIds: ['demo-category'],
          style: {
            showDescription: true,
            showPrice: true,
          },
        },
      ],
    },
  ],
}
