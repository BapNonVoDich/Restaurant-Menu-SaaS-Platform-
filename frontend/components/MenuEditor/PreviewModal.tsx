'use client'

import { useState } from 'react'

interface PreviewModalProps {
  html: string
  mode: 'desktop' | 'mobile'
  onModeChange: (mode: 'desktop' | 'mobile') => void
  onClose: () => void
}

export default function PreviewModal({
  html,
  mode,
  onModeChange,
  onClose
}: PreviewModalProps) {
  const [iframeKey, setIframeKey] = useState(0)

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Xem trước</h2>
            <div className="flex gap-2">
              <button
                onClick={() => onModeChange('desktop')}
                className={`px-3 py-1.5 rounded-md transition ${
                  mode === 'desktop'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💻 Desktop
              </button>
              <button
                onClick={() => onModeChange('mobile')}
                className={`px-3 py-1.5 rounded-md transition ${
                  mode === 'mobile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 Mobile
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div
            className={`bg-white mx-auto shadow-lg ${
              mode === 'mobile' ? 'max-w-sm' : 'w-full'
            }`}
            style={{
              minHeight: mode === 'mobile' ? '667px' : 'auto'
            }}
          >
            <iframe
              key={iframeKey}
              srcDoc={iframeContent}
              className="w-full h-full border-0"
              style={{
                minHeight: mode === 'mobile' ? '667px' : '800px'
              }}
              title="Xem trước menu"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
