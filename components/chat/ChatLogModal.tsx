import type { RefObject } from 'react'
import { BookOpen, Pencil, Trash2 } from 'lucide-react'
import MessageParser from '@/components/MessageParser'
import type { RegexScriptEntry } from '@/lib/interfaceConfig'
import type { ChatCharacterSummary, ChatMessage } from './types'

export function ChatLogModal({
  messages,
  characterInfo,
  regexScripts,
  editTargetId,
  setEditTargetId,
  editContent,
  setEditContent,
  onSaveEdit,
  onDeleteMessage,
  onClose,
  bottomRef,
}: {
  messages: ChatMessage[]
  characterInfo: ChatCharacterSummary | null
  regexScripts: RegexScriptEntry[] | undefined
  editTargetId: string | null
  setEditTargetId: (id: string | null) => void
  editContent: string
  setEditContent: (s: string) => void
  onSaveEdit: () => void
  onDeleteMessage: (id: string) => void
  onClose: () => void
  bottomRef: RefObject<HTMLDivElement | null>
}) {
  const assets = characterInfo?.interfaceConfig?.assets || []

  return (
    <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center pt-20 pb-6 px-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 text-white bg-black/50 py-3 px-6 rounded-2xl border border-white/10">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> 대화 기록
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-[#e45463] hover:bg-[#d04352] rounded-lg text-sm transition font-medium"
        >
          닫기
        </button>
      </div>
      <div className="w-full max-w-4xl flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          const isEditingLog = editTargetId === msg.id
          return (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl border border-white/5 relative group transition ${
                isUser ? 'bg-blue-900/20 ml-10' : 'bg-[#111] mr-10'
              }`}
            >
              <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-2 uppercase">
                {isUser ? characterInfo?.userName || 'User' : characterInfo?.name}
              </div>

              {isEditingLog ? (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-[#222] border border-gray-600 px-3 py-2 text-white rounded resize-none w-full"
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onSaveEdit}
                      className="text-sm text-yellow-400 hover:text-yellow-300"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTargetId(null)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-[15px] text-gray-200 whitespace-pre-wrap leading-relaxed ${
                    isUser ? 'italic' : ''
                  }`}
                >
                  <MessageParser
                    content={msg.content}
                    assets={assets}
                    regexScripts={regexScripts}
                    showControlTags
                  />
                </div>
              )}

              {!isEditingLog && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetId(msg.id)
                      setEditContent(msg.content)
                    }}
                    className="text-gray-400 hover:text-white"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMessage(msg.id)}
                    className="text-gray-400 hover:text-red-400"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  )
}
