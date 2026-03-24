'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (fileUrl: string) => void
  storeId: string
  token: string
  currentFileUrl?: string
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  storeId,
  token,
  currentFileUrl
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentFileUrl || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP) hoặc PDF')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('File quá lớn. Kích thước tối đa là 10MB')
      return
    }

    setFile(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file')
      return
    }

    setUploading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storeId', storeId)

      // Upload file
      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData
      })

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

      const data = await response.json()
      const fileUrl = data.fileUrl || data.url

      toast.success('Upload file thành công!', {
        duration: 3000,
        icon: '✅'
      })

      onUploadSuccess(fileUrl)
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể upload file. Vui lòng thử lại.'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentFileUrl) return

    const confirmed = window.confirm('Bạn có chắc muốn xóa file menu này?')
    if (!confirmed) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

    try {
      const response = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-file`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Đã xóa file menu thành công!')
        onUploadSuccess('')
        handleClose()
      } else {
        throw new Error('Không thể xóa file')
      }
    } catch (error) {
      toast.error('Không thể xóa file. Vui lòng thử lại.')
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(currentFileUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tải lên file menu</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file menu (Ảnh hoặc PDF)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Hỗ trợ: JPG, PNG, GIF, WEBP, PDF (tối đa 10MB)
              </p>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xem trước
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {file?.type === 'application/pdf' || preview.endsWith('.pdf') ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-gray-600">{file?.name || 'File PDF'}</p>
                    </div>
                  ) : (
                    <div className="relative w-full min-h-[200px] max-h-96 mx-auto rounded-lg overflow-hidden">
                      <Image
                        src={preview}
                        alt="Xem trước"
                        width={800}
                        height={384}
                        className="max-w-full max-h-96 w-auto h-auto mx-auto rounded-lg object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Current File Info */}
            {currentFileUrl && !file && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>File hiện tại:</strong> {currentFileUrl}
                </p>
                <button
                  onClick={handleRemove}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Xóa file hiện tại
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Hủy
          </button>
          {currentFileUrl && !file && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition"
            >
              Xóa
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {uploading ? 'Đang upload...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
