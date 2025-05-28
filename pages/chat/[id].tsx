'use client'
import ChatMenu from '@/components/ChatMenu'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { Pencil, Trash2, PanelRightOpen, Sparkles } from 'lucide-react'

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
  { id: 'gpt-3.5', label: 'GPT-3.5 Turbo', description: '빠른 속도의 AI 모델', point: 10 },
  { id: 'gpt-4o', label: 'GPT-4o', description: '고성능 몰입형 AI', point: 20 },
  { id: 'claude-haiku', label: 'Claude 3.7 Haiku', description: '가볍고 빠른 답변용 AI', point: 10 },
  { id: 'claude-sonnet', label: 'Claude 3.7 Sonnet', description: '고퀄리티 감정 몰입 대화 AI', point: 20 },
  { id: 'gemini-flash', label: 'Gemini 2.5 Flash', description: '빠르고 경제적인 구글 AI', point: 10 },
  { id: 'gemini-pro', label: 'Gemini 2.5 Pro', description: '고급 지능과 묘사를 가진 구글 AI', point: 20 },
]

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { id, mode } = router.query

  const [sessionId, setSessionId] = useState<string>('') // ✅ 초기엔 비워둠
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

// ✅ 2. sessionId 결정 (userId, id, mode가 준비된 후 실행)
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

    // 새로 대화 시작인 경우
    setSessionId(crypto.randomUUID())
  }

  resolveSessionId()
}, [id, mode, userId])


// ✅ 3. 캐릭터 & 메시지 불러오기 (sessionId까지 준비된 후 실행)
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

    // 👉 이어서 대화: 해당 세션의 메시지만 불러오기
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

    // 👉 새 대화 시작: localStorage or 초기 상황 사용
    const savedMessages = localStorage.getItem(`chat-${id}`)
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

    // 기본 감정 이미지 표시
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
          id: crypto.randomUUID(), // ← 추가
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

  // 🔥 포인트 차감 로직 추가
  const model = models.find((m) => m.id === selectedModel)
  const cost = model?.point ?? 0

  const success = await deductPoint(cost)
  if (!success) return  // 차감 실패 시 메시지 전송 중단
  window.dispatchEvent(new Event('point-update'))
  
  // 💬 메시지 생성 및 전송
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

  // 저장 로직은 그대로 유지
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
    <div className="bg-[#0d0d0d] text-white h-screen flex flex-col overflow-hidden">  
<button
  onClick={() => router.push('/')}
  className="absolute top-4 left-4 flex items-center text-white text-base hover:text-gray-300 z-50"
>
</button>
 
{characterInfo && (
  <div className="flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)] sm:pt-3 border-b border-[#333] bg-[#111] sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push('/')}
        className="text-white text-xl font-bold mr-2 hover:text-gray-300"
      >
        &lt;
      </button>
      {characterInfo.imageUrl && (
        <div className="relative w-10 h-10">
          <Image
            src={characterInfo.imageUrl}
            alt="profile"
            fill
            className="rounded-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-white text-sm font-semibold truncate">{characterInfo.name}</span>
        <span className="text-xs text-gray-400 truncate">{characterInfo.personality}</span>
      </div>
    </div>

    <div className="hidden sm:flex flex-col text-xs text-gray-400 items-end">
      {characterInfo.userName && <div>👤 {characterInfo.userName}</div>}
      {characterInfo.userRole && <div>역할: {characterInfo.userRole}</div>}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="mt-1 p-1 text-white hover:text-yellow-300"
        title="메뉴 열기"
      >
        <PanelRightOpen className="w-5 h-5" />
      </button>
    </div>
  </div>
)}
    


<div className="flex h-screen overflow-hidden"> 
  {/* 좌측: 고정 이미지 영역 */}
  <div className="w-full sm:w-1/2 sm:max-w-[50%] px-4 sm:px-6 pt-[4.5rem] pb-32 space-y-4 text-[15px] font-light leading-relaxed overflow-y-auto h-full relative z-10">
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

        {characterInfo?.emotionImages && displayedImage && (
          <div className="absolute inset-0 -z-10 sm:hidden">
            <Image
              src={displayedImage}
              alt="감정 배경"
              fill
              className="object-cover opacity-20"
            />
          </div>
        )}

        <div className="mt-4 text-sm text-gray-300 bg-[#1e1e1e] px-4 py-2 rounded-xl max-w-sm w-full text-center">
          {
            characterInfo.emotionImages.find(img => img.imageUrl === displayedImage)?.label
            || '감정 정보 없음'
          }
        </div>
      </>
    )}
  </div>

      {characterInfo?.emotionImages && displayedImage && (
        <div className="absolute inset-0 -z-10 sm:hidden">
          <Image
            src={displayedImage}
            alt="감정 이미지"
            fill
            className="object-cover opacity-20"
          />
        </div>
      )}


  {/* 우측: 채팅 스크롤 영역 */}
<div className="w-full sm:w-1/2 sm:max-w-[50%] px-4 sm:px-6 pt-[4.5rem] pb-32 space-y-4 text-[15px] leading-relaxed font-light overflow-y-auto h-full relative z-10">
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
          <div className="absolute top-1 right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition">
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

  <div
    className="sticky bottom-0 bg-[#111]/90 border-t border-[#333] px-4 py-3 z-50 backdrop-blur-sm"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
  <div className="flex items-center gap-3 max-w-5xl mx-auto">
    {/* 왼쪽: 모델 선택 */}
    <button
      onClick={() => setShowModelModal(true)}
      className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full whitespace-nowrap"
    >
      모델 선택: {models.find(m => m.id === selectedModel)?.label || '선택 없음'}
    </button>


    {/* 가운데 + 오른쪽: 채팅 입력 UI */}
    <div className="flex flex-1 items-center bg-[#222] rounded-xl px-4 py-2">
      <Sparkles className="w-4 h-4 text-gray-400 mr-3" />
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="대사를 입력하세요"
        className="flex-1 bg-transparent text-white placeholder-gray-400 text-base focus:outline-none"
      />
      <button
        onClick={sendMessage}
        className="ml-3 p-1 rounded hover:bg-[#333]"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1b1b1b] p-6 rounded-2xl w-96 space-y-6 relative">
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
                  <div className="flex flex-col">
                    <span className="text-white font-semibold">{model.label}</span>
                    <span className="text-xs text-gray-400">{model.description}</span>
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

    {menuOpen && (  // ← 이걸 여기 추가
      <div className="fixed top-0 right-0 h-screen w-[320px] bg-[#111] border-l border-gray-800 z-50 overflow-y-auto shadow-xl">
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
