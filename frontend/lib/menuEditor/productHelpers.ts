// Helper functions for product management

import { ProductItem, CustomElement, ProductStyle } from './types'

/**
 * Creates default custom elements for a product
 * Uses fieldOrder from globalProductCardStyle if provided
 */
export function createDefaultProductElements(product: ProductItem, globalProductCardStyle?: ProductStyle): CustomElement[] {
  const elements: CustomElement[] = []
  
  // Get field order from global style or use default
  const fieldOrder = globalProductCardStyle?.fieldOrder || {
    name: 0,
    image: 1,
    description: 2,
    price: 3
  }

  // Create all field elements
  const fieldElements: CustomElement[] = []

  // Product name
  fieldElements.push({
    id: `product-name-${product.id}`,
    type: 'product-name',
    content: product.name,
    style: {
      fontSize: '1.25rem',
      fontWeight: '600',
      textColor: '#111827',
      ...(globalProductCardStyle?.textColor && { textColor: globalProductCardStyle.textColor })
    },
    sortOrder: fieldOrder.name ?? 0,
    parentId: product.id,
    parentType: 'product',
    fieldData: {
      productId: product.id,
      fieldType: 'name'
    }
  })

  // Product image (if exists)
  if (product.imageUrl) {
    fieldElements.push({
      id: `product-image-${product.id}`,
      type: 'product-image',
      content: product.imageUrl,
      style: {
        width: '100%',
        height: '200px'
      },
      sortOrder: fieldOrder.image ?? 1,
      parentId: product.id,
      parentType: 'product',
      fieldData: {
        productId: product.id,
        fieldType: 'image'
      }
    })
  }

  // Product description (if exists)
  if (product.description) {
    fieldElements.push({
      id: `product-description-${product.id}`,
      type: 'product-description',
      content: product.description,
      style: {
        fontSize: '0.9rem',
        textColor: '#6b7280',
        ...(globalProductCardStyle?.textColor && { textColor: globalProductCardStyle.textColor })
      },
      sortOrder: fieldOrder.description ?? 2,
      parentId: product.id,
      parentType: 'product',
      fieldData: {
        productId: product.id,
        fieldType: 'description'
      }
    })
  }

  // Product price
  fieldElements.push({
    id: `product-price-${product.id}`,
    type: 'product-price',
    content: product.price.toString(),
    style: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      textColor: '#3b82f6',
      ...(globalProductCardStyle?.textColor && { textColor: globalProductCardStyle.textColor })
    },
    sortOrder: fieldOrder.price ?? 3,
    parentId: product.id,
    parentType: 'product',
    fieldData: {
      productId: product.id,
      fieldType: 'price'
    }
  })

  // Sort by sortOrder and return
  return fieldElements.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Updates product data from custom elements
 */
export function updateProductFromElements(product: ProductItem, elements: CustomElement[]): Partial<ProductItem> {
  const updates: Partial<ProductItem> = {}
  
  for (const element of elements) {
    if (element.fieldData?.fieldType === 'name') {
      updates.name = element.content
    } else if (element.fieldData?.fieldType === 'price') {
      const price = parseFloat(element.content)
      if (!isNaN(price)) {
        updates.price = price
      }
    } else if (element.fieldData?.fieldType === 'description') {
      updates.description = element.content
    } else if (element.fieldData?.fieldType === 'image') {
      updates.imageUrl = element.content
    }
    // Availability is handled directly via checkbox, not through nested elements
  }
  
  return updates
}
