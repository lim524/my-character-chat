import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Pencil, Check, X, MessageCircle } from 'lucide-react'
import {
  getChatRooms,
  createChatRoom,
  deleteChatRoom,
  renameChatRoom,
  type ChatRoom,
} from '@/lib/chatRooms'

interface ChatRoomListProps {
  characterId: string
  activeRoomId: string | null
  onSelectRoom: (roomId: string) => void
  onCreateRoom: (room: ChatRoom) => void
  onDeleteRoom: (roomId: string) => void
}

export default function ChatRoomList({
  characterId,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
}: ChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // 채팅방 목록 로드
  useEffect(() => {
    void getChatRooms(characterId).then(setRooms)
  }, [characterId])

  // 활성 방 변경/탭 복귀 시 목록 동기화
  useEffect(() => {
    const refresh = () => void getChatRooms(characterId).then(setRooms)
    refresh()
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [characterId, activeRoomId])

  // 편집 모드 진입 시 입력란에 포커스
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = async () => {
    const room = await createChatRoom(characterId)
    setRooms(await getChatRooms(characterId))
    onCreateRoom(room)
  }

  const handleDelete = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation()
    if (!window.confirm('이 채팅방을 삭제하시겠습니까?\n대화 기록도 함께 삭제됩니다.')) return
    await deleteChatRoom(characterId, roomId)
    setRooms(await getChatRooms(characterId))
    onDeleteRoom(roomId)
  }

  const handleStartRename = (e: React.MouseEvent, room: ChatRoom) => {
    e.stopPropagation()
    setEditingId(room.id)
    setEditName(room.name)
  }

  const handleSaveRename = async () => {
    if (editingId && editName.trim()) {
      await renameChatRoom(characterId, editingId, editName.trim())
      setRooms(await getChatRooms(characterId))
    }
    setEditingId(null)
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditName('')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 + 새 채팅방 버튼 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          채팅방 ({rooms.length})
        </span>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e45463]/20 hover:bg-[#e45463]/30 text-[#e45463] text-xs font-semibold transition-colors"
          title="새 채팅방 만들기"
        >
          <Plus className="w-3.5 h-3.5" />
          새 채팅방
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto py-1">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-10 text-center px-6">
            <MessageCircle className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-xs text-gray-600">채팅방이 없습니다</p>
            <p className="text-[10px] text-gray-700 mt-1">위의 버튼을 눌러 새 채팅방을 만들어보세요</p>
          </div>
        ) : (
          rooms.map((room) => {
            const isActive = room.id === activeRoomId
            const isEditing = editingId === room.id

            return (
              <div
                key={room.id}
                onClick={() => !isEditing && onSelectRoom(room.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all border-l-2 ${
                  isActive
                    ? 'bg-[#e45463]/10 border-[#e45463] text-white'
                    : 'border-transparent hover:bg-white/5 text-gray-300'
                }`}
              >
                {/* 채팅방 아이콘 */}
                <MessageCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#e45463]' : 'text-gray-600'}`} />

                {/* 이름 (편집 모드 / 일반 모드) */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={editInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSaveRename()
                          if (e.key === 'Escape') handleCancelRename()
                        }}
                        className="flex-1 bg-[#222] border border-[#444] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#e45463]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleSaveRename() }}
                        className="p-0.5 text-green-400 hover:text-green-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelRename() }}
                        className="p-0.5 text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">{room.name}</div>
                      <div className="text-[10px] text-gray-600">{formatDate(room.createdAt)}</div>
                    </>
                  )}
                </div>

                {/* 액션 버튼 (이름 변경 / 삭제) */}
                {!isEditing && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => handleStartRename(e, room)}
                      className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition"
                      title="이름 변경"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, room.id)}
                      className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
