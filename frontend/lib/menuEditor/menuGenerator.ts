// Generate HTML from menu data structure

import { CategoryItem, ProductItem, CustomElement, CustomizationSettings } from './types'

export function generateMenuHTML(
  categories: CategoryItem[],
  customElements: CustomElement[],
  customization: CustomizationSettings,
  storeName: string,
  backgroundImageUrl?: string,
  enableOrdering?: boolean
): string {
  const css = generateCSS(customization, backgroundImageUrl, 'body')
  const html = generateHTML(categories, customElements, storeName, customization, !!enableOrdering)
  
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${storeName} - Menu</title>
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`
}

/**
 * Style + markup fragment for Next.js `dangerouslySetInnerHTML` (no full document).
 * Parent page should apply `background-image` on a full-viewport wrapper — this root stays transparent
 * so the photo fills the screen instead of a white card.
 */
export function generateMenuInlineFragment(
  categories: CategoryItem[],
  customElements: CustomElement[],
  customization: CustomizationSettings,
  storeName: string,
  enableOrdering?: boolean
): string {
  const css = generateCSS(customization, undefined, 'embed-root')
  const html = generateHTML(categories, customElements, storeName, customization, !!enableOrdering)
  return `<style>${css}</style><div class="menu-embed-root">${html}</div>`
}

type MenuCssRoot = 'body' | 'embed-root'

function generateCSS(
  customization: CustomizationSettings,
  backgroundImageUrl: string | undefined,
  root: MenuCssRoot
): string {
  const safeBackgroundUrl = backgroundImageUrl
    ? backgroundImageUrl.replaceAll("'", "%27").replaceAll('"', '%22')
    : null

  const isEmbed = root === 'embed-root'
  const rootSel = isEmbed ? '.menu-embed-root' : 'body'

  const resetSelector = isEmbed ? '.menu-embed-root, .menu-embed-root *' : '*'

  const bgLayer =
    !isEmbed && safeBackgroundUrl
      ? `
      background-color: transparent;
      background-image: url("${safeBackgroundUrl}");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-attachment: fixed;
      `
      : !isEmbed
        ? `
      background-color: ${customization.globalBackgroundColor || '#ffffff'};
      `
        : `
      background-color: transparent;
      background-image: none;
      `

  const rawRead = (customization as { readabilityMode?: string }).readabilityMode
  const readabilityMode =
    rawRead === 'soft_scrim' || rawRead === 'glass_card' ? rawRead : 'none'
  const strengthRaw = customization.readabilityStrength
  const strength =
    typeof strengthRaw === 'number' && !Number.isNaN(strengthRaw)
      ? Math.min(1, Math.max(0, strengthRaw))
      : 0.45

  const textLegibility =
    isEmbed && readabilityMode === 'none'
      ? `
    .menu-embed-root h1,
    .menu-embed-root .category-header,
    .menu-embed-root .product-name,
    .menu-embed-root .product-price {
      text-shadow:
        0 0 6px rgba(255, 255, 255, 0.95),
        0 1px 3px rgba(0, 0, 0, 0.45);
    }
    .menu-embed-root .product-description {
      text-shadow: 0 0 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.35);
    }
    `
      : ''

  const readabilityScrimCss =
    readabilityMode === 'soft_scrim'
      ? `
    ${rootSel}::before {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, ${strength.toFixed(3)});
      pointer-events: none;
      z-index: 0;
    }
    ${rootSel} > .menu-container {
      position: relative;
      z-index: 1;
    }
  `
      : ''

  const readabilityGlassCss =
    readabilityMode === 'glass_card'
      ? `
    ${rootSel} > .menu-container {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, ${(0.12 + strength * 0.22).toFixed(3)});
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 20px;
      padding: calc(${customization.globalSpacing || '20px'} + 10px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, ${(0.14 + strength * 0.18).toFixed(3)});
    }
    .product-card {
      background: rgba(255, 255, 255, ${(0.14 + strength * 0.22).toFixed(3)}) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1) !important;
    }
  `
      : ''

  const primary = customization.primaryColor || '#3b82f6'

  return `
    ${resetSelector} {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    ${rootSel} {
      font-family: ${customization.globalFontFamily || 'system-ui, -apple-system, sans-serif'};
      color: ${customization.globalTextColor || '#1f2937'};
      ${bgLayer}
      line-height: 1.6;
      padding: ${customization.globalSpacing || '20px'};
      position: relative;
    }
    
    ${readabilityScrimCss}
    ${readabilityGlassCss}
    ${textLegibility}
    
    .menu-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .category-section {
      margin-bottom: 40px;
      background: transparent;
    }
    
    .category-header {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${customization.primaryColor || '#3b82f6'};
      background: transparent;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Default: let body/menu background show through; use inline styles from product.style for card chrome */
    .product-card {
      background: transparent;
      border-radius: 8px;
      padding: 16px;
      box-shadow: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .product-card:hover {
      transform: translateY(-1px);
    }
    
    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .product-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .product-description {
      color: #6b7280;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    
    .product-price {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${customization.primaryColor || '#3b82f6'};
    }
    
    .product-unavailable {
      opacity: 0.6;
    }
    
    .custom-section {
      margin: 30px 0;
      padding: 20px;
      border-radius: 8px;
      background: transparent;
    }
    
    /* Default banner: text only over menu background; set background via element.style in editor */
    .custom-banner {
      background: transparent;
      color: inherit;
      text-align: center;
      padding: 24px 16px;
      border-radius: 12px;
    }
    
    .custom-text {
      font-size: 1.1rem;
      line-height: 1.8;
    }
    
    .custom-divider {
      height: 2px;
      background: linear-gradient(to right, transparent, ${customization.primaryColor || '#3b82f6'}, transparent);
      margin: 40px 0;
    }
    
    @media (max-width: 768px) {
      .products-grid {
        grid-template-columns: 1fr;
      }
      
      .category-header {
        font-size: 1.5rem;
      }
      
      ${rootSel} {
        padding: 10px;
      }
    }

    /* Ghost button: chỉ viền + chữ — nền ảnh lộ ra */
    .menu-order-btn {
      margin-top: 12px;
      width: 100%;
      max-width: 320px;
      padding: 10px 12px;
      border: 2px solid ${primary};
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      color: ${primary};
      font-weight: 700;
      transition: transform 0.1s ease, background-color 0.15s ease, color 0.15s ease;
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
    }
    
    .menu-order-btn:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.35);
    }

    .menu-order-btn[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
      background: transparent;
    }
  `
}

function generateHTML(
  categories: CategoryItem[],
  customElements: CustomElement[],
  storeName: string,
  customization: CustomizationSettings,
  enableOrdering: boolean
): string {
  let html = `<div class="menu-container">
    <h1 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">${storeName}</h1>
  `
  
  // Combine categories and top-level custom elements (no parent), sorted by sortOrder
  const allItems: Array<{ type: 'category' | 'custom', data: CategoryItem | CustomElement, sortOrder: number }> = [
    ...categories.map(cat => ({ type: 'category' as const, data: cat, sortOrder: cat.sortOrder })),
    ...customElements.filter(el => !el.parentId).map(el => ({ type: 'custom' as const, data: el, sortOrder: el.sortOrder }))
  ].sort((a, b) => a.sortOrder - b.sortOrder)
  
  for (const item of allItems) {
    if (item.type === 'category') {
      html += generateCategoryHTML(item.data as CategoryItem, customization, enableOrdering)
    } else {
      html += generateCustomElementHTML(item.data as CustomElement, customization)
    }
  }
  
  html += `</div>`
  return html
}

function buildInlineStylesFromObject(style: any): string {
  const styles: string[] = []
  
  // Colors
  if (style.backgroundColor) styles.push(`background-color: ${style.backgroundColor}`)
  if (style.textColor) styles.push(`color: ${style.textColor}`)
  
  // Typography
  if (style.fontFamily) styles.push(`font-family: ${style.fontFamily}`)
  if (style.fontSize) styles.push(`font-size: ${style.fontSize}`)
  if (style.fontWeight) styles.push(`font-weight: ${style.fontWeight}`)
  if (style.lineHeight) styles.push(`line-height: ${style.lineHeight}`)
  if (style.textAlign) styles.push(`text-align: ${style.textAlign}`)
  if (style.textDecoration) styles.push(`text-decoration: ${style.textDecoration}`)
  if (style.textTransform) styles.push(`text-transform: ${style.textTransform}`)
  if (style.letterSpacing) styles.push(`letter-spacing: ${style.letterSpacing}`)
  
  // Spacing
  if (style.padding) styles.push(`padding: ${style.padding}`)
  else {
    if (style.paddingTop) styles.push(`padding-top: ${style.paddingTop}`)
    if (style.paddingRight) styles.push(`padding-right: ${style.paddingRight}`)
    if (style.paddingBottom) styles.push(`padding-bottom: ${style.paddingBottom}`)
    if (style.paddingLeft) styles.push(`padding-left: ${style.paddingLeft}`)
  }
  if (style.margin) styles.push(`margin: ${style.margin}`)
  else {
    if (style.marginTop) styles.push(`margin-top: ${style.marginTop}`)
    if (style.marginRight) styles.push(`margin-right: ${style.marginRight}`)
    if (style.marginBottom) styles.push(`margin-bottom: ${style.marginBottom}`)
    if (style.marginLeft) styles.push(`margin-left: ${style.marginLeft}`)
  }
  
  // Border
  if (style.border) styles.push(`border: ${style.border}`)
  else {
    if (style.borderWidth) styles.push(`border-width: ${style.borderWidth}`)
    if (style.borderStyle) styles.push(`border-style: ${style.borderStyle}`)
    if (style.borderColor) styles.push(`border-color: ${style.borderColor}`)
  }
  if (style.borderRadius) styles.push(`border-radius: ${style.borderRadius}`)
  
  // Display & Layout
  if (style.display) styles.push(`display: ${style.display}`)
  if (style.flexDirection) styles.push(`flex-direction: ${style.flexDirection}`)
  if (style.justifyContent) styles.push(`justify-content: ${style.justifyContent}`)
  if (style.alignItems) styles.push(`align-items: ${style.alignItems}`)
  if (style.gap) styles.push(`gap: ${style.gap}`)
  if (style.position) styles.push(`position: ${style.position}`)
  
  // Size
  if (style.width) styles.push(`width: ${style.width}`)
  if (style.height) styles.push(`height: ${style.height}`)
  if (style.minWidth) styles.push(`min-width: ${style.minWidth}`)
  if (style.minHeight) styles.push(`min-height: ${style.minHeight}`)
  if (style.maxWidth) styles.push(`max-width: ${style.maxWidth}`)
  if (style.maxHeight) styles.push(`max-height: ${style.maxHeight}`)
  
  // Effects
  if (style.boxShadow) styles.push(`box-shadow: ${style.boxShadow}`)
  if (style.opacity) styles.push(`opacity: ${style.opacity}`)
  if (style.transform) styles.push(`transform: ${style.transform}`)
  if (style.transition) styles.push(`transition: ${style.transition}`)
  
  return styles.join('; ')
}

function generateCategoryHTML(
  category: CategoryItem,
  customization: CustomizationSettings,
  enableOrdering: boolean
): string {
  const style = category.style
  const sectionStyles = buildInlineStylesFromObject(style)
  const headerStyles = buildInlineStylesFromObject({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize || '2rem',
    fontWeight: style.fontWeight,
    textColor: style.textColor,
    textAlign: style.textAlign
  })
  
  let html = `<section class="category-section" data-category-id="${escapeHtmlAttr(String(category.id))}"${sectionStyles ? ` style="${sectionStyles}"` : ''}>
    <h2 class="category-header"${headerStyles ? ` style="${headerStyles}"` : ''}>${category.name}</h2>
  `
  
  if (style.layout === 'grid') {
    html += `<div class="products-grid" style="grid-template-columns: repeat(${style.columns || 3}, 1fr);">`
  } else {
    html += `<div class="products-list">`
  }
  
  const sortedProducts = [...category.products].sort((a, b) => a.sortOrder - b.sortOrder)
  for (const product of sortedProducts) {
    if (product.categoryIds.includes(category.id)) {
      html += generateProductHTML(product, customization, enableOrdering)
    }
  }
  
  html += `</div>`
  
  // Render category children (custom elements)
  if (category.children && category.children.length > 0) {
    const sortedChildren = [...category.children].sort((a, b) => a.sortOrder - b.sortOrder)
    for (const child of sortedChildren) {
      html += generateCustomElementHTML(child, customization)
    }
  }
  
  html += `</section>`
  return html
}

function generateProductHTML(
  product: ProductItem,
  customization: CustomizationSettings,
  enableOrdering: boolean
): string {
  const style = product.style
  const unavailableClass = product.isAvailable ? '' : 'product-unavailable'
  const cardStyles = buildInlineStylesFromObject(style)
  
  let html = `<div class="product-card ${unavailableClass}" data-product-id="${escapeHtmlAttr(String(product.id))}"${cardStyles ? ` style="${cardStyles}"` : ''}>
  `
  
  // Show image when URL exists unless style_json explicitly turned off (showImage === false)
  if (product.imageUrl && style.showImage !== false) {
    html += `<img src="${escapeHtmlAttr(product.imageUrl)}" alt="${escapeHtmlAttr(product.name)}" class="product-image" />`
  }
  
  const nameStyles = buildInlineStylesFromObject({
    textColor: style.textColor,
    fontSize: style.fontSize || '1.25rem',
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily
  })
  html += `<h3 class="product-name"${nameStyles ? ` style="${nameStyles}"` : ''}>${product.name}</h3>`
  
  if (style.showDescription && product.description) {
    html += `<p class="product-description">${product.description}</p>`
  }
  
  if (style.showPrice) {
    const priceStyles = buildInlineStylesFromObject({
      textColor: customization.primaryColor,
      fontSize: style.fontSize,
      fontWeight: 'bold'
    })
    html += `<div class="product-price"${priceStyles ? ` style="${priceStyles}"` : ''}>${product.price.toLocaleString('vi-VN')} VNĐ</div>`
  }
  
  // Render product children (custom elements)
  if (product.children && product.children.length > 0) {
    const sortedChildren = [...product.children].sort((a, b) => a.sortOrder - b.sortOrder)
    for (const child of sortedChildren) {
      html += generateCustomElementHTML(child, customization)
    }
  }

  if (enableOrdering) {
    const safeName = escapeHtmlAttr(product.name)
    const safeId = escapeHtmlAttr(String(product.id))
    const safePrice = escapeHtmlAttr(String(product.price))
    const disabledAttr = product.isAvailable ? '' : ' disabled'

    html += `<button type="button" class="menu-order-btn"${disabledAttr} data-action="order" data-product-id="${safeId}" data-product-name="${safeName}" data-product-price="${safePrice}">Đặt món</button>`
  }
  
  html += `</div>`
  return html
}

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeHtmlAttr(value: any): string {
  return escapeHtml(value)
}

function generateCustomElementHTML(element: CustomElement, customization: CustomizationSettings): string {
  const style = element.style
  
  // Build inline styles from element.style (prioritize element styles over global)
  const buildInlineStyles = () => {
    const styles: string[] = []
    
    // Background - use section style if provided
    if (style.backgroundColor) {
      styles.push(`background-color: ${style.backgroundColor}`)
    }
    
    if (style.backgroundImage) {
      styles.push(`background-image: ${style.backgroundImage}`)
    }
    if (style.backgroundSize) {
      styles.push(`background-size: ${style.backgroundSize}`)
    }
    if (style.backgroundPosition) {
      styles.push(`background-position: ${style.backgroundPosition}`)
    }
    
    // Colors
    if (style.textColor) {
      styles.push(`color: ${style.textColor}`)
    }
    
    // Typography
    if (style.fontFamily) styles.push(`font-family: ${style.fontFamily}`)
    if (style.fontSize) styles.push(`font-size: ${style.fontSize}`)
    if (style.fontWeight) styles.push(`font-weight: ${style.fontWeight}`)
    if (style.lineHeight) styles.push(`line-height: ${style.lineHeight}`)
    if (style.textAlign) styles.push(`text-align: ${style.textAlign}`)
    if (style.textDecoration) styles.push(`text-decoration: ${style.textDecoration}`)
    if (style.textTransform) styles.push(`text-transform: ${style.textTransform}`)
    if (style.letterSpacing) styles.push(`letter-spacing: ${style.letterSpacing}`)
    
    // Spacing
    if (style.padding) styles.push(`padding: ${style.padding}`)
    else {
      if (style.paddingTop) styles.push(`padding-top: ${style.paddingTop}`)
      if (style.paddingRight) styles.push(`padding-right: ${style.paddingRight}`)
      if (style.paddingBottom) styles.push(`padding-bottom: ${style.paddingBottom}`)
      if (style.paddingLeft) styles.push(`padding-left: ${style.paddingLeft}`)
    }
    
    if (style.margin) styles.push(`margin: ${style.margin}`)
    else {
      if (style.marginTop) styles.push(`margin-top: ${style.marginTop}`)
      if (style.marginRight) styles.push(`margin-right: ${style.marginRight}`)
      if (style.marginBottom) styles.push(`margin-bottom: ${style.marginBottom}`)
      if (style.marginLeft) styles.push(`margin-left: ${style.marginLeft}`)
    }
    
    // Border
    if (style.border) styles.push(`border: ${style.border}`)
    else {
      if (style.borderWidth) styles.push(`border-width: ${style.borderWidth}`)
      if (style.borderStyle) styles.push(`border-style: ${style.borderStyle}`)
      if (style.borderColor) styles.push(`border-color: ${style.borderColor}`)
    }
    if (style.borderRadius) styles.push(`border-radius: ${style.borderRadius}`)
    if (style.borderTop) styles.push(`border-top: ${style.borderTop}`)
    if (style.borderRight) styles.push(`border-right: ${style.borderRight}`)
    if (style.borderBottom) styles.push(`border-bottom: ${style.borderBottom}`)
    if (style.borderLeft) styles.push(`border-left: ${style.borderLeft}`)
    
    // Display & Layout
    if (style.display) styles.push(`display: ${style.display}`)
    if (style.flexDirection) styles.push(`flex-direction: ${style.flexDirection}`)
    if (style.justifyContent) styles.push(`justify-content: ${style.justifyContent}`)
    if (style.alignItems) styles.push(`align-items: ${style.alignItems}`)
    if (style.gap) styles.push(`gap: ${style.gap}`)
    if (style.position) styles.push(`position: ${style.position}`)
    
    // Size
    if (style.width) styles.push(`width: ${style.width}`)
    if (style.height) styles.push(`height: ${style.height}`)
    if (style.minWidth) styles.push(`min-width: ${style.minWidth}`)
    if (style.minHeight) styles.push(`min-height: ${style.minHeight}`)
    if (style.maxWidth) styles.push(`max-width: ${style.maxWidth}`)
    if (style.maxHeight) styles.push(`max-height: ${style.maxHeight}`)
    
    // Effects
    if (style.boxShadow) styles.push(`box-shadow: ${style.boxShadow}`)
    if (style.opacity) styles.push(`opacity: ${style.opacity}`)
    if (style.transform) styles.push(`transform: ${style.transform}`)
    if (style.transition) styles.push(`transition: ${style.transition}`)
    if (style.zIndex) styles.push(`z-index: ${style.zIndex}`)
    
    return styles.join('; ')
  }
  
  const inlineStyles = buildInlineStyles()
  
  // Custom elements can contain other custom elements (nested)
  const childrenHTML = element.children?.map(child => generateCustomElementHTML(child, customization)).join('') || ''
  
  // Generate HTML for the element itself based on type
  let elementHTML = ''
  switch (element.type) {
    case 'text':
      elementHTML = `<div style="${inlineStyles}">${element.content || ''}</div>`
      break
    case 'image':
      if (element.content) {
        elementHTML = `<img src="${element.content}" alt="Custom" style="${inlineStyles}; max-width: 100%; height: auto;" />`
      }
      break
    case 'button':
      elementHTML = `<button style="${inlineStyles}">${element.content || ''}</button>`
      break
    case 'divider':
      elementHTML = `<hr style="${inlineStyles}" />`
      break
    case 'product-name':
    case 'product-price':
    case 'product-description':
    case 'product-image':
      // These are handled within product cards, not here
      elementHTML = ''
      break
    case 'custom':
    default:
      // Container element - render children
      elementHTML = `<div class="custom-section" style="${inlineStyles}">
        ${childrenHTML}
      </div>`
      break
  }
  
  return elementHTML
}
