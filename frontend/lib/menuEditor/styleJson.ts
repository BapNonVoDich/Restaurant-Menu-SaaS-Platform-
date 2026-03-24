import type { CategoryStyle, ProductStyle } from './types'

/**
 * Parse product style_json from DB; returns {} on empty/invalid.
 */
export function parseProductStyleJson(styleJson: string | null | undefined): Partial<ProductStyle> {
  if (!styleJson?.trim()) return {}
  try {
    const parsed = JSON.parse(styleJson) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Partial<ProductStyle>
    }
  } catch {
    /* ignore */
  }
  return {}
}

export function serializeProductStyle(style: Partial<ProductStyle>): string {
  const o: Record<string, unknown> = {}
  for (const key of Object.keys(style) as (keyof ProductStyle)[]) {
    const v = style[key]
    if (v === undefined || v === '') continue
    o[key as string] = v
  }
  return Object.keys(o).length > 0 ? JSON.stringify(o) : ''
}

/** Parse category style_json from DB; returns {} on empty/invalid. */
export function parseCategoryStyleJson(styleJson: string | null | undefined): Partial<CategoryStyle> {
  if (!styleJson?.trim()) return {}
  try {
    const parsed = JSON.parse(styleJson) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Partial<CategoryStyle>
    }
  } catch {
    /* ignore */
  }
  return {}
}

export function serializeCategoryStyle(style: Partial<CategoryStyle>): string {
  const o: Record<string, unknown> = {}
  for (const key of Object.keys(style) as (keyof CategoryStyle)[]) {
    const v = style[key]
    if (v === undefined || v === '') continue
    if (key === 'columns' && (typeof v !== 'number' || Number.isNaN(v))) continue
    o[key as string] = v
  }
  return Object.keys(o).length > 0 ? JSON.stringify(o) : ''
}

/**
 * Merge product style_json with showImage when an image URL is set (template B default used to hide images).
 */
export function buildStyleJsonForProductSave(imageUrl: string, styleJson: string): string {
  const obj: Record<string, unknown> = { ...parseProductStyleJson(styleJson) }
  if (imageUrl?.trim()) {
    obj.showImage = true
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : ''
}
