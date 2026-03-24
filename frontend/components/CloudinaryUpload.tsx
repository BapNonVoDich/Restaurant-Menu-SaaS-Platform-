'use client'

import Image from 'next/image'
import { useState, useRef, useId, useEffect } from 'react'
import toast from 'react-hot-toast'

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text()
  if (!text.trim()) {
    if (response.status === 503) return 'Dịch vụ upload chưa được cấu hình (Cloudinary). Vui lòng kiểm tra cấu hình server.'
    return fallback
  }
  try {
    const body = JSON.parse(text) as Record<string, unknown>
    const err = body.error ?? body.message
    if (typeof err === 'string' && err.trim()) return err
  } catch {
    /* plain text */
  }
  const trimmed = text.trim()
  return trimmed.length < 240 ? trimmed : fallback
}

interface CloudinaryUploadProps {
  onUploadComplete: (url: string) => void
  onUploadError?: (error: string) => void
  folder?: string
  accept?: string
  maxSize?: number // in MB
  buttonText?: string
  className?: string
  currentImageUrl?: string
  /** Optional stable id for label/input (defaults to React useId). */
  inputId?: string
}

export default function CloudinaryUpload({
  onUploadComplete,
  onUploadError,
  folder = 'product-images',
  accept = 'image/*',
  maxSize = 10,
  buttonText = 'Upload Image',
  className = '',
  currentImageUrl,
  inputId: inputIdProp
}: CloudinaryUploadProps) {
  const reactId = useId()
  const inputId = inputIdProp ?? `cloudinary-upload-${reactId.replace(/:/g, '')}`
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentImageUrl || null)
  }, [currentImageUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Kích thước file không được vượt quá ${maxSize}MB`)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Chưa đăng nhập')
      }

      // Get store ID first
      const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/my-store`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!storeResponse.ok) {
        const msg = await readApiErrorMessage(storeResponse, 'Không thể lấy thông tin cửa hàng')
        throw new Error(msg)
      }

      const store = await storeResponse.json()
      if (!store?.id) {
        throw new Error('Phản hồi cửa hàng không hợp lệ (thiếu id)')
      }

      // Upload to backend (which will upload to Cloudinary)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/catalog/stores/${store.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const msg = await readApiErrorMessage(uploadResponse, 'Upload ảnh thất bại')
        throw new Error(msg)
      }

      const result = await uploadResponse.json()
      const imageUrl = result.imageUrl || result.url

      onUploadComplete(imageUrl)
      toast.success('Upload ảnh thành công')
    } catch (error: any) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi upload ảnh'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
      // Clear preview on upload failure to maintain consistency
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id={inputId}
        disabled={uploading}
      />
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className={`inline-block px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition ${
            uploading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Đang upload...' : buttonText}
        </label>
        {preview && (
          <div className="relative h-32 w-full max-w-md rounded border overflow-hidden">
            <Image
              src={preview}
              alt="Xem trước"
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              unoptimized
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                onUploadComplete('')
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
