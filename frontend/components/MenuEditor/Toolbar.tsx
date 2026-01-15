'use client'

interface ToolbarProps {
  onSave: () => void
  onReset: () => void
  onUndo: () => void
  onRedo: () => void
  onPreview: () => void
  onPublishedSite: () => void
  onTemplates: () => void
  canUndo: boolean
  canRedo: boolean
  saving: boolean
}

export default function Toolbar({
  onSave,
  onReset,
  onUndo,
  onRedo,
  onPreview,
  onPublishedSite,
  onTemplates,
  canUndo,
  canRedo,
  saving
}: ToolbarProps) {
  return (
    <div className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">Trình chỉnh sửa thực đơn</h1>
        <span className="text-sm text-gray-500">WYSIWYG Editor</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Hoàn tác (Ctrl+Z)"
        >
          ↶ Hoàn tác
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Làm lại (Ctrl+Y)"
        >
          ↷ Làm lại
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Preview */}
        <button
          onClick={onPreview}
          className="px-4 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
        >
          👁️ Xem trước
        </button>

        {/* Published Site */}
        <button
          onClick={onPublishedSite}
          className="px-4 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
        >
          🌐 Trang đã xuất bản
        </button>

        {/* Templates */}
        <button
          onClick={onTemplates}
          className="px-4 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition"
        >
          📋 Mẫu
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Reset */}
        <button
          onClick={onReset}
          className="px-4 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition"
        >
          🔄 Đặt lại HTML
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Đang lưu...' : '💾 Lưu'}
        </button>
      </div>
    </div>
  )
}
