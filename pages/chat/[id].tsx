'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

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
  { id: 'gpt-3.5', label: 'GPT-3.5 Turbo', description: '빠른 속도의 AI 모델', point: 20 },
  { id: 'gpt-4o', label: 'GPT-4o', description: '고성능 몰입형 AI', point: 40 },
  { id: 'claude-haiku', label: 'Claude 3.5 Haiku', description: '가볍고 빠른 답변용 AI', point: 20 },
  { id: 'claude-sonnet', label: 'Claude 3.5 Sonnet', description: '고퀄리티 감정 몰입 대화 AI', point: 40 },
  { id: 'gemini-flash', label: 'Gemini 2.5 Flash', description: '빠르고 경제적인 구글 AI', point: 20 },
  { id: 'gemini-pro', label: 'Gemini 2.5 Pro', description: '고급 지능과 묘사를 가진 구글 AI', point: 40 },
]

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { id, mode } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [characterInfo, setCharacterInfo] = useState<Character | null>(null)
  const [displayedImage, setDisplayedImage] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [showModelModal, setShowModelModal] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null) 

useEffect(() => {
  if (!userId || !id) return

  const fetchCharacter = async () => {
    if (!id || typeof id !== 'string') return

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

if (mode === 'new' && id) {
  localStorage.removeItem(`chat-${id}`)
}

if (formattedCharacter.emotionImages.length > 0) {
  setDisplayedImage(formattedCharacter.emotionImages[0].imageUrl)
}

if (mode === 'continue' && userId && data.id) {
 const res = await fetch('/api/load-messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    characterId: data.id,
  }),
})

const result = await res.json()
const cleanMessages: Message[] = result.messages.map((m: {
  id: string
  role: Role
  content: string
  created_at: string
}) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  created_at: m.created_at,
}))

// 상황 설명이 빠져있다면 첫 줄에 삽입
if (
  formattedCharacter.situation &&
  !cleanMessages.some((m) => m.content?.includes(formattedCharacter.situation))
) {
  cleanMessages.unshift({
    id: crypto.randomUUID(),
    role: 'user',
    content: `{${formattedCharacter.situation}}`,
    created_at: new Date().toISOString(),
  })
}

setMessages(cleanMessages)
  return
}

    // 👉 새로 시작인 경우: localStorage 또는 초기 상황 사용
    const savedMessages = localStorage.getItem(`chat-${id}`)
    const initialMessages: Message[] = savedMessages
      ? JSON.parse(savedMessages)
      : formattedCharacter.situation
        ? [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: `{${formattedCharacter.situation}}`,
        },
        ...(formattedCharacter.userDescription
              ? [{
              id: crypto.randomUUID(),
              role: 'user',
              content: `{${formattedCharacter.userDescription}}`,
              }]
              : []),
            ...(formattedCharacter.firstLine
            ? [{ id: crypto.randomUUID(),
                  role: 'assistant',
                  content: formattedCharacter.firstLine,
                 }]
               : []),
          ]
        : []

    if (
      formattedCharacter.situation &&
      !initialMessages.some((m) => m.content.includes(formattedCharacter.situation))
    ) {
      initialMessages.unshift({
      id: crypto.randomUUID(),
      role: 'user',
      content: `{${formattedCharacter.situation}}`
      })
    }

    setMessages(initialMessages)

    // 기본 감정 이미지 표시
    if (formattedCharacter.emotionImages.length > 0) {
      setDisplayedImage(formattedCharacter.emotionImages[0].imageUrl)
    }
  }

  fetchCharacter()
}, [id, mode, userId])

  useEffect(() => {
    
  const getSession = async () => {
    const { data } = await supabase.auth.getSession()
    setUserId(data.session?.user?.id ?? null)
  }
  getSession()
}, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`chat-${id}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return
    const emotion = characterInfo?.emotionImages?.find((img) =>
    last.content.includes(img.label)
    )?.label
    const matched = characterInfo?.emotionImages?.find((img: EmotionImage) => img.label === emotion)
    if (matched) setDisplayedImage(matched.imageUrl)
  }, [messages, characterInfo])

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
        role: 'user',
        content: input,
        created_at: new Date().toISOString(),
      },
      ...replyMessages.map((m) => ({
        id: m.id,
        user_id: userId,
        character_id: characterInfo.id,
        role: m.role,
        content: m.content,
        created_at: new Date().toISOString(),
      })),
    ]

await fetch('/api/save-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: rowsToInsert,
    mode, // ← 새로 대화 / 이어서 대화 모드 전달
    characterId: characterInfo.id, // ← 어떤 캐릭터인지 전달
  }),
})
  }
}


  return (
    <div className="bg-[#0d0d0d] text-white min-h-screen flex flex-col">  
<button
  onClick={() => router.push('/')}
  className="absolute top-4 left-4 flex items-center text-white text-base hover:text-gray-300 z-50"
>
</button>
 
{characterInfo && (
  <div className="flex items-start justify-between px-4 py-3 border-b border-[#333] bg-[#111] sticky top-0 z-50">
    <div className="flex items-center gap-3">
      {/* ← 홈으로 텍스트 버튼 */}
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
          <div>
            <div className="font-semibold text-white">{characterInfo.name}</div>
            <div className="text-xs text-gray-400">{characterInfo.personality}</div>
          </div>
        </div>

        {characterInfo.userName && (
          <div className="text-right text-xs text-gray-400">
            <div>👤 {characterInfo.userName}</div>
            {characterInfo.userRole && <div>역할: {characterInfo.userRole}</div>}
          </div>
        )}
      </div>
    )}

<div className="flex h-[calc(100vh-56px)]">
  {/* 좌측: 고정 이미지 영역 */}
  <div className="w-1/2 max-w-[50%] bg-[#0d0d0d] flex flex-col items-center justify-start px-6 pt-[4.5rem] pb-20">
    {characterInfo?.emotionImages && displayedImage && (
      <>
        <div className="relative w-full h-full">
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

  {/* 우측: 채팅 스크롤 영역 */}
  <div className="w-1/2 max-w-[50%] overflow-y-auto px-6 pt-[4.5rem] pb-32 space-y-4 text-[15px] leading-relaxed font-light">
            {messages.map((msg) => {
  const isUser = msg.role === 'user'
  const isEditing = editTargetId === msg.id
  const showMenu = menuTargetId === msg.id

  if (isUser) {
    const match = msg.content.match(/^(.*?)(\s*\{(.+?)\})?$/)
    const text = match?.[1]?.trim() ?? msg.content
    const emotion = match?.[3]?.trim()

    return (
      <div key={msg.id} className="relative group whitespace-pre-wrap text-blue-300 italic font-semibold">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-[#222] border border-gray-600 px-2 py-1 text-white rounded w-full"
            />
            <button
              onClick={async () => {
                await fetch('/api/update-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: msg.id, content: editContent }),
                })
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msg.id ? { ...m, content: editContent } : m
                  )
                )
                setEditTargetId(null)
              }}
              className="text-sm text-green-400"
            >
              저장
            </button>
          </div>
        ) : (
          <>
            <div>{text}</div>
            {emotion && <div className="text-gray-400 text-sm">{emotion}</div>}

            <button
              onClick={() => setMenuTargetId(showMenu ? null : msg.id)}
              className="absolute top-1 right-1 text-gray-400 hover:text-white text-xl"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-5 top-7 bg-[#2a2a2a] border border-[#444] rounded shadow z-50">
                <button
                  onClick={() => {
                    setEditTargetId(msg.id)
                    setEditContent(msg.content)
                    setMenuTargetId(null)
                  }}
                  className="block px-4 py-2 text-sm text-white hover:bg-[#444]"
                >
                  수정하기
                </button>
                <button
                  onClick={async () => {
                    await fetch('/api/delete-message', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: msg.id }),
                    })
                    setMessages((prev) => prev.filter((m) => m.id !== msg.id))
                    setMenuTargetId(null)
                  }}
                  className="block px-4 py-2 text-sm text-red-400 hover:bg-[#444]"
                >
                  삭제하기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // assistant 메시지
    const lines = (msg.content ?? '')
      .replace(/\{(.*?)\}/g, '$1')
      .split(/(?<="[^"]*")/g)
      .map((line) => line.trim())
      .filter(Boolean)

  return (
    <div key={msg.id} className="whitespace-pre-wrap text-white">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
})}

    <div ref={bottomRef} />
  </div>
</div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#333] p-2 z-50">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => setShowModelModal(true)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full"
          >
            모델 선택: {models.find(m => m.id === selectedModel)?.label || '선택 없음'}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-3 border border-[#444] rounded-full bg-[#222] text-white text-sm placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="shrink-0 bg-[#e45463] hover:bg-[#e97585] text-white px-4 py-2 rounded-full text-sm"
          >
            전송
          </button>
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
    </div>
  )
}
