import Image from 'next/image'
import { PanelRightOpen } from 'lucide-react'
import type { ChatCharacterSummary } from './types'

export function ChatHeaderBar({
  characterInfo,
  onBack,
  onToggleMenu,
  isDataUrl,
}: {
  characterInfo: ChatCharacterSummary
  onBack: () => void
  onToggleMenu: () => void
  isDataUrl: (s: string) => boolean
}) {
  return (
    <div className="flex items-center gap-3 w-full px-4 py-3 border-b border-[#333] bg-[#111] sticky top-0 z-50 flex-wrap sm:flex-nowrap">
      <button
        onClick={onBack}
        className="text-white text-xl font-bold mr-2 hover:text-gray-300"
        type="button"
      >
        &lt;
      </button>
      {characterInfo.imageUrl && (
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src={characterInfo.imageUrl}
            alt="profile"
            fill
            sizes="40px"
            className="rounded-full object-cover"
            unoptimized={isDataUrl(characterInfo.imageUrl)}
          />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="font-semibold text-white text-base truncate">{characterInfo.name}</div>
        <div className="text-xs text-gray-400 truncate">{characterInfo.personality}</div>
      </div>
      <div className="text-right text-xs text-gray-400 ml-auto flex flex-col items-end sm:items-stretch">
        {characterInfo.userRole && <div className="truncate">역할: {characterInfo.userRole}</div>}
        <button
          type="button"
          onClick={onToggleMenu}
          className="mt-1 p-1 text-white hover:text-yellow-300 flex-shrink-0"
          title="메뉴 열기"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
