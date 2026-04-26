import { Settings, Image as ImageIcon } from 'lucide-react'
import type { RefObject } from 'react'
import type { ChatModelItem } from './types'

export function ChatInputBar({
  chatInputRef,
  input,
  setInput,
  onSend,
  isSending,
  onOpenSettings,
  onOpenModelModal,
  onOpenAssetPicker,
  isAssetPickerOpen,
  models,
  selectedModel,
}: {
  chatInputRef: RefObject<HTMLTextAreaElement | null>
  input: string
  setInput: (s: string) => void
  onSend: () => void
  isSending?: boolean
  onOpenSettings: () => void
  onOpenModelModal: () => void
  onOpenAssetPicker: () => void
  isAssetPickerOpen?: boolean
  models: ChatModelItem[]
  selectedModel: string
}) {
  return (
    <div className="absolute bottom-0 left-0 w-full px-4 py-3 z-50 bg-gradient-to-t from-black/80 to-transparent">
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAssetPicker}
            className={`text-xs border transition-all px-3 py-2.5 rounded-xl backdrop-blur-md flex items-center justify-center ${
              isAssetPickerOpen 
                ? 'bg-[#e45463] border-[#e45463] text-white shadow-lg shadow-[#e45463]/20' 
                : 'bg-black/40 hover:bg-black/60 border-white/10 text-white/70'
            }`}
            title="이미지 에셋 선택"
          >
            <ImageIcon size={16} />
            <span className="ml-1 hidden sm:inline">Image</span>
          </button>
          
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 px-3 py-2.5 rounded-xl backdrop-blur-md flex items-center justify-center transition"
            title="시스템 설정 (프롬프트 / 모듈)"
          >
            <Settings size={16} />
            <span className="ml-1 hidden sm:inline">System</span>
          </button>
          <button
            type="button"
            onClick={onOpenModelModal}
            className="text-xs bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 px-3 py-2.5 rounded-xl backdrop-blur-md flex items-center justify-center transition"
            title="모델 변경"
          >
            {models.find((m) => m.id === selectedModel)?.icon}
            <span className="ml-1 hidden sm:inline">
              {models.find((m) => m.id === selectedModel)?.label?.split('·')[0].trim() ?? 'Select'}
            </span>
          </button>
        </div>

        <div className="flex flex-1 ml-2 items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition">
          <textarea
            ref={chatInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (isSending) return
                onSend()
              }
            }}
            placeholder="행동이나 대사를 입력하세요..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-[15px] focus:outline-none resize-none overflow-hidden h-auto max-h-24 py-1.5"
            rows={1}
            disabled={isSending}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="ml-2 p-2 rounded-lg bg-[#e45463]/80 hover:bg-[#d04352] transition-colors flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.94 2.94a1.5 1.5 0 0 1 1.67-.3l12.5 5.8a1.5 1.5 0 0 1 0 2.72l-12.5 5.8A1.5 1.5 0 0 1 2 15.8V4.2a1.5 1.5 0 0 1 .94-1.26z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
