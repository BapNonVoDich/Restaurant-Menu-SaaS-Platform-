'use client'

import { useState, useEffect, useCallback } from 'react'
import { CategoryItem, CustomElement, CustomizationSettings, MenuTemplate } from '@/lib/menuEditor/types'
import { generateMenuHTML } from '@/lib/menuEditor/menuGenerator'
import PreviewModal from './PreviewModal'
import toast from 'react-hot-toast'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  currentCategories: CategoryItem[]
  currentCustomElements: CustomElement[]
  currentCustomization: CustomizationSettings
  onApplyTemplate: (template: MenuTemplate) => void
  storeId: string
  token: string
}

export default function TemplateModal({
  isOpen,
  onClose,
  currentCategories,
  currentCustomElements,
  currentCustomization,
  onApplyTemplate,
  storeId,
  token
}: TemplateModalProps) {
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MenuTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform API response to MenuTemplate format
        const transformedTemplates: MenuTemplate[] = data.map((t: any) => {
          const templateData = JSON.parse(t.templateData)
          return {
            id: t.id,
            name: t.name,
            categories: templateData.categories || [],
            customElements: templateData.customElements || [],
            customization: templateData.customization || currentCustomization,
            createdAt: t.createdAt
          }
        })
        setTemplates(transformedTemplates)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Không thể tải mẫu')
      }
    } catch (e) {
      console.error('Error loading templates:', e)
      setError('Không thể tải mẫu')
    } finally {
      setLoading(false)
    }
  }, [storeId, token, currentCustomization])

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, loadTemplates])

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Vui lòng nhập tên mẫu')
      return
    }

    if (templates.length >= 3) {
      toast.error('Chỉ có thể lưu tối đa 3 mẫu. Vui lòng xóa một mẫu cũ trước.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const templateData = JSON.stringify({
        categories: currentCategories,
        customElements: currentCustomElements,
        customization: currentCustomization
      })

      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: templateName.trim(),
          templateData: templateData
        })
      })

      if (response.ok) {
        const savedTemplate = await response.json()
        // Transform to MenuTemplate format
        const templateDataParsed = JSON.parse(savedTemplate.templateData)
        const newTemplate: MenuTemplate = {
          id: savedTemplate.id,
          name: savedTemplate.name,
          categories: templateDataParsed.categories || [],
          customElements: templateDataParsed.customElements || [],
          customization: templateDataParsed.customization || currentCustomization,
          createdAt: savedTemplate.createdAt
        }
        setTemplates([...templates, newTemplate])
        setTemplateName('')
        setShowSaveForm(false)
        toast.success(`Đã lưu mẫu "${templateName.trim()}" thành công!`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Không thể lưu mẫu'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (e) {
      console.error('Error saving template:', e)
      const errorMessage = e instanceof Error ? e.message : 'Không thể lưu mẫu'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bạn có chắc muốn xóa mẫu này?')) return

    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok || response.status === 204) {
        const deletedTemplate = templates.find(t => t.id === templateId)
        setTemplates(templates.filter(t => t.id !== templateId))
        toast.success(`Đã xóa mẫu "${deletedTemplate?.name || ''}" thành công!`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Không thể xóa mẫu'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (e) {
      console.error('Error deleting template:', e)
      const errorMessage = e instanceof Error ? e.message : 'Không thể xóa mẫu'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = (template: MenuTemplate) => {
    if (confirm('Áp dụng mẫu này sẽ thay thế tất cả các danh mục và sản phẩm hiện tại. Bạn có chắc không?')) {
      onApplyTemplate(template)
      onClose()
      toast.success(`Đã áp dụng mẫu "${template.name}" thành công!`)
    }
  }

  const handlePreviewTemplate = (template: MenuTemplate) => {
    // For preview, merge template categories/products with current customization and customElements
    // This ensures preview shows template data with current styles
    const previewTemplate: MenuTemplate = {
      ...template,
      customization: currentCustomization, // Use current customization for preview
      customElements: currentCustomElements // Use current customElements for preview
    }
    setPreviewTemplate(previewTemplate)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý mẫu</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Save Template Form */}
          {showSaveForm ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Lưu mẫu hiện tại</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Tên mẫu..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTemplate()
                    if (e.key === 'Escape') {
                      setShowSaveForm(false)
                      setTemplateName('')
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false)
                    setTemplateName('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Mẫu sẽ lưu các danh mục, sản phẩm và cài đặt hiện tại. Tối đa 3 mẫu.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Lưu mẫu hiện tại
            </button>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Templates List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Mẫu đã lưu ({templates.length}/3)</h3>
            {loading && templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có mẫu nào. Lưu mẫu hiện tại để bắt đầu.
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.categories.length} danh mục, {template.customElements.length} element tùy chỉnh
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tạo lúc: {new Date(template.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewTemplate(template)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        👁️ Xem trước
                      </button>
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Áp dụng
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          html={generateMenuHTML(
            previewTemplate.categories || [],
            previewTemplate.customElements || [],
            previewTemplate.customization || currentCustomization,
                'Mẫu template'
          )}
          mode={previewMode}
          onModeChange={setPreviewMode}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}
