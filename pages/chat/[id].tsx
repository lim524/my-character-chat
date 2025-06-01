'use client'
import ChatMenu from '@/components/ChatMenu'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { Pencil, Trash2, PanelRightOpen, Sparkles, Smile, Bot, Zap, Feather, Gem } from 'lucide-react' // 이모티콘 아이콘 추가

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Role = 'user' | 'assistant'

type Message = {
  id: string;
  role: Role
  content: string
  created_at?: string;
}

type EmotionImage = {
  label: string
  imageUrl: string
}

type Character = {
  id?: string
  name: string
  personality: string
  description: string
  situation: string
  firstLine?: string
  imageUrl?: string
  userName?: string
  userRole?: string
  userDescription?: string
  emotionImages: EmotionImage[]
}

const models = [
  { id: 'gpt-3.5', label: 'GPT-3.5 Turbo', description: '빠른 속도의 AI 모델', point: 10, icon: <Zap size={16} /> },
  { id: 'gpt-4o', label: 'GPT-4o', description: '고성능 몰입형 AI', point: 20, icon: <Sparkles size={16} /> },
  { id: 'claude-haiku', label: 'Claude 3.7 Haiku', description: '가볍고 빠른 답변용 AI', point: 10, icon: <Feather size={16} /> },
  { id: 'claude-sonnet', label: 'Claude 3.7 Sonnet', description: '고퀄리티 감정 몰입 대화 AI', point: 20, icon: <Smile size={16} /> },
  { id: 'gemini-flash', label: 'Gemini 2.5 Flash', description: '빠르고 경제적인 구글 AI', point: 10, icon: <Gem size={16} /> },
  { id: 'gemini-pro', label: 'Gemini 2.5 Pro', description: '고급 지능과 묘사를 가진 구글 AI', point: 20, icon: <Bot size={16} /> },
]

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { id, mode } = router.query

  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [characterInfo, setCharacterInfo] = useState<Character | null>(null)
  const [displayedImage, setDisplayedImage] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [showModelModal, setShowModelModal] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const bottomRef = useRef<HTMLDivElement>(null) 

  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userDescription, setUserDescription] = useState('')
  const [lore, setLore] = useState('')
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUserId(data.session?.user?.id ?? null)
    }
    getSession()
  }, [])

  useEffect(() => {
    const resolveSessionId = async () => {
      if (typeof id !== 'string' || !userId) return

      if (mode === 'continue') {
        const { data: latestSession, error } = await supabase
          .from('chat_messages')
          .select('session_id')
          .eq('user_id', userId)
          .eq('character_id', id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ 세션 ID 조회 실패:', error)
          return
        }

        const lastSessionId = latestSession?.[0]?.session_id
        if (lastSessionId) {
          setSessionId(lastSessionId)
          return
        }
      }

      setSessionId(crypto.randomUUID())
    }

    resolveSessionId()
  }, [id, mode, userId])

  useEffect(() => {
    if (!userId || !id || !sessionId) return

    const fetchCharacter = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error('❌ 캐릭터 불러오기 실패:', error)
        return
      }

      const formattedCharacter: Character = {
        ...data,
        emotionImages: Array.isArray(data.emotion_images) ? data.emotion_images : [],
      }

      setCharacterInfo(formattedCharacter)
      // 디버깅용: 캐릭터 정보 로드 확인
      console.log('캐릭터 정보 로드:', formattedCharacter);
      console.log('배경 이미지 URL:', formattedCharacter.imageUrl);


      if (mode === 'continue') {
        const { data: sessionMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .eq('character_id', id)
          .eq('session_id', sessionId)
          .order('created_at')

        if (error || !sessionMessages) {
          console.error('❌ 세션 메시지 불러오기 실패:', error)
          return
        }

        const cleanMessages: Message[] = sessionMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        }))

        setMessages(cleanMessages)
        return
      }

      const savedMessages = typeof window !== 'undefined' ? localStorage.getItem(`chat-${id}`) : null
      const initialMessages: Message[] = savedMessages
        ? JSON.parse(savedMessages)
        : formattedCharacter.situation
          ? [
              { id: crypto.randomUUID(), role: 'user', content: `{${formattedCharacter.situation}}` },
              ...(formattedCharacter.userDescription
                ? [{ id: crypto.randomUUID(), role: 'user', content: `{${formattedCharacter.userDescription}}` }]
                : []),
              ...(formattedCharacter.firstLine
                ? [{ id: crypto.randomUUID(), role: 'assistant', content: formattedCharacter.firstLine }]
                : [])
            ]
          : []

      setMessages(initialMessages)

      if (formattedCharacter.emotionImages.length > 0) {
        setDisplayedImage(formattedCharacter.emotionImages[0].imageUrl)
      }
    }

    fetchCharacter()
  }, [id, mode, userId, sessionId])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`chat-${id}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id])


  useEffect(() => {
    if (!characterInfo || !characterInfo.emotionImages || messages.length === 0) return

    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return

    const matched = characterInfo.emotionImages.find((img) =>
      last.content.includes(img.label)
    )

    if (matched) {
      setDisplayedImage(matched.imageUrl)
    } else if (!displayedImage && characterInfo.emotionImages.length > 0) {
      setDisplayedImage(characterInfo.emotionImages[0].imageUrl)
    }
  }, [characterInfo, messages])

  const deductPoint = async (amount: number) => {
    if (!userId) return false
    try {
      const res = await fetch('/api/points/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      return true
    } catch (err) {
      console.error('❌ 포인트 차감 실패:', err)
      alert('포인트가 부족하거나 오류가 발생했습니다.')
      return false
    }
  } 

  const sendToAI = async (message: string, characterInfo: Character): Promise<string[]> => {
  
    try {
      const contextMessages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        }
      ]

      const recentMessages = contextMessages.slice(-10)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMessages, characterInfo, selectedModel })
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('❌ AI 응답 오류:', errText)
        return ['응답 실패 (서버 오류 또는 포맷 문제)']
      }
      

      const result = await res.json()
      if (Array.isArray(result.reply)) return result.reply
      return (result.reply as string).split('\n').filter((line) => line.trim())
    } catch (err) {
      console.error('❌ AI 연결 오류:', err)
      return ['AI 응답 실패 (네트워크 오류)']
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !characterInfo) return

    const model = models.find((m) => m.id === selectedModel)
    const cost = model?.point ?? 0

    const success = await deductPoint(cost)
    if (!success) return
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('point-update'))
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    const replies = await sendToAI(input, characterInfo)
    const replyMessages: Message[] = replies.map((line): Message => ({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: line,
    }))

    setMessages([...newMessages, ...replyMessages])

    if (userId && characterInfo?.id) {
      const rowsToInsert = [
        {
          id: crypto.randomUUID(),
          user_id: userId,
          character_id: characterInfo.id,
          session_id: sessionId,
          role: 'user',
          content: input,
          created_at: new Date().toISOString(),
        },
        ...replyMessages.map((m) => ({
          id: m.id,
          user_id: userId,
          character_id: characterInfo.id,
          session_id: sessionId,
          role: m.role,
          content: m.content,
          created_at: new Date().toISOString(),
        })),
      ]

      await fetch('/api/save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: rowsToInsert }),
      })
    }
  }

  return (
    <div className="bg-[#0d0d0d] text-white h-screen flex flex-col overflow-hidden relative">
      {/* Background Image for Mobile */}
      {characterInfo?.imageUrl && (
        // `relative w-full h-full`을 제거하고 `absolute inset-0`만 사용.
        // `opacity`는 원하는 투명도에 맞춰 조정.
        <div className="sm:hidden absolute inset-0 z-0">
          <Image
            src={characterInfo.imageUrl}
            alt="배경 이미지"
            fill
            className="object-cover opacity-15 blur-sm" // opacity와 blur를 Image 컴포넌트에 직접 적용
            priority
          />
        </div>
      )}

      {/* Top Navigation */}
      {characterInfo && (
        <div className="flex items-center gap-3 w-full px-4 py-3 border-b border-[#333] bg-[#111] sticky top-0 z-50 flex-wrap sm:flex-nowrap"
             style={{ paddingTop: 'env(safe-area-inset-top)' }}> {/* 노치 디자인 고려 */}
          <button
            onClick={() => router.push('/')}
            className="text-white text-xl font-bold mr-2 hover:text-gray-300"
          >
            &lt;
          </button>

          {characterInfo.imageUrl && (
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={characterInfo.imageUrl}
                alt="profile"
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}

          <div className="flex-grow min-w-0">
            <div className="font-semibold text-white text-base truncate">{characterInfo.name}</div>
            <div className="text-xs text-gray-400 truncate">{characterInfo.personality}</div>
          </div>

          <div className="text-right text-xs text-gray-400 ml-auto flex flex-col items-end sm:items-stretch">
            {characterInfo.userName && <div className="truncate">👤 {characterInfo.userName}</div>}
            {characterInfo.userRole && <div className="truncate">역할: {characterInfo.userRole}</div>}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="mt-1 p-1 text-white hover:text-yellow-300 flex-shrink-0"
              title="메뉴 열기"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {/* h-full을 없애고 flex-1로 상단/하단바를 제외한 남은 공간을 차지하도록 변경 */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop: Fixed Image Area (hidden on mobile) */}
        <div className="hidden sm:flex w-1/2 max-w-[50%] h-full px-6 pt-6 pb-20 flex-col items-center justify-start overflow-y-auto">
          {characterInfo?.emotionImages && displayedImage && (
            <>
              <div className="relative w-full max-w-md aspect-square">
                <Image
                  src={displayedImage}
                  alt="감정 이미지"
                  fill
                  className="object-cover rounded-xl"
                />
              </div>

              <div className="mt-4 text-sm text-gray-300 bg-[#1e1e1e] px-4 py-2 rounded-xl max-w-sm w-full text-center">
                {
                  characterInfo.emotionImages.find(img => img.imageUrl === displayedImage)?.label
                  || '감정 정보 없음'
                }
              </div>
            </>
          )}
        </div>

        {/* Chat Area (full width on mobile) */}
        {/* z-10은 그대로 유지하고, 혹시모를 배경색 충돌을 위해 bg-transparent 추가 */}
        <div className="w-full sm:w-1/2 px-4 sm:px-6 pt-6 pb-32 space-y-4 text-[15px] leading-relaxed font-light overflow-y-auto h-full z-10 bg-transparent"> 
          {messages.map((msg) => {
            const isEditing = editTargetId === msg.id
            const isUser = msg.role === 'user'

            return (
              <div key={msg.id} className="group relative p-1">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-[#222] border border-gray-600 px-3 py-2 text-white rounded resize-none"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={async () => {
                          await fetch('/api/update-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: msg.id, content: editContent }),
                          })
                          setMessages((prev) =>
                            prev.map((m) => (m.id === msg.id ? { ...m, content: editContent } : m))
                          )
                          setEditTargetId(null)
                        }}
                        className="text-sm text-yellow-400 hover:text-yellow-300"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditTargetId(null)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`whitespace-pre-wrap ${isUser ? 'text-gray-400 italic' : 'text-white'}`}>
                      {msg.content}
                    </div>
                    {/* 수정/삭제 버튼 위치 조정 */}
                    <div className="flex justify-end gap-2 mt-1 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <span className="mr-4"></span> {/* 스페이스 효과 유지 */}
                      <button
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
                        onClick={async () => {
                          await fetch('/api/delete-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: msg.id }),
                          })
                          setMessages((prev) => prev.filter((m) => m.id !== msg.id))
                        }}
                        className="text-gray-400 hover:text-red-400"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="w-full bg-[#111] border-t border-[#333] px-4 py-3 z-50"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}> {/* 노치 디자인 고려 */}
        <div className="flex items-center gap-3 max-w-5xl mx-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowModelModal(true)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full whitespace-nowrap flex items-center justify-center sm:w-auto w-full mb-2 sm:mb-0"
          >
            {models.find(m => m.id === selectedModel)?.icon} {/* 아이콘 렌더링 */}
            <span className="ml-1">모델 선택: {models.find(m => m.id === selectedModel)?.label || '선택 없음'}</span>
          </button>

          <div className="flex flex-1 items-center bg-[#222] rounded-xl px-4 py-2 w-full">
            <Sparkles className="w-4 h-4 text-gray-400 mr-3" />
            <textarea // input 대신 textarea 사용
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="대사를 입력하세요"
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-base focus:outline-none resize-none overflow-hidden h-auto max-h-24" // 높이 자동 조절 및 최대 높이
              rows={1} // 초기에는 1줄 높이
            />
            <button
              onClick={sendMessage}
              className="ml-3 p-1 rounded hover:bg-[#333] flex-shrink-0"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.94 2.94a1.5 1.5 0 0 1 1.67-.3l12.5 5.8a1.5 1.5 0 0 1 0 2.72l-12.5 5.8A1.5 1.5 0 0 1 2 15.8V4.2a1.5 1.5 0 0 1 .94-1.26z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] p-6 rounded-2xl w-full max-w-sm space-y-6 relative">
            <h2 className="text-xl font-bold text-white text-center">AI 모델 선택</h2>
            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                    ${selectedModel === model.id ? 'bg-[#e45463]' : 'bg-[#2b2b2b]'}
                  `}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{model.icon}</span> {/* 모델 선택 모달에도 아이콘 추가 */}
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{model.label}</span>
                      <span className="text-xs text-gray-400">{model.description}</span>
                    </div>
                  </div>
                  <div className="text-sm text-white font-bold">{model.point}P</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowModelModal(false)}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-full text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed top-0 right-0 h-screen w-full max-w-[320px] bg-[#111] border-l border-gray-800 z-50 overflow-y-auto shadow-xl sm:w-[320px]">
          <ChatMenu
            userName={userName}
            userDescription={userDescription}
            onUserChange={(field, val) => {
              if (field === 'name') setUserName(val)
              else setUserDescription(val)
            }}
            lore={lore}
            onLoreChange={setLore}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      )}
    </div>
  )
}