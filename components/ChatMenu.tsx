import { X, Plus, Trash2, MessageSquare } from 'lucide-react'
import { getChatSessions, deleteChatSession, type ChatSession } from '@/lib/localStorage'
import { useState, useEffect } from 'react'

interface ChatMenuProps {
  characterId: string
  characterName: string
  onClose: () => void
  onNewChat: () => void          // 현재 대화를 세션으로 저장하고 새 채팅 초기화
  onLoadSession: (messages: any[]) => void
}

export default function ChatMenu({
  characterId,
  characterName,
  onClose,
  onNewChat,
  onLoadSession,
}: ChatMenuProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    setSessions(getChatSessions(characterId))
  }, [characterId])

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!window.confirm('이 대화 기록을 삭제하시겠습니까?')) return
    deleteChatSession(characterId, sessionId)
    setSessions(getChatSessions(characterId))
  }

  const handleLoad = (session: ChatSession) => {
    if (!window.confirm('이 대화를 불러오시겠습니까?\n현재 진행 중인 대화는 사라집니다.')) return
    onLoadSession(session.messages)
    onClose()
  }

  const handleNewChat = () => {
    onNewChat()
    // 새 채팅 시작 후 세션 목록 갱신
    setTimeout(() => setSessions(getChatSessions(characterId)), 50)
    onClose()
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-full h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-0.5">대화 기록</div>
          <div className="text-base font-bold text-white truncate max-w-[200px]">{characterName}</div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#e45463] hover:bg-[#d04352] active:scale-95 text-white font-semibold text-sm transition-all shadow-lg shadow-[#e45463]/20"
        >
          <Plus className="w-4 h-4" />
          새 채팅 시작
        </button>
      </div>

      {/* Session count */}
      <div className="px-5 pt-3 pb-1 flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
          저장된 대화 {sessions.length}개
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20 text-center px-6">
            <MessageSquare className="w-10 h-10 text-gray-800 mb-3" />
            <p className="text-sm text-gray-600">아직 저장된 대화가 없습니다</p>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed">
              "새 채팅 시작"을 누르면<br />현재 대화가 자동으로 저장됩니다
            </p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-[#0d0d0d] z-10">
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest w-[90px]">날짜</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">미리보기</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest text-right w-[36px]">삭제</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, idx) => (
                <tr
                  key={session.id}
                  onClick={() => handleLoad(session)}
                  className={`group cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'}`}
                >
                  {/* Date */}
                  <td className="px-5 py-3 align-top">
                    <div className="text-[11px] text-gray-500 leading-snug whitespace-nowrap">
                      {formatDate(session.savedAt)}
                    </div>
                    <div className="text-[10px] text-gray-700 mt-0.5">
                      {session.messageCount}개
                    </div>
                  </td>

                  {/* Preview */}
                  <td className="px-2 py-3 align-top">
                    <div className="text-[13px] text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                      {session.previewText}
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-3 align-top text-right">
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
