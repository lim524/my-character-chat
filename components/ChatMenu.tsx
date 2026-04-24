import { X } from 'lucide-react'
import { useState } from 'react'
import ChatRoomList from './chat/ChatRoomList'
import type { ChatMessage } from './chat/types'
import type { ChatRoom } from '@/lib/chatRooms'

interface ChatMenuProps {
  characterId: string
  characterName: string
  activeRoomId: string | null
  onClose: () => void
  onSelectRoom: (roomId: string) => void
  onCreateRoom: (room: ChatRoom) => void
  onDeleteRoom: (roomId: string) => void
}

export default function ChatMenu({
  characterId,
  characterName,
  activeRoomId,
  onClose,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
}: ChatMenuProps) {
  return (
    <div className="w-full h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-0.5">채팅방 관리</div>
          <div className="text-base font-bold text-white truncate max-w-[200px]">{characterName}</div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-hidden">
        <ChatRoomList
          characterId={characterId}
          activeRoomId={activeRoomId}
          onSelectRoom={onSelectRoom}
          onCreateRoom={onCreateRoom}
          onDeleteRoom={onDeleteRoom}
        />
      </div>
    </div>
  )
}
