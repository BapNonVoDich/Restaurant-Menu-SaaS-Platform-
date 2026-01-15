'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useTranslation } from '@/hooks/useTranslation'
import { CategoryItem, ProductItem, CustomElement, CustomizationSettings, SelectedItem, MenuTemplate } from '@/lib/menuEditor/types'
import { generateMenuHTML } from '@/lib/menuEditor/menuGenerator'
import { createDefaultProductElements } from '@/lib/menuEditor/productHelpers'
import CategorySection from './CategorySection'
import CustomElementComponent from './CustomElementComponent'
import SidebarPanel from './SidebarPanel'
import Toolbar from './Toolbar'
import PreviewModal from './PreviewModal'
import AddProductModal from './AddProductModal'
import TemplateModal from './TemplateModal'
import toast from 'react-hot-toast'

interface WYSIWYGMenuEditorProps {
  storeId: string
  storeName: string
  token: string
  initialMenuData?: {
    categories: CategoryItem[]
    customElements: CustomElement[]
    customization: CustomizationSettings
    menuHtml?: string
  }
}

export default function WYSIWYGMenuEditor({
  storeId,
  storeName,
  token,
  initialMenuData
}: WYSIWYGMenuEditorProps) {
  console.log('WYSIWYGMenuEditor render:', { storeId, storeName, hasToken: !!token, hasInitialData: !!initialMenuData })
  const t = useTranslation()
  
  // State
  const [categories, setCategories] = useState<CategoryItem[]>(initialMenuData?.categories || [])
  const [customElements, setCustomElements] = useState<CustomElement[]>(initialMenuData?.customElements || [])
  const [customization, setCustomization] = useState<CustomizationSettings>(
    initialMenuData?.customization || {
      globalFontFamily: 'system-ui, -apple-system, sans-serif',
      globalTextColor: '#1f2937',
      globalBackgroundColor: '#ffffff',
      globalSpacing: '20px',
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6'
    }
  )
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [selectedCustomElementId, setSelectedCustomElementId] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ categories: CategoryItem[], customElements: CustomElement[], customization: CustomizationSettings }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [addProductModalOpen, setAddProductModalOpen] = useState(false)
  const [addProductCategoryId, setAddProductCategoryId] = useState<string | null>(null)

  // Drag and drop sensors - no activation constraint for immediate dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // No distance required - drag immediately
      },
    })
  )

  // History management for undo/redo
  const saveToHistory = useCallback((
    cats: CategoryItem[],
    elements: CustomElement[],
    custom: CustomizationSettings
  ) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      categories: JSON.parse(JSON.stringify(cats)),
      customElements: JSON.parse(JSON.stringify(elements)),
      customization: JSON.parse(JSON.stringify(custom))
    })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const fetchMenuData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/catalog/stores/my-store/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const menuData = await response.json()
        console.log('Menu data fetched:', menuData)
        // Transform API data to editor format
        const transformedCategories: CategoryItem[] = (menuData.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          sortOrder: cat.sortOrder || 0,
          children: [],
          products: (cat.products || []).map((prod: any) => {
              const product: ProductItem = {
                id: prod.id,
                name: prod.name,
                description: prod.description,
                price: parseFloat(prod.price) || 0,
                imageUrl: prod.imageUrl,
                isAvailable: prod.isAvailable !== false,
                sortOrder: prod.sortOrder || 0,
                categoryIds: [cat.id],
                style: {
                  showImage: !!prod.imageUrl,
                  showDescription: !!prod.description,
                  showPrice: true
                },
                children: []
              }
              // Initialize with default nested elements
              try {
                product.children = createDefaultProductElements(product, customization.globalProductCardStyle)
              } catch (err) {
                console.error('Error creating default product elements:', err)
                product.children = []
              }
              return product
            }),
          style: {
            layout: 'grid',
            columns: 3
          }
        }))
        
        console.log('Transformed categories:', transformedCategories)
        setCategories(transformedCategories)
        saveToHistory(transformedCategories, customElements, customization)
      } else {
        console.warn('Menu fetch failed:', response.status, response.statusText)
        // If no menu exists, start with empty state
        setCategories([])
        setCustomElements([])
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Không thể tải dữ liệu thực đơn')
      // Start with empty state on error
      setCategories([])
      setCustomElements([])
    }
  }, [token, customElements, customization, saveToHistory])

  // Initialize from API if no initial data
  useEffect(() => {
    console.log('WYSIWYGMenuEditor useEffect:', { initialMenuData: !!initialMenuData, token: !!token })
    if (!initialMenuData && token) {
      console.log('Calling fetchMenuData...')
      fetchMenuData()
    } else if (!token) {
      console.warn('No token available')
    } else if (initialMenuData) {
      console.log('Using initialMenuData')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialMenuData])

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setCategories(prevState.categories)
      setCustomElements(prevState.customElements)
      setCustomization(prevState.customization)
      setHistoryIndex(historyIndex - 1)
      toast.success('Đã hoàn tác')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setCategories(nextState.categories)
      setCustomElements(nextState.customElements)
      setCustomization(nextState.customization)
      setHistoryIndex(historyIndex + 1)
      toast.success('Đã làm lại')
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    // Handle category reordering
    if (active.data.current?.type === 'category' && over.data.current?.type === 'category') {
      const oldIndex = categories.findIndex(c => c.id === active.id)
      const newIndex = categories.findIndex(c => c.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) return
      
      const newCategories = arrayMove(categories, oldIndex, newIndex)
      newCategories.forEach((cat, idx) => {
        if (cat) {
          cat.sortOrder = idx
        }
      })
      setCategories(newCategories)
      // Update immediately on drag
      saveToHistory(newCategories, customElements, customization)
      return
    }

    // Handle custom section reordering
    if (active.data.current?.type === 'custom' && over.data.current?.type === 'custom') {
      const oldIndex = customElements.findIndex(s => s.id === active.id)
      const newIndex = customElements.findIndex(s => s.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) return
      
      const newSections = arrayMove(customElements, oldIndex, newIndex)
      newSections.forEach((sec, idx) => {
        if (sec) {
          sec.sortOrder = idx
        }
      })
      setCustomElements(newSections)
      // Update immediately on drag
      saveToHistory(categories, newSections, customization)
      return
    }

    // Handle mixed reordering (category <-> section)
    if ((active.data.current?.type === 'category' && over.data.current?.type === 'custom') ||
        (active.data.current?.type === 'custom' && over.data.current?.type === 'category')) {
      // Combine and reorder
      const allItems = [...categories, ...customElements].sort((a, b) => a.sortOrder - b.sortOrder)
      const activeItem = allItems.find(item => item.id === active.id)
      const overItem = allItems.find(item => item.id === over.id)
      
      if (activeItem && overItem) {
        const oldIndex = allItems.findIndex(item => item.id === active.id)
        const newIndex = allItems.findIndex(item => item.id === over.id)
        const reordered = arrayMove(allItems, oldIndex, newIndex)
        reordered.forEach((item, idx) => {
          if (item) {
            item.sortOrder = idx
          }
        })
        
        const newCategories = reordered.filter(item => 'products' in item) as CategoryItem[]
        const newSections = reordered.filter(item => !('products' in item)) as CustomElement[]
        
        setCategories(newCategories)
        setCustomElements(newSections)
        saveToHistory(newCategories, newSections, customization)
      }
      return
    }

    // Handle product reordering within category
    if (active.data.current?.type === 'product' && over.data.current?.type === 'product') {
      const categoryId = active.data.current.categoryId
      const category = categories.find(c => c.id === categoryId)
      if (!category) return

      const categoryProducts = category.products.filter(p => p.categoryIds.includes(categoryId))
      const otherProducts = category.products.filter(p => !p.categoryIds.includes(categoryId))

      const oldIndex = categoryProducts.findIndex(p => p.id === active.id)
      const newIndex = categoryProducts.findIndex(p => p.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(categoryProducts, oldIndex, newIndex)
        reordered.forEach((prod, idx) => { prod.sortOrder = idx })
        category.products = [...reordered, ...otherProducts]
        const newCategories = [...categories]
        setCategories(newCategories)
        // Update immediately on drag
        saveToHistory(newCategories, customElements, customization)
      }
      return
    }

    // Handle nested element reordering within product/category/section
    if (active.data.current?.type === 'nested-element' && over.data.current?.type === 'nested-element') {
      const parentId = active.data.current.parentId
      const parentType = active.data.current.parentType
      
      if (parentType === 'product') {
        // Find product and reorder its nested elements
        const newCategories = categories.map(cat => ({
          ...cat,
          products: cat.products.map(prod => {
            if (prod.id === parentId && prod.children) {
              const oldIndex = prod.children.findIndex(e => e.id === active.id)
              const newIndex = prod.children.findIndex(e => e.id === over.id)
              if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(prod.children, oldIndex, newIndex)
                reordered.forEach((el, idx) => { el.sortOrder = idx })
                return { ...prod, children: reordered }
              }
            }
            return prod
          })
        }))
        setCategories(newCategories)
        saveToHistory(newCategories, customElements, customization)
      } else if (parentType === 'category') {
        // Find category and reorder its nested elements
        const newCategories = categories.map(cat => {
          if (cat.id === parentId && cat.children) {
            const oldIndex = cat.children.findIndex(e => e.id === active.id)
            const newIndex = cat.children.findIndex(e => e.id === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
              const reordered = arrayMove(cat.children, oldIndex, newIndex)
              reordered.forEach((el, idx) => { el.sortOrder = idx })
              return { ...cat, children: reordered }
            }
          }
          return cat
        })
        setCategories(newCategories)
        saveToHistory(newCategories, customElements, customization)
      } else if (parentType === 'custom') {
        // Find section and reorder its nested elements
        const newSections = customElements.map(sec => {
          if (sec.id === parentId && sec.children) {
            const oldIndex = sec.children.findIndex(e => e.id === active.id)
            const newIndex = sec.children.findIndex(e => e.id === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
              const reordered = arrayMove(sec.children, oldIndex, newIndex)
              reordered.forEach((el, idx) => { el.sortOrder = idx })
              return { ...sec, children: reordered }
            }
          }
          return sec
        })
        setCustomElements(newSections)
        saveToHistory(categories, newSections, customization)
      }
      return
    }
  }

  // Save menu HTML
  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Validate store ID
      if (!storeId) {
        toast.error('Không tìm thấy ID cửa hàng')
        setSaving(false)
        return
      }

      // Check if token exists
      if (!token) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        setSaving(false)
        return
      }

      // Generate HTML
      const menuHtml = generateMenuHTML(categories, customElements, customization, storeName)
      
      if (!menuHtml || menuHtml.trim().length === 0) {
        toast.error('Không thể tạo HTML từ dữ liệu')
        setSaving(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      
      // Save both HTML and data structure
      console.log('Saving menu HTML and data structure...')
      
      // Save HTML
      const htmlResponse = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-html`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ menuHtml })
      })

      console.log('Save HTML response status:', htmlResponse.status)

      if (!htmlResponse.ok) {
        const errorText = await htmlResponse.text().catch(() => '')
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `Lỗi ${htmlResponse.status}: ${htmlResponse.statusText}` }
        }
        const errorMessage = errorData.error || errorData.message || `Lỗi ${htmlResponse.status}: ${htmlResponse.statusText}`
        throw new Error(`Lỗi lưu HTML: ${errorMessage}`)
      }

      // Save data structure (categories, customElements, customization)
      // Store in localStorage as backup and for editor state
      const menuData = {
        categories,
        customElements,
        customization,
        savedAt: new Date().toISOString()
      }
      
      try {
        localStorage.setItem(`menu-data-${storeId}`, JSON.stringify(menuData))
        console.log('Menu data structure saved to localStorage')
      } catch (e) {
        console.warn('Could not save to localStorage:', e)
      }

      // Also try to save via API if endpoint exists (for future implementation)
      try {
        const dataResponse = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-data`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(menuData)
        })
        
        if (dataResponse.ok) {
          console.log('Menu data structure saved to API')
        } else {
          console.warn('API endpoint for menu-data not available, using localStorage only')
        }
      } catch (e) {
        console.warn('Could not save menu data to API (endpoint may not exist):', e)
        // This is OK - we're using localStorage as fallback
      }

      toast.success('Đã lưu thực đơn thành công!', {
        duration: 3000,
        icon: '✅'
      })
      
      // Save current state to history after successful save
      saveToHistory(categories, customElements, customization)
    } catch (error) {
      console.error('Error saving menu:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu thực đơn. Vui lòng kiểm tra console để biết thêm chi tiết.'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Reset menu HTML (regenerate from data)
  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn đặt lại HTML và tạo lại từ dữ liệu?')) return

    try {
      // Validate store ID
      if (!storeId) {
        toast.error('Không tìm thấy ID cửa hàng')
        return
      }

      // Check if token exists
      if (!token) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      
      console.log('Resetting menu HTML...')
      
      // Regenerate HTML from current data
      const newHtml = generateMenuHTML(categories, customElements, customization, storeName)
      
      if (!newHtml || newHtml.trim().length === 0) {
        toast.error('Không thể tạo HTML từ dữ liệu')
        return
      }
      
      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-html`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ menuHtml: newHtml })
      })

      console.log('Reset response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `Lỗi ${response.status}: ${response.statusText}` }
        }
        const errorMessage = errorData.error || errorData.message || `Lỗi ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      toast.success('Đã đặt lại và tạo lại HTML thành công!', {
        duration: 3000,
        icon: '✅'
      })
    } catch (error) {
      console.error('Error resetting menu:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể đặt lại HTML. Vui lòng kiểm tra console để biết thêm chi tiết.'
      toast.error(errorMessage)
    }
  }

  // Update handlers
  const updateCategory = (categoryId: string, updates: Partial<CategoryItem>) => {
    const newCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, ...updates } : cat
    )
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
  }

  const updateProduct = (productId: string, updates: Partial<ProductItem>) => {
    const newCategories = categories.map(cat => ({
      ...cat,
      products: cat.products.map(prod =>
        prod.id === productId ? { ...prod, ...updates } : prod
      )
    }))
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
  }

  const updateCustomization = (updates: Partial<CustomizationSettings>) => {
    const newCustomization = { ...customization, ...updates }
    setCustomization(newCustomization)
    saveToHistory(categories, customElements, newCustomization)
  }

  const addCategory = () => {
    const newCategory: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: 'Danh mục mới',
      sortOrder: categories.length,
      products: [],
      style: {
        layout: 'grid',
        columns: 3
      }
    }
    const newCategories = [...categories, newCategory]
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
    setSelectedItem({ type: 'category', id: newCategory.id })
  }

  const addCustomElement = () => {
    const newSection: CustomElement = {
      id: `section-${Date.now()}`,
      type: 'custom',
      content: '', // Optional, for backward compatibility
      sortOrder: categories.length + customElements.length,
      style: {
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#ffffff'
      },
      children: [] // Start with empty children
    }
    const newSections = [...customElements, newSection]
    setCustomElements(newSections)
    saveToHistory(categories, newSections, customization)
    setSelectedItem({ type: 'custom', id: newSection.id })
  }

  const deleteCategory = (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId)
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
    if (selectedItem?.type === 'category' && selectedItem.id === categoryId) {
      setSelectedItem(null)
    }
  }

  const deleteProduct = (productId: string) => {
    const newCategories = categories.map(cat => ({
      ...cat,
      products: cat.products.filter(p => p.id !== productId)
    }))
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
    if (selectedItem?.type === 'product' && selectedItem.id === productId) {
      setSelectedItem(null)
    }
  }

  const deleteSection = (sectionId: string) => {
    const newSections = customElements.filter(s => s.id !== sectionId)
    setCustomElements(newSections)
    saveToHistory(categories, newSections, customization)
    if (selectedItem?.type === 'custom' && selectedItem.id === sectionId) {
      setSelectedItem(null)
    }
  }

  const handleAddProduct = (categoryId: string) => {
    setAddProductCategoryId(categoryId)
    setAddProductModalOpen(true)
  }

  const handleProductAdded = (newProduct: ProductItem) => {
    // Find the category and add the product
    const newCategories = categories.map(cat => {
      if (cat.id === addProductCategoryId) {
        // Check if product already exists (in case of duplicates)
        const existingIndex = cat.products.findIndex(p => p.id === newProduct.id)
        if (existingIndex >= 0) {
          // Update existing
          cat.products[existingIndex] = newProduct
        } else {
          // Add new
          cat.products.push(newProduct)
        }
      }
      return cat
    })
    setCategories(newCategories)
    saveToHistory(newCategories, customElements, customization)
    setSelectedItem({ type: 'product', id: newProduct.id })
  }

  const selectedCategory = selectedItem?.type === 'category' 
    ? categories.find(c => c.id === selectedItem.id) ?? null
    : null
  const selectedProduct = selectedItem?.type === 'product'
    ? categories.flatMap(c => c.products).find(p => p.id === selectedItem.id) ?? null
    : null
  const selectedCustomElementForSidebar = selectedItem?.type === 'custom'
    ? customElements.find(e => e.id === selectedItem.id) ?? null
    : null

  // Find selected nested element - recursive search function
  const findElementById = (elements: CustomElement[], targetId: string): CustomElement | null => {
    for (const element of elements) {
      if (element.id === targetId) {
        return element
      }
      if (element.children && element.children.length > 0) {
        const found = findElementById(element.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  // Find selected nested element
  const selectedCustomElement = selectedCustomElementId
    ? (() => {
        // Search in categories
        for (const cat of categories) {
          if (cat.children) {
            const found = findElementById(cat.children, selectedCustomElementId)
            if (found) return found
          }
          // Search in products
          for (const product of cat.products) {
            if (product.children) {
              const found = findElementById(product.children, selectedCustomElementId)
              if (found) return found
            }
          }
        }
        // Search in custom elements (top-level and nested)
        if (customElements.length > 0) {
          const found = findElementById(customElements, selectedCustomElementId)
          if (found) return found
        }
        return null
      })()
    : null

  // Apply global customization styles - including primary and secondary colors
  const globalStyles: React.CSSProperties = {
    fontFamily: customization.globalFontFamily,
    color: customization.globalTextColor,
    backgroundColor: customization.globalBackgroundColor,
    // Apply primary and secondary colors as CSS variables for use in components
    '--primary-color': customization.primaryColor,
    '--secondary-color': customization.secondaryColor
  } as React.CSSProperties

  console.log('WYSIWYGMenuEditor render state:', { 
    categoriesCount: categories.length, 
    customElementsCount: customElements.length,
    categories: categories.map(c => ({ id: c.id, name: c.name, productsCount: c.products?.length || 0 })),
    selectedItem,
    hasToken: !!token,
    storeId,
    storeName
  })

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={globalStyles}>
      {/* Toolbar - Always full width, not affected by responsive mode */}
      <Toolbar
        onSave={handleSave}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={() => setShowPreview(true)}
        onPublishedSite={() => window.open(`/menu/${storeName}`, '_blank')}
        onTemplates={() => setShowTemplateModal(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        saving={saving}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={[...categories.map(c => c.id), ...customElements.map(s => s.id)]}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Empty state */}
                {categories.length === 0 && customElements.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg mb-4">Chưa có nội dung nào</p>
                    <p className="text-gray-400 text-sm mb-6">Nhấp vào nút bên dưới để thêm danh mục hoặc element tùy chỉnh</p>
                  </div>
                )}
                
                {/* Combine categories and custom sections, sorted by sortOrder */}
                {(() => {
                  const items = [...categories, ...customElements].sort((a, b) => a.sortOrder - b.sortOrder)
                  console.log('Rendering items:', items.length, items.map(i => ({ id: i.id, type: 'products' in i ? 'category' : 'section', name: 'name' in i ? i.name : 'section' })))
                  return items.map((item) => {
                    if ('products' in item) {
                      // It's a category
                      const category = item as CategoryItem
                      console.log('Rendering category:', category.id, category.name, 'products:', category.products?.length || 0)
                      return (
                        <CategorySection
                          key={category.id}
                          category={category}
                          isSelected={selectedItem?.type === 'category' && selectedItem.id === category.id}
                          isMultiSelected={false}
                          onSelect={(e) => {
                            setSelectedItem({ type: 'category', id: category.id })
                          }}
                          onUpdate={(updates) => updateCategory(category.id, updates)}
                          onDelete={() => deleteCategory(category.id)}
                          globalCategoryStyle={customization.globalCategoryStyle}
                          globalProductCardStyle={customization.globalProductCardStyle}
                          onProductSelect={(productId, e) => {
                            // Stop event propagation to prevent category selection
                            if (e) {
                              e.stopPropagation()
                            }
                            setSelectedItem({ type: 'product', id: productId })
                          }}
                          onProductUpdate={(productId, updates) => updateProduct(productId, updates)}
                          onProductDelete={(productId) => deleteProduct(productId)}
                          activeDragId={activeDragId}
                          onAddProduct={handleAddProduct}
                          onCustomElementSelect={(elementId, e) => {
                            if (e) e.stopPropagation()
                            setSelectedCustomElementId(elementId)
                            setSelectedItem(null) // Clear parent selection
                          }}
                          onCustomElementUpdate={(elementId, updates) => {
                            // Recursively update nested element in category or product
                            const updateRecursive = (elements: CustomElement[]): CustomElement[] => {
                              return elements.map(el => {
                                if (el.id === elementId) {
                                  return { ...el, ...updates }
                                }
                                if (el.children && el.children.length > 0) {
                                  return { ...el, children: updateRecursive(el.children) }
                                }
                                return el
                              })
                            }
                            
                            const newCategories = categories.map(cat => {
                              // Update category children recursively
                              if (cat.children && cat.children.length > 0) {
                                const originalChildren = cat.children
                                const updatedCategoryChildren = updateRecursive(originalChildren)
                                // Check if any element was updated (directly or in nested children)
                                const hasUpdate = updatedCategoryChildren.some(c => 
                                  c.id === elementId || 
                                  (c.children && c.children.some(gc => gc.id === elementId)) ||
                                  JSON.stringify(c) !== JSON.stringify(originalChildren.find(oc => oc.id === c.id))
                                )
                                if (hasUpdate) {
                                  return { ...cat, children: updatedCategoryChildren }
                                }
                              }
                              
                              // Update product children recursively
                              const updatedProducts = cat.products.map(product => {
                                if (product.children && product.children.length > 0) {
                                  const originalProductChildren = product.children
                                  const updatedProductChildren = updateRecursive(originalProductChildren)
                                  // Check if any element was updated
                                  const hasUpdate = updatedProductChildren.some(c => 
                                    c.id === elementId || 
                                    (c.children && c.children.some(gc => gc.id === elementId)) ||
                                    JSON.stringify(c) !== JSON.stringify(originalProductChildren.find(oc => oc.id === c.id))
                                  )
                                  if (hasUpdate) {
                                    return { ...product, children: updatedProductChildren }
                                  }
                                }
                                return product
                              })
                              
                              return { ...cat, products: updatedProducts }
                            })
                            setCategories(newCategories)
                            saveToHistory(newCategories, customElements, customization)
                          }}
                          onCustomElementDelete={(elementId) => {
                            // Recursively delete nested element from category or product
                            const deleteRecursive = (elements: CustomElement[]): CustomElement[] => {
                              return elements
                                .filter(el => el.id !== elementId)
                                .map(el => {
                                  if (el.children && el.children.length > 0) {
                                    return { ...el, children: deleteRecursive(el.children) }
                                  }
                                  return el
                                })
                            }
                            
                            const newCategories = categories.map(cat => {
                              // Delete from category children recursively
                              if (cat.children && cat.children.length > 0) {
                                const filteredCategoryChildren = deleteRecursive(cat.children)
                                if (filteredCategoryChildren.length !== cat.children.length) {
                                  return { ...cat, children: filteredCategoryChildren }
                                }
                              }
                              
                              // Delete from product children recursively
                              const updatedProducts = cat.products.map(product => {
                                if (product.children && product.children.length > 0) {
                                  const filteredProductChildren = deleteRecursive(product.children)
                                  if (filteredProductChildren.length !== product.children.length) {
                                    return { ...product, children: filteredProductChildren }
                                  }
                                }
                                return product
                              })
                              
                              return { ...cat, products: updatedProducts }
                            })
                            setCategories(newCategories)
                            saveToHistory(newCategories, customElements, customization)
                            if (selectedCustomElementId === elementId) {
                              setSelectedCustomElementId(null)
                            }
                          }}
                          selectedCustomElementId={selectedCustomElementId}
                        />
                      )
                    } else {
                      // It's a custom element
                      const element = item as CustomElement
                      return (
                        <CustomElementComponent
                          key={element.id}
                          element={element}
                          isSelected={selectedItem?.type === 'custom' && selectedItem.id === element.id}
                          isMultiSelected={false}
                          activeDragId={activeDragId}
                          onDelete={() => deleteSection(element.id)}
                          onSelect={(e) => {
                            setSelectedItem({ type: 'custom', id: element.id })
                          }}
                          onUpdate={(updates) => {
                            const newElements = customElements.map(e =>
                              e.id === element.id ? { ...e, ...updates } : e
                            )
                            setCustomElements(newElements)
                            saveToHistory(categories, newElements, customization)
                          }}
                          onCustomElementSelect={(elementId, e) => {
                            if (e) e.stopPropagation()
                            setSelectedCustomElementId(elementId)
                            setSelectedItem(null)
                          }}
                          onCustomElementUpdate={(elementId, updates) => {
                            // Recursively update element in section and nested children
                            const updateRecursive = (elements: CustomElement[]): CustomElement[] => {
                              return elements.map(el => {
                                if (el.id === elementId) {
                                  return { ...el, ...updates }
                                }
                                if (el.children && el.children.length > 0) {
                                  return { ...el, children: updateRecursive(el.children) }
                                }
                                return el
                              })
                            }
                            
                            const newSections = customElements.map(sec => {
                              if (sec.children && sec.children.length > 0) {
                                const updatedChildren = updateRecursive(sec.children)
                                return { ...sec, children: updatedChildren }
                              }
                              return sec
                            })
                            setCustomElements(newSections)
                            saveToHistory(categories, newSections, customization)
                          }}
                          onCustomElementDelete={(elementId) => {
                            // Recursively delete from section and nested children
                            const deleteRecursive = (elements: CustomElement[]): CustomElement[] => {
                              return elements
                                .filter(el => el.id !== elementId)
                                .map(el => {
                                  if (el.children && el.children.length > 0) {
                                    return { ...el, children: deleteRecursive(el.children) }
                                  }
                                  return el
                                })
                            }
                            
                            const newSections = customElements.map(sec => {
                              if (sec.children && sec.children.length > 0) {
                                const updatedChildren = deleteRecursive(sec.children)
                                if (updatedChildren.length !== sec.children.length) {
                                  return { ...sec, children: updatedChildren }
                                }
                              }
                              return sec
                            })
                            setCustomElements(newSections)
                            saveToHistory(categories, newSections, customization)
                            if (selectedCustomElementId === elementId) {
                              setSelectedCustomElementId(null)
                            }
                          }}
                          selectedCustomElementId={selectedCustomElementId}
                        />
                      )
                    }
                  })
                })()}

                {/* Add buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Thêm danh mục
                  </button>
                  <button
                    onClick={addCustomElement}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    + Thêm element tùy chỉnh
                  </button>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Sidebar Panel */}
        <SidebarPanel
          selectedCategory={selectedCategory}
          selectedProduct={selectedProduct}
          selectedSection={selectedCustomElementForSidebar}
          selectedCustomElement={selectedCustomElement}
          customization={customization}
          onUpdateCategory={(updates) => selectedCategory && updateCategory(selectedCategory.id, updates)}
          onUpdateProduct={(updates) => selectedProduct && updateProduct(selectedProduct.id, updates)}
          onUpdateSection={(updates) => {
            if (selectedCustomElementForSidebar) {
              const newElements = customElements.map(e =>
                e.id === selectedCustomElementForSidebar.id ? { ...e, ...updates } : e
              )
              setCustomElements(newElements)
              saveToHistory(categories, newElements, customization)
            }
          }}
          onUpdateCustomElement={(updates) => {
            if (selectedCustomElement) {
              // Recursive update function
              const updateRecursive = (elements: CustomElement[]): CustomElement[] => {
                return elements.map(el => {
                  if (el.id === selectedCustomElement.id) {
                    return { ...el, ...updates }
                  }
                  if (el.children && el.children.length > 0) {
                    return { ...el, children: updateRecursive(el.children) }
                  }
                  return el
                })
              }

              // Update in categories
              const newCategories = categories.map(cat => {
                if (cat.children) {
                  const updatedChildren = updateRecursive(cat.children)
                  if (updatedChildren.some(c => c.id === selectedCustomElement.id)) {
                    return { ...cat, children: updatedChildren }
                  }
                }
                
                // Update in products
                const updatedProducts = cat.products.map(product => {
                  if (product.children) {
                    const updatedChildren = updateRecursive(product.children)
                    if (updatedChildren.some(c => c.id === selectedCustomElement.id)) {
                      return { ...product, children: updatedChildren }
                    }
                  }
                  return product
                })
                return { ...cat, products: updatedProducts }
              })

              // Update in custom elements
              const newCustomElements = updateRecursive(customElements)

              setCategories(newCategories)
              setCustomElements(newCustomElements)
              saveToHistory(newCategories, newCustomElements, customization)
            }
          }}
          onUpdateCustomization={updateCustomization}
          onClose={() => {
            setSelectedItem(null)
            setSelectedCustomElementId(null)
          }}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          html={generateMenuHTML(categories, customElements, customization, storeName)}
          mode={previewMode}
          onModeChange={setPreviewMode}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          currentCategories={categories}
          currentCustomElements={customElements}
          currentCustomization={customization}
          onApplyTemplate={(template) => {
            // Apply template: update categories, customElements, and customization
            setCategories(template.categories || [])
            setCustomElements(template.customElements || [])
            if (template.customization) {
              setCustomization(template.customization)
            }
            saveToHistory(template.categories || [], template.customElements || [], template.customization || customization)
            toast.success(`Đã áp dụng mẫu "${template.name}" thành công!`)
          }}
          storeId={storeId}
          token={token}
        />
      )}

      {/* Add Product Modal */}
      {addProductCategoryId && (
        <AddProductModal
          isOpen={addProductModalOpen}
          onClose={() => {
            setAddProductModalOpen(false)
            setAddProductCategoryId(null)
          }}
          categoryId={addProductCategoryId}
          storeId={storeId}
          token={token}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  )
}
