'use client'
import ChatMenu from '@/components/ChatMenu'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { getLocalCharacter } from '@/lib/localStorage'
import {
  getApiModels,
  getApiProviders,
  getChatParameters,
  setChatParameters,
  getPromptBundles,
  getModuleBundles,
  type ProviderId,
} from '@/lib/appSettings'
import Image from 'next/image'
import {
  Pencil,
  Trash2,
  PanelRightOpen,
  Sparkles,
  Smile,
  Bot,
  Zap,
  Feather,
  Gem,
} from 'lucide-react'

type Role = 'user' | 'assistant'

type Message = {
  id: string
  role: Role
  content: string
  created_at?: string
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

type ModelItem = {
  id: string
  provider: ProviderId
  label: string
  description?: string
  icon?: React.ReactNode
}

function providerIcon(provider: ProviderId) {
  if (provider === 'openai') return <Sparkles size={16} />
  if (provider === 'openrouter') return <Zap size={16} />
  if (provider === 'anthropic') return <Feather size={16} />
  return <Gem size={16} />
}

function providerLabel(provider: ProviderId) {
  if (provider === 'openai') return 'OpenAI'
  if (provider === 'openrouter') return 'OpenRouter'
  if (provider === 'anthropic') return 'Claude'
  return 'Gemini'
}

export default function ChatPage() {
  const router = useRouter()
  const { id, mode } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [characterInfo, setCharacterInfo] = useState<Character | null>(null)
  const [displayedImage, setDisplayedImage] = useState<string | null>(null)
  const [models, setModels] = useState<ModelItem[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('openai')
  const [showModelModal, setShowModelModal] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userDescription, setUserDescription] = useState('')
  const [lore, setLore] = useState('')

  const [temperature, setTemperature] = useState(0.7)
  const [maxOutputChars, setMaxOutputChars] = useState(4000)
  const [maxInputChars, setMaxInputChars] = useState(4000)

  useEffect(() => {
    const params = getChatParameters()
    setTemperature(params.temperature)
    setMaxInputChars(params.maxInputChars)
    setMaxOutputChars(params.maxOutputChars)

    const modelsMap = getApiModels()
    const list: ModelItem[] = []
    ;(Object.keys(modelsMap) as ProviderId[]).forEach((pid) => {
      ;(modelsMap[pid] ?? []).forEach((mid) => {
        list.push({
          id: mid,
          provider: pid,
          label: `${providerLabel(pid)} · ${mid}`,
          icon: providerIcon(pid),
        })
      })
    })
    setModels(list)
    if (list[0]) {
      setSelectedModel(list[0].id)
      setSelectedProvider(list[0].provider)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  useEffect(() => {
    if (typeof id !== 'string') return

    const localChar = getLocalCharacter(id)
    if (!localChar) {
      console.error('캐릭터를 찾을 수 없습니다:', id)
      return
    }

    const emotionImages: EmotionImage[] =
      localChar.emotionImages ?? localChar.emotion_images ?? []
    const imageUrl =
      localChar.imageUrl ?? localChar.image_url ?? emotionImages[0]?.imageUrl ?? undefined

    const formattedCharacter: Character & { worldSetting?: string; supporting?: { name: string; description: string }[] } = {
      id: localChar.id,
      name: localChar.name,
      personality: localChar.personality ?? '',
      description: localChar.description ?? '',
      situation: localChar.situation ?? '',
      firstLine: localChar.firstLine,
      imageUrl: imageUrl || undefined,
      userName: localChar.userName ?? localChar.user_name,
      userRole: localChar.userRole ?? localChar.user_role,
      userDescription: localChar.userDescription ?? localChar.user_description,
      emotionImages,
      worldSetting: localChar.worldSetting ?? localChar.world_setting,
      supporting: localChar.supporting ?? [],
    }
    setCharacterInfo(formattedCharacter)

    if (emotionImages.length > 0) {
      setDisplayedImage(emotionImages[0].imageUrl)
    } else if (imageUrl) {
      setDisplayedImage(imageUrl)
    }

    const storageKey = `chat-${id}`
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    let initialMessages: Message[]

    if (mode === 'continue' && saved) {
      try {
        initialMessages = JSON.parse(saved)
      } catch {
        initialMessages = []
      }
    } else if (saved && mode !== 'new') {
      try {
        initialMessages = JSON.parse(saved)
      } catch {
        initialMessages = []
      }
    } else {
      initialMessages = formattedCharacter.situation
        ? [
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: `{${formattedCharacter.situation}}`,
            },
            ...(formattedCharacter.userDescription
              ? [
                  {
                    id: crypto.randomUUID(),
                    role: 'user' as const,
                    content: `{${formattedCharacter.userDescription}}`,
                  },
                ]
              : []),
            ...(formattedCharacter.firstLine
              ? [
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant' as const,
                    content: formattedCharacter.firstLine,
                  },
                ]
              : []),
          ]
        : []
    }
    setMessages(initialMessages)
  }, [id, mode])

  useEffect(() => {
    if (typeof window !== 'undefined' && id && typeof id === 'string') {
      localStorage.setItem(`chat-${id}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id])

  useEffect(() => {
    if (!characterInfo?.emotionImages?.length || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return
    const matched = characterInfo.emotionImages.find((img) =>
      last.content.includes(img.label)
    )
    if (matched) setDisplayedImage(matched.imageUrl)
    else if (!displayedImage && characterInfo.emotionImages.length > 0)
      setDisplayedImage(characterInfo.emotionImages[0].imageUrl)
  }, [characterInfo, messages])

  const sendToAI = async (
    message: string,
    characterInfo: Character
  ): Promise<string[]> => {
    try {
      if (!selectedModel) return ['모델이 설정되지 않았습니다. 마이페이지에서 Models를 추가해 주세요.']
      const providers = getApiProviders()
      const key = providers?.[selectedProvider]?.apiKey ?? ''
      if (!key) return ['API 키가 비어있습니다. 마이페이지에서 API Key를 입력해 주세요.']
      const promptBundles = getPromptBundles().filter((b) => b.enabled)
      const moduleBundles = getModuleBundles().filter((b) => b.enabled)

      const prompts = {
        main: promptBundles
          .map((b) => (b.mainPrompt?.trim() ? `## ${b.name || b.id}\n${b.mainPrompt.trim()}` : ''))
          .filter(Boolean)
          .join('\n\n')
          .trim(),
        character: promptBundles
          .map((b) =>
            b.characterPrompt?.trim() ? `## ${b.name || b.id}\n${b.characterPrompt.trim()}` : ''
          )
          .filter(Boolean)
          .join('\n\n')
          .trim(),
        jailbreak: promptBundles
          .map((b) =>
            b.jailbreakPrompt?.trim() ? `## ${b.name || b.id}\n${b.jailbreakPrompt.trim()}` : ''
          )
          .filter(Boolean)
          .join('\n\n')
          .trim(),
      }

      const systemPromptAppend = promptBundles
        .map((b) =>
          b.systemPromptAppend?.trim() ? `## ${b.name || b.id}\n${b.systemPromptAppend.trim()}` : ''
        )
        .filter(Boolean)
        .join('\n\n')
        .trim()

      const maxTokens = Math.max(256, Math.min(8192, Math.floor((maxOutputChars || 4000) / 4)))
      const trimmedMessage =
        typeof message === 'string' && message.length > (maxInputChars || 4000)
          ? message.slice(0, maxInputChars || 4000)
          : message

      const contextMessages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: trimmedMessage,
          created_at: new Date().toISOString(),
        },
      ]
      const recentMessages = contextMessages.slice(-10)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          characterInfo,
          provider: selectedProvider,
          apiKey: key,
          selectedModel,
          temperature,
          max_tokens: maxTokens,
          systemPromptAppend,
          prompts,
          modules: moduleBundles,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('AI 응답 오류:', errText)
        return ['응답 실패 (서버 오류 또는 API 키 확인)']
      }

      const result = await res.json()
      const lines = Array.isArray(result.reply)
        ? (result.reply as string[])
        : String(result.reply ?? '')
            .split('\n')
            .filter((line) => line.trim())

      const joined = lines.join('\n')
      const clipped =
        typeof joined === 'string' && joined.length > (maxOutputChars || 4000)
          ? joined.slice(0, maxOutputChars || 4000)
          : joined
      return clipped.split('\n').filter((line) => line.trim())
    } catch (err) {
      console.error('AI 연결 오류:', err)
      return ['AI 응답 실패 (네트워크 오류)']
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !characterInfo) return

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
  }

  const handleSaveEdit = () => {
    if (editTargetId === null) return
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editTargetId ? { ...m, content: editContent } : m
      )
    )
    setEditTargetId(null)
  }

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
  }

  const isDataUrl = (s: string) => typeof s === 'string' && s.startsWith('data:')

  return (
    <div className="bg-[#0d0d0d] text-white h-screen flex flex-col overflow-hidden relative">
      {displayedImage && (
        <div className="sm:hidden absolute inset-0 z-0">
          <Image
            src={displayedImage}
            alt="배경"
            fill
            className="object-cover opacity-15"
            priority
            unoptimized={isDataUrl(displayedImage)}
          />
        </div>
      )}

      {characterInfo && (
        <div className="flex items-center gap-3 w-full px-4 py-3 border-b border-[#333] bg-[#111] sticky top-0 z-50 flex-wrap sm:flex-nowrap">
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
                unoptimized={isDataUrl(characterInfo.imageUrl)}
              />
            </div>
          )}
          <div className="flex-grow min-w-0">
            <div className="font-semibold text-white text-base truncate">
              {characterInfo.name}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {characterInfo.personality}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400 ml-auto flex flex-col items-end sm:items-stretch">
            {characterInfo.userName && (
              <div className="truncate">👤 {characterInfo.userName}</div>
            )}
            {characterInfo.userRole && (
              <div className="truncate">역할: {characterInfo.userRole}</div>
            )}
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

      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden sm:flex w-1/2 max-w-[50%] h-full px-6 pt-6 pb-20 flex-col items-center justify-start overflow-y-auto">
          {characterInfo?.emotionImages?.length && displayedImage && (
            <>
              <div className="relative w-full max-w-md aspect-square">
                <Image
                  src={displayedImage}
                  alt="감정 이미지"
                  fill
                  className="object-cover rounded-xl"
                  unoptimized={isDataUrl(displayedImage)}
                />
              </div>
              <div className="mt-4 text-sm text-gray-300 bg-[#1e1e1e] px-4 py-2 rounded-xl max-w-sm w-full text-center">
                {characterInfo.emotionImages.find(
                  (img) => img.imageUrl === displayedImage
                )?.label || '감정 정보 없음'}
              </div>
            </>
          )}
        </div>

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
                        onClick={handleSaveEdit}
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
                    <div
                      className={`whitespace-pre-wrap ${isUser ? 'text-gray-400 italic' : 'text-white'}`}
                    >
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
                        onClick={() => handleDeleteMessage(msg.id)}
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

      <div className="w-full bg-[#111] border-t border-[#333] px-4 py-3 z-50">
        <div className="flex items-center gap-3 max-w-5xl mx-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowModelModal(true)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full whitespace-nowrap flex items-center justify-center sm:w-auto w-full mb-2 sm:mb-0"
          >
            {models.find((m) => m.id === selectedModel)?.icon}
            <span className="ml-1">
              모델: {models.find((m) => m.id === selectedModel)?.label ?? '선택'}
            </span>
          </button>
          <div className="flex flex-1 items-center bg-[#222] rounded-xl px-4 py-2 w-full">
            <Sparkles className="w-4 h-4 text-gray-400 mr-3" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="대사를 입력하세요"
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-base focus:outline-none resize-none overflow-hidden h-auto max-h-24"
              rows={1}
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
          <div className="bg-[#1b1b1b] p-6 rounded-2xl w-full max-w-sm space-y-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white text-center">
              AI 모델 · 옵션
            </h2>
            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id)
                    setSelectedProvider(model.provider)
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    selectedModel === model.id ? 'bg-[#e45463]' : 'bg-[#2b2b2b]'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{model.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{model.label}</span>
                      <span className="text-xs text-gray-400">
                        {model.description}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-gray-700 pt-4">
              <label className="block text-sm text-gray-300">
                Temperature (0~2)
              </label>
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!Number.isNaN(v)) {
                    const next = Math.max(0, Math.min(2, v))
                    setTemperature(next)
                    setChatParameters({ temperature: next, maxInputChars, maxOutputChars })
                  }
                }}
                className="w-full bg-[#222] text-white px-3 py-2 rounded"
              />
              <label className="block text-sm text-gray-300">
                Max input chars
              </label>
              <input
                type="number"
                min={100}
                max={200000}
                value={maxInputChars}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (Number.isNaN(v)) return
                  const safe = Math.max(100, Math.min(200000, v))
                  setMaxInputChars(safe)
                  setChatParameters({ temperature, maxInputChars: safe, maxOutputChars })
                }}
                className="w-full bg-[#222] text-white px-3 py-2 rounded"
              />
              <label className="block text-sm text-gray-300">
                Max output chars
              </label>
              <input
                type="number"
                min={100}
                max={200000}
                value={maxOutputChars}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (Number.isNaN(v)) return
                  const safe = Math.max(100, Math.min(200000, v))
                  setMaxOutputChars(safe)
                  setChatParameters({ temperature, maxInputChars, maxOutputChars: safe })
                }}
                className="w-full bg-[#222] text-white px-3 py-2 rounded"
              />
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
