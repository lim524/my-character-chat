import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import MessageParser from '@/components/MessageParser'
import type { RegexScriptEntry } from '@/lib/interfaceConfig'
import { buildVnDialogueStyles, VN_DIALOGUE_BOX_CLASS } from '@/lib/vnDialogueStyles'
import { parseMergedVisibility } from '@/lib/interfaceRuntime'
import type { ChatCharacterSummary, ChatMessage } from './types'

export function ChatDialoguePanel(props: {
  isLogOpen: boolean
  messages: ChatMessage[]
  characterInfo: ChatCharacterSummary | null
  regexScripts: RegexScriptEntry[] | undefined
  editTargetId: string | null
  setEditTargetId: (id: string | null) => void
  editContent: string
  setEditContent: (s: string) => void
  onSaveEdit: () => void
  onDeleteMessage: (id: string) => void
  assistantPagesForLatest: string[] | null
  assistantDialogPageIndex: number
  setAssistantDialogPageIndex: Dispatch<SetStateAction<number>>
  viewMessageIndex: number
  setViewMessageIndex: Dispatch<SetStateAction<number>>
  onOpenLog: () => void
}) {
  const {
    isLogOpen,
    messages,
    characterInfo,
    regexScripts,
    editTargetId,
    setEditTargetId,
    editContent,
    setEditContent,
    onSaveEdit,
    onDeleteMessage,
    assistantPagesForLatest,
    assistantDialogPageIndex,
    setAssistantDialogPageIndex,
    viewMessageIndex,
    setViewMessageIndex,
    onOpenLog,
  } = props
  const visibility = parseMergedVisibility(characterInfo?.interfaceConfig?.extraInterfaceEntries)
  
  if (isLogOpen || visibility.dialogue === false) return null

  // 메시지가 하나도 없거나 캐릭터 정보를 아직 불러오지 못한 경우에 대한 가이드 UI
  if (messages.length === 0 || !characterInfo) {
    const { boxStyle, nameLabelStyle, textBodyStyle } = buildVnDialogueStyles(
      characterInfo?.interfaceConfig?.uiTheme as Record<string, unknown> | undefined
    )
    return (
      <div className="absolute left-0 right-0 bottom-[76px] z-20 flex justify-center px-4">
        <div className={`${VN_DIALOGUE_BOX_CLASS} group`} style={boxStyle as CSSProperties}>
          <div className="text-xs font-semibold tracking-wide mb-2 drop-shadow-md" style={nameLabelStyle}>
            {characterInfo?.name || '캐릭터 로딩 중...'}
          </div>
          <div
            className="text-sm md:text-base leading-relaxed min-h-[3rem] whitespace-pre-wrap text-gray-300"
            style={{ ...textBodyStyle, opacity: 0.92 }}
          >
            {!characterInfo 
              ? '캐릭터 정보를 불러오는 중입니다...' 
              : '아직 대화 기록이 없습니다. 아래 입력창에서 대화를 시작해 보세요.'}
          </div>
        </div>
      </div>
    )
  }

  const currentMsg = messages[viewMessageIndex] ?? messages[messages.length - 1]
  if (!currentMsg) return null
  const isLastMessage = viewMessageIndex >= messages.length - 1

  const isUser = currentMsg.role === 'user'
  const isEditing = editTargetId === currentMsg.id
  const { boxStyle: assistantBoxStyle, nameLabelStyle, textBodyStyle } = buildVnDialogueStyles(
    characterInfo?.interfaceConfig?.uiTheme as Record<string, unknown> | undefined
  )
  const boxStyle: CSSProperties = !isUser
    ? (assistantBoxStyle as CSSProperties)
    : { backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }

  const vnPages = assistantPagesForLatest
  const vnPageIdx = vnPages?.length
    ? Math.min(assistantDialogPageIndex, Math.max(0, vnPages.length - 1))
    : 0
  const assistantDisplayContent =
    !isUser && vnPages && vnPages.length > 0 ? vnPages[vnPageIdx] : currentMsg.content

  const handlePrev = () => {
    if (!isUser && vnPageIdx > 0) {
      setAssistantDialogPageIndex(vnPageIdx - 1)
    } else if (viewMessageIndex > 0) {
      setViewMessageIndex(viewMessageIndex - 1)
    }
  }

  const handleNext = () => {
    if (!isUser && vnPages && vnPageIdx < vnPages.length - 1) {
      setAssistantDialogPageIndex(vnPageIdx + 1)
    } else if (viewMessageIndex < messages.length - 1) {
      setViewMessageIndex(viewMessageIndex + 1)
    }
  }

  const assets = characterInfo?.interfaceConfig?.assets || []

  return (
    <div className="absolute left-0 right-0 bottom-[76px] z-20 flex justify-center px-4">
      <div className={`${VN_DIALOGUE_BOX_CLASS} group`} style={boxStyle}>
        {!isUser && (
          <div className="text-xs font-semibold tracking-wide mb-2 drop-shadow-md" style={nameLabelStyle}>
            {characterInfo?.name || '???'}
          </div>
        )}
        {isUser && (
          <div className="text-xs font-semibold text-gray-400 mb-2">
            {characterInfo?.userName || 'User'}
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-[#222] border border-gray-600 px-3 py-2 text-white rounded resize-none w-full"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onSaveEdit} className="text-sm text-yellow-400 hover:text-yellow-300">
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
            onClick={() => {
              if (isEditing) return
              if (!isUser && vnPages && vnPageIdx < vnPages.length - 1) {
                setAssistantDialogPageIndex(vnPageIdx + 1)
              } else if (viewMessageIndex < messages.length - 1) {
                setViewMessageIndex(viewMessageIndex + 1)
              }
            }}
            className={`text-sm md:text-base leading-relaxed font-light min-h-[4rem] ${
              isUser 
                ? 'italic text-gray-300' 
                : 'cursor-pointer'
            } max-h-[min(38vh,380px)] overflow-y-auto overflow-x-hidden pr-1`}
            style={!isUser ? textBodyStyle : {}}
          >
            {isUser ? (
              <MessageParser
                content={currentMsg.content}
                assets={assets}
                regexScripts={regexScripts}
              />
            ) : vnPages && vnPages.length > 1 ? (
              <>
                <div className="hidden" aria-hidden>
                  <MessageParser
                    content={currentMsg.content}
                    assets={assets}
                    regexScripts={regexScripts}
                  />
                </div>
                <MessageParser
                  content={assistantDisplayContent}
                  assets={assets}
                  regexScripts={regexScripts}
                />
              </>
            ) : (
              <MessageParser
                content={currentMsg.content}
                assets={assets}
                regexScripts={regexScripts}
              />
            )}
          </div>
        )}

        {/* 사이드 네비게이션 화살표 */}
        {!isEditing && (
          <>
            <button
              type="button"
              disabled={viewMessageIndex <= 0 && vnPageIdx <= 0}
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-white hover:bg-black/60 hover:scale-110 transition-all disabled:opacity-0 disabled:pointer-events-none group/nav z-30 backdrop-blur-sm"
              title="이전 (ArrowLeft)"
            >
              <ChevronLeft className="w-6 h-6 md:w-9 md:h-9 group-hover/nav:-translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              disabled={isLastMessage && (!vnPages || vnPageIdx >= vnPages.length - 1)}
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-white hover:bg-black/60 hover:scale-110 transition-all disabled:opacity-0 disabled:pointer-events-none group/nav z-30 backdrop-blur-sm"
              title="다음 (ArrowRight / Space)"
            >
              <ChevronRight className="w-6 h-6 md:w-9 md:h-9 group-hover/nav:translate-x-1 transition-transform" />
            </button>
          </>
        )}

        {vnPages && vnPages.length > 1 && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-medium tracking-widest uppercase">
            Page {vnPageIdx + 1} / {vnPages.length}
          </div>
        )}

        {!isEditing && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEditTargetId(currentMsg.id)
                setEditContent(currentMsg.content)
              }}
              className="text-gray-400 hover:text-white"
              title="수정"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteMessage(currentMsg.id)
              }}
              className="text-gray-400 hover:text-red-400"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenLog()
          }}
          className="absolute -top-8 right-0 px-4 py-1.5 bg-black/60 hover:bg-black/80 rounded-t-lg border-x border-t border-white/20 text-xs text-gray-300 transition-colors backdrop-blur-md"
        >
          Log (대화 기록)
        </button>
      </div>
    </div>
  )
}
