import type { MouseEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { SaveSlot } from '@/lib/localStorage'

export function ChatSaveLoadModal({
  open,
  onClose,
  saveLoadTab,
  setSaveLoadTab,
  saveSlots,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
}: {
  open: boolean
  onClose: () => void
  saveLoadTab: 'save' | 'load'
  setSaveLoadTab: (t: 'save' | 'load') => void
  saveSlots: SaveSlot[]
  onSaveSlot: (slotIndex: number) => void
  onLoadSlot: (slotIndex: number) => void
  onDeleteSlot: (e: MouseEvent, slotIndex: number) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col relative shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          닫기 ✕
        </button>
        <div className="flex border-b border-white/10 mb-6 gap-6">
          <button
            type="button"
            onClick={() => setSaveLoadTab('save')}
            className={`pb-3 px-2 text-lg font-bold transition-colors ${
              saveLoadTab === 'save' ? 'text-white border-b-2 border-[#e45463]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            SAVE (진행 상황 저장)
          </button>
          <button
            type="button"
            onClick={() => setSaveLoadTab('load')}
            className={`pb-3 px-2 text-lg font-bold transition-colors ${
              saveLoadTab === 'load' ? 'text-white border-b-2 border-[#e45463]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            LOAD (불러오기)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const sIdx = i + 1
              const savedData = saveSlots.find((s) => s.slotIndex === sIdx)

              return (
                <div
                  key={`slot-${sIdx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (saveLoadTab === 'save') onSaveSlot(sIdx)
                    else if (saveLoadTab === 'load' && savedData) onLoadSlot(sIdx)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (saveLoadTab === 'save') onSaveSlot(sIdx)
                      else if (saveLoadTab === 'load' && savedData) onLoadSlot(sIdx)
                    }
                  }}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden group h-32 flex flex-col justify-center ${
                    savedData
                      ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                      : 'border-white/5 bg-black/40 border-dashed hover:border-white/30 text-gray-600'
                  }`}
                >
                  <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-[#e45463] bg-black/50 px-2 py-0.5 rounded">
                    SLOT {sIdx.toString().padStart(2, '0')}
                  </span>

                  {savedData && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteSlot(e, sIdx)}
                      className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-500/80 rounded transition opacity-0 group-hover:opacity-100"
                      title="슬롯 삭제"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  )}

                  {savedData ? (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-1">{new Date(savedData.savedAt).toLocaleString()}</p>
                      <p className="text-sm font-medium text-white line-clamp-2">{savedData.previewText}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium">EMPTY</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
