// Types for the WYSIWYG Menu Editor

export interface MenuEditorState {
  categories: CategoryItem[]
  customElements: CustomElement[] // Top-level custom elements (no parent)
  selectedItem: SelectedItem | null
  multiSelection: MultiSelection
  history: MenuEditorState[]
  historyIndex: number
  previewMode: 'desktop' | 'mobile'
  showPreview: boolean
  customization: CustomizationSettings
}

export interface CategoryItem {
  id: string
  name: string
  sortOrder: number
  products: ProductItem[]
  style: CategoryStyle
  children?: CustomElement[] // Custom elements within category
}

export interface ProductItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  sortOrder: number
  categoryIds: string[]
  style: ProductStyle
  children?: CustomElement[] // Custom elements within product
}

// Unified custom element - can be nested, can contain other custom elements
export interface CustomElement {
  id: string
  type: 'text' | 'image' | 'divider' | 'button' | 'product-name' | 'product-price' | 'product-description' | 'product-image' | 'custom'
  content: string
  style: SectionStyle
  sortOrder: number
  parentId?: string // ID of parent (category, product, or custom element). Undefined for top-level elements
  parentType?: 'category' | 'product' | 'custom' // Undefined for top-level elements
  // For product-specific fields
  fieldData?: {
    productId?: string
    fieldType?: 'name' | 'price' | 'description' | 'image'
  }
  children?: CustomElement[] // Custom elements can contain other custom elements (nested)
}

export interface CategoryStyle {
  // Layout
  layout: 'grid' | 'list' | 'card'
  columns?: number
  
  // Colors
  backgroundColor?: string
  textColor?: string
  
  // Typography
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Spacing
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  
  // Border
  border?: string
  borderWidth?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  borderColor?: string
  borderRadius?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  
  // Display & Layout
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: string
  
  // Size
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string
  
  // Effects
  boxShadow?: string
  opacity?: string
  transform?: string
}

export interface ProductStyle {
  // Layout
  cardLayout?: 'minimal' | 'detailed' | 'image-focused'
  showImage?: boolean
  showDescription?: boolean
  showPrice?: boolean
  
  // Field order configuration (default order: name=0, image=1, description=2, price=3)
  fieldOrder?: {
    name?: number
    image?: number
    description?: number
    price?: number
  }
  
  // Colors
  backgroundColor?: string
  textColor?: string
  
  // Typography
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Spacing
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  
  // Border
  border?: string
  borderWidth?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  borderColor?: string
  borderRadius?: string
  
  // Display & Layout
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch'
  gap?: string
  
  // Size
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  
  // Effects
  boxShadow?: string
  opacity?: string
  transition?: string
}

export interface SectionStyle {
  // Colors
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  textColor?: string
  
  // Typography
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  letterSpacing?: string
  
  // Spacing
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  
  // Border
  border?: string
  borderWidth?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none' | 'double'
  borderColor?: string
  borderRadius?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  
  // Display & Layout
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: string
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  
  // Size
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string
  
  // Effects
  boxShadow?: string
  opacity?: string
  transform?: string
  transition?: string
  zIndex?: string
}

export interface CustomizationSettings {
  globalFontFamily: string
  globalTextColor: string
  globalBackgroundColor: string
  globalSpacing: string
  theme: 'light' | 'dark' | 'custom'
  primaryColor: string
  secondaryColor: string
  // Global settings for product cards
  globalProductCardStyle?: ProductStyle
  // Global settings for categories
  globalCategoryStyle?: CategoryStyle
  // Global product field styles (for name, image, description, price)
  globalProductFieldStyles?: {
    name?: Partial<CategoryStyle>
    image?: Partial<CategoryStyle>
    description?: Partial<CategoryStyle>
    price?: Partial<CategoryStyle>
  }
}

export interface SelectedItem {
  type: 'category' | 'product' | 'custom'
  id: string
}

export interface MultiSelection {
  items: SelectedItem[]
}

export interface MenuHTMLData {
  html: string
  css: string
  version: number
  generatedAt: string
}

export interface MenuTemplate {
  id: string
  name: string
  categories: CategoryItem[]
  customElements: CustomElement[]
  customization: CustomizationSettings
  createdAt: string
}
