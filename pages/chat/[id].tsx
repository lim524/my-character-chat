'use client'
import ChatMenu from '@/components/ChatMenu'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { getLocalCharacter, saveGameSlot, loadGameSlot, getSaveSlots, deleteGameSlot, saveChatSession, type SaveSlot } from '@/lib/localStorage'
import MessageParser from '@/components/MessageParser'
import ExtraInterfaceOverlay from '@/components/ExtraInterfaceOverlay'
import type { InterfaceConfig } from '@/lib/interfaceConfig'
import {
  getApiModels,
  getApiProviders,
  getChatParameters,
  getLastChatModelSelection,
  setChatParameters,
  setLastChatModelSelection,
  getPromptBundles,
  getModuleBundles,
  type ProviderId,
} from '@/lib/appSettings'
import { kvGet, kvSet } from '@/lib/idbKV'
import { stripDataUrlsFromJsonValue } from '@/lib/stripDataUrlsForApi'
import {
  effectiveCharacterLiftPx,
  parseMergedCharacterLayoutFromExtraEntries,
} from '@/lib/interfaceRuntime'
import {
  paginateAssistantContent,
  VN_DEFAULT_CHARS_PER_PAGE,
} from '@/lib/vnDialogPagination'
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
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
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
  interfaceConfig?: InterfaceConfig
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
  const [activeCharacterSprites, setActiveCharacterSprites] = useState<string[]>([])
  const [parsedStats, setParsedStats] = useState<Record<string, number>>({})
  const [models, setModels] = useState<ModelItem[]>([])
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false)
  const [saveLoadTab, setSaveLoadTab] = useState<'save'|'load'>('save')
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('openai')
  const [showModelModal, setShowModelModal] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [assistantDialogPageIndex, setAssistantDialogPageIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const assistantPageIndexRef = useRef(0)
  assistantPageIndexRef.current = assistantDialogPageIndex

  const [menuOpen, setMenuOpen] = useState(false)

  const [temperature, setTemperature] = useState(0.7)
  const [maxOutputChars, setMaxOutputChars] = useState(4000)
  const [maxInputChars, setMaxInputChars] = useState(4000)

  const selectedModelRef = useRef(selectedModel)
  const selectedProviderRef = useRef(selectedProvider)
  useEffect(() => {
    selectedModelRef.current = selectedModel
    selectedProviderRef.current = selectedProvider
  }, [selectedModel, selectedProvider])

  useEffect(() => {
    let cancelled = false
    const refreshModelsAndParams = async () => {
      try {
        const params = await getChatParameters()
        if (cancelled) return
        setTemperature(params.temperature)
        setMaxInputChars(params.maxInputChars)
        setMaxOutputChars(params.maxOutputChars)

        const modelsMap = await getApiModels()
        if (cancelled) return
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

        const curId = selectedModelRef.current
        const curProv = selectedProviderRef.current
        let chosen: ModelItem | undefined = curId
          ? list.find((m) => m.id === curId && m.provider === curProv)
          : undefined

        if (!chosen) {
          const saved = await getLastChatModelSelection()
          if (cancelled) return
          if (saved) {
            chosen = list.find((m) => m.id === saved.modelId && m.provider === saved.provider)
          }
        }

        if (!chosen && list[0]) chosen = list[0]

        if (chosen) {
          setSelectedModel(chosen.id)
          setSelectedProvider(chosen.provider)
        } else {
          setSelectedModel('')
        }
      } catch (e) {
        console.error('[chat] 모델/파라미터 로드 실패', e)
      }
    }

    void refreshModelsAndParams()
    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshModelsAndParams()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
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

    void (async () => {
      const localChar = await getLocalCharacter(id)
      if (!localChar) {
        console.error('캐릭터를 찾을 수 없습니다:', id)
        return
      }

      const emotionImages: EmotionImage[] =
        localChar.emotionImages ?? localChar.emotion_images ?? []
      const imageUrl =
        localChar.imageUrl ?? localChar.image_url ?? emotionImages[0]?.imageUrl ?? undefined

      const formattedCharacter: Character & {
        worldSetting?: string
        supporting?: { name: string; description: string }[]
      } = {
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
        interfaceConfig: localChar.interfaceConfig,
        worldSetting: localChar.worldSetting ?? localChar.world_setting,
        supporting: localChar.supporting ?? [],
      }
      setCharacterInfo(formattedCharacter)

      const assets = localChar.interfaceConfig?.assets ?? []
      const initBgId = localChar.details?.initialBackground as string | undefined
      const initCharId = localChar.details?.initialCharacter as string | undefined
      if (initBgId) {
        const asset = assets.find((a: any) => a.id === initBgId)
        if (asset?.url) setDisplayedImage(asset.url)
      }
      if (initCharId) {
        const asset = assets.find((a: any) => a.id === initCharId)
        if (asset?.url) setActiveCharacterSprites([asset.url])
        else setActiveCharacterSprites([])
      } else {
        setActiveCharacterSprites([])
      }
      const storageKey = `chat-${id}`
      const saved = typeof window !== 'undefined' ? await kvGet(storageKey) : null
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
        const initBg = localChar.details?.initialBackground as string | undefined
        const initChar = localChar.details?.initialCharacter as string | undefined
        const initTags = [
          initBg ? `<img=${initBg}:background>` : '',
          initChar ? `<img=${initChar}>` : '',
        ].filter(Boolean).join(' ')

        const firstLineText = [initTags, formattedCharacter.firstLine].filter(Boolean).join('\n')

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
              ...(firstLineText
                ? [
                    {
                      id: crypto.randomUUID(),
                      role: 'assistant' as const,
                      content: firstLineText,
                    },
                  ]
                : []),
            ]
          : []
      }
      setMessages(initialMessages)
    })()
  }, [id, mode])

  useEffect(() => {
    if (typeof window !== 'undefined' && id && typeof id === 'string') {
      void kvSet(`chat-${id}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id])

  const openSaveLoadMenu = (tab: 'save' | 'load') => {
    if (typeof id !== 'string') return
    void (async () => {
      setSaveSlots(await getSaveSlots(id))
      setSaveLoadTab(tab)
      setIsSaveLoadOpen(true)
    })()
  }

  const handleSaveSlot = (slotIndex: number) => {
    if (typeof id !== 'string') return
    if (messages.length === 0) {
      alert('저장할 대화 내역이 없습니다.')
      return
    }
    const lastMsg = messages[messages.length - 1]
    let previewText =
      lastMsg.role === 'assistant'
        ? lastMsg.content.replace(/<img=[^>]+>/g, '').trim().slice(0, 40) + '...'
        : lastMsg.content.slice(0, 40) + '...'

    if (previewText.length < 2) previewText = '대화 시작'

    void (async () => {
      await saveGameSlot(id, slotIndex, messages, previewText)
      setSaveSlots(await getSaveSlots(id))
      alert(`${slotIndex}번 슬롯에 저장되었습니다.`)
    })()
  }

  const handleLoadSlot = (slotIndex: number) => {
    if (typeof id !== 'string') return
    const confirmLoad = window.confirm('해당 지점을 불러오시겠습니까? 현재 진행 상황은 사라집니다.')
    if (!confirmLoad) return

    void (async () => {
      const slotData = await loadGameSlot(id, slotIndex)
      if (slotData && slotData.messages) {
        setMessages(slotData.messages)
        setIsSaveLoadOpen(false)
      } else {
        alert('세이브 파일을 불러올 수 없습니다.')
      }
    })()
  }

  const handleDeleteSlot = (e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation()
    if (typeof id !== 'string') return
    const confirmDelete = window.confirm(`${slotIndex}번 슬롯의 저장 데이터를 정말 삭제하시겠습니까?`)
    if (!confirmDelete) return

    void (async () => {
      await deleteGameSlot(id, slotIndex)
      setSaveSlots(await getSaveSlots(id))
    })()
  }

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
      const providers = await getApiProviders()
      const key = providers?.[selectedProvider]?.apiKey ?? ''
      if (!key) return ['API 키가 비어있습니다. 마이페이지에서 API Key를 입력해 주세요.']
      const promptBundles = (await getPromptBundles()).filter((b) => b.enabled)
      const moduleBundles = (await getModuleBundles()).filter((b) => b.enabled)

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
      const chatPayload = stripDataUrlsFromJsonValue({
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
      }) as Record<string, unknown>

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload),
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

  const regexScripts = characterInfo?.interfaceConfig?.regexScripts

  const characterLayout = useMemo(
    () => parseMergedCharacterLayoutFromExtraEntries(characterInfo?.interfaceConfig?.extraInterfaceEntries),
    [characterInfo?.interfaceConfig?.extraInterfaceEntries]
  )

  const effectiveLiftPx = useMemo(
    () => effectiveCharacterLiftPx(characterInfo?.interfaceConfig?.characterSpriteLiftPx, characterLayout),
    [characterInfo?.interfaceConfig?.characterSpriteLiftPx, characterLayout]
  )

  const nSprites = activeCharacterSprites.length
  const multi = characterLayout.multi
  const sideBySide = !!(multi?.sideBySide && nSprites > 1)
  const gapPx =
    typeof multi?.gapPx === 'number' && Number.isFinite(multi.gapPx) ? Math.max(0, multi.gapPx) : 12
  const spriteScale =
    typeof characterLayout.scale === 'number' && Number.isFinite(characterLayout.scale)
      ? Math.min(2, Math.max(0.35, characterLayout.scale))
      : 1
  const spriteHeightVh =
    typeof characterLayout.heightVh === 'number' && Number.isFinite(characterLayout.heightVh)
      ? Math.min(85, Math.max(12, characterLayout.heightVh))
      : null
  const spriteMaxWidthPx =
    typeof characterLayout.maxWidthPx === 'number' && Number.isFinite(characterLayout.maxWidthPx)
      ? Math.max(64, characterLayout.maxWidthPx)
      : null
  const maxPerRow =
    typeof multi?.maxPerRow === 'number' && multi.maxPerRow > 0 ? Math.floor(multi.maxPerRow) : null
  const gridColumnCount =
    sideBySide && maxPerRow ? maxPerRow : sideBySide ? nSprites : 1
  const justifyContent: React.CSSProperties['justifyContent'] =
    multi?.justify === 'start'
      ? 'flex-start'
      : multi?.justify === 'end'
        ? 'flex-end'
        : multi?.justify === 'between'
          ? 'space-between'
          : multi?.justify === 'around'
            ? 'space-around'
            : 'center'
  const alignItemsFlex: React.CSSProperties['alignItems'] =
    multi?.align === 'start' ? 'flex-start' : multi?.align === 'center' ? 'center' : 'flex-end'

  /** 대화창·입력줄 위에 스프라이트가 겹치지 않도록 최소 여유 (px, 하단에서) */
  const VN_DIALOG_STACK_RESERVE_PX = 300
  const spriteBottomPx = useMemo(() => {
    const last = messages[messages.length - 1]
    const showAssistantBox = !isLogOpen && last?.role === 'assistant'
    if (showAssistantBox) {
      return Math.min(400, Math.max(effectiveLiftPx, VN_DIALOG_STACK_RESERVE_PX))
    }
    return effectiveLiftPx
  }, [messages, isLogOpen, effectiveLiftPx])

  const latestTurn = messages[messages.length - 1]
  const assistantPagesForLatest = useMemo(() => {
    if (!latestTurn || latestTurn.role !== 'assistant') return null
    return paginateAssistantContent(latestTurn.content, VN_DEFAULT_CHARS_PER_PAGE)
  }, [latestTurn?.id, latestTurn?.content])

  useEffect(() => {
    setAssistantDialogPageIndex(0)
  }, [latestTurn?.id])

  useEffect(() => {
    if (!assistantPagesForLatest?.length) return
    setAssistantDialogPageIndex((i) =>
      Math.min(i, Math.max(0, assistantPagesForLatest.length - 1))
    )
  }, [assistantPagesForLatest?.length])

  useEffect(() => {
    if (!assistantPagesForLatest || assistantPagesForLatest.length <= 1) return
    if (isLogOpen || editTargetId !== null) return

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return
      const n = assistantPagesForLatest.length
      const idx = assistantPageIndexRef.current
      if (e.key === ' ' || e.key === 'Enter') {
        if (idx < n - 1) {
          e.preventDefault()
          setAssistantDialogPageIndex(idx + 1)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        if (idx > 0) {
          e.preventDefault()
          setAssistantDialogPageIndex(idx - 1)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [assistantPagesForLatest, isLogOpen, editTargetId])

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

      {/* 게임 상태 변수 오버레이 (VN Mode) */}
      {characterInfo?.interfaceConfig?.stats && characterInfo.interfaceConfig.stats.length > 0 && (
        <div className="absolute top-16 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none mt-2">
          <div className="max-w-max mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex flex-wrap gap-4 items-center justify-center pointer-events-auto shadow-lg">
            {characterInfo.interfaceConfig.stats.map(st => {
              const val = parsedStats[st.key] ?? st.initial
              const percent = Math.max(0, Math.min(100, ((val - st.min) / (st.max - st.min)) * 100))
              return (
                <div key={st.key} className="flex items-center gap-2 group relative">
                  <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">{st.name}</span>
                  <div className="w-20 h-2 bg-[#222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-white font-mono">{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden bg-[#050505]">
        {/* Layer 0: Background */}
        {displayedImage && (
          <Image
            src={displayedImage}
            alt="배경"
            fill
            className="object-cover z-0"
            unoptimized={isDataUrl(displayedImage)}
          />
        )}
        
        {/* Layer 1: Character Sprite(s) — lift/scale/나란히 배치는 추가 인터페이스 characterLayout + 초기 화면 lift */}
        {nSprites > 0 && (
          <div
            className="absolute inset-x-0 top-16 sm:top-[4.5rem] flex justify-center items-end px-4 z-10 pointer-events-none"
            style={{ bottom: spriteBottomPx }}
          >
            <div
              className="w-full flex justify-center"
              style={{
                transform: spriteScale !== 1 ? `scale(${spriteScale})` : undefined,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="w-full max-w-[min(96vw,80rem)] mx-auto"
                style={{
                  display: nSprites === 1 ? 'block' : sideBySide ? 'grid' : 'flex',
                  flexDirection: !sideBySide && nSprites > 1 ? 'column' : undefined,
                  gridTemplateColumns: sideBySide
                    ? `repeat(${gridColumnCount}, minmax(0, 1fr))`
                    : undefined,
                  gap: gapPx,
                  justifyItems: sideBySide ? 'center' : undefined,
                  justifyContent: sideBySide ? justifyContent : undefined,
                  alignItems:
                    !sideBySide && nSprites > 1 ? 'center' : sideBySide ? alignItemsFlex : undefined,
                }}
              >
                {activeCharacterSprites.map((spriteUrl, i) => (
                  <div
                    key={`${i}-${spriteUrl.slice(0, 48)}`}
                    className={`min-w-0 flex justify-center ${nSprites === 1 ? 'mx-auto' : ''}`}
                    style={spriteMaxWidthPx != null ? { maxWidth: spriteMaxWidthPx } : undefined}
                  >
                    <div
                      className={
                        spriteHeightVh == null
                          ? 'relative w-full max-w-md sm:max-w-lg md:max-w-xl h-[42vh] sm:h-[min(52vh,380px)] max-h-[400px] min-h-[120px]'
                          : 'relative w-full max-w-md sm:max-w-lg md:max-w-xl min-h-[120px]'
                      }
                      style={
                        spriteHeightVh != null
                          ? { height: `${spriteHeightVh}vh`, maxHeight: 'min(80vh, 520px)' }
                          : undefined
                      }
                    >
                      <Image
                        src={spriteUrl}
                        alt={nSprites > 1 ? `캐릭터 ${i + 1}` : '캐릭터 스탠딩'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 32rem, 36rem"
                        className="object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                        unoptimized={isDataUrl(spriteUrl)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ExtraInterfaceOverlay entries={characterInfo?.interfaceConfig?.extraInterfaceEntries} />

        {/* Layer 2: Hidden parsers for previous messages to maintain state sequentially */}
        {/* We map through all messages except the last one to ensure side-effects trigger */}
        <div className="hidden">
          {messages.slice(0, -1).map((msg) => (
            <MessageParser 
              key={msg.id}
              content={msg.content} 
              assets={characterInfo?.interfaceConfig?.assets || []}
              regexScripts={regexScripts}
              onBackgroundChange={setDisplayedImage}
              onStatsChange={setParsedStats}
              onCharacterSpritesChange={setActiveCharacterSprites}
            />
          ))}
        </div>

        {/* Layer 3: Main VN Dialogue Box (latest message) */}
        {!isLogOpen && (() => {
          const latestMsg = messages[messages.length - 1]
          if (!latestMsg) return null
          
          const isUser = latestMsg.role === 'user'
          const isEditing = editTargetId === latestMsg.id
          const uiTheme = characterInfo?.interfaceConfig?.uiTheme as any
          const { nameColor, textColor, chatBoxStyle, senderStyle, contentStyle, messageStyle, ...flatBoxStyles } = uiTheme || {}

          const boxStyle = !isUser
            ? { backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', ...flatBoxStyles, ...(chatBoxStyle || {}) }
            : { backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }
          const nameLabelStyle = { color: nameColor ?? '#fbcfe8', ...(senderStyle || {}) }
          const textBodyStyle = { color: textColor ?? '#f3f4f6', ...(contentStyle || {}), ...(messageStyle || {}) }

          const vnPages = assistantPagesForLatest
          const vnPageIdx = vnPages?.length
            ? Math.min(assistantDialogPageIndex, Math.max(0, vnPages.length - 1))
            : 0
          const assistantDisplayContent =
            !isUser && vnPages && vnPages.length > 0 ? vnPages[vnPageIdx] : latestMsg.content

          return (
            <div className="absolute bottom-[76px] left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-20 group">
              <div
                className="p-5 sm:p-6 rounded-2xl border border-white/20 shadow-2xl relative transition-all"
                style={boxStyle}
              >
                {!isUser && (
                  <div 
                    className="text-sm font-bold tracking-wide mb-2 drop-shadow-md"
                    style={nameLabelStyle}
                  >
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
                  <div
                    className={`text-[16px] sm:text-[17px] leading-relaxed font-light min-h-[4rem] ${
                      isUser ? 'italic text-gray-300' : 'max-h-[min(38vh,380px)] overflow-y-auto overflow-x-hidden pr-1'
                    }`}
                    style={!isUser ? textBodyStyle : {}}
                  >
                    {isUser ? (
                      latestMsg.content
                    ) : vnPages && vnPages.length > 1 ? (
                      <>
                        <div className="hidden" aria-hidden>
                          <MessageParser
                            content={latestMsg.content}
                            assets={characterInfo?.interfaceConfig?.assets || []}
                            regexScripts={regexScripts}
                            onBackgroundChange={setDisplayedImage}
                            onStatsChange={setParsedStats}
                            onCharacterSpritesChange={setActiveCharacterSprites}
                          />
                        </div>
                        <MessageParser
                          content={assistantDisplayContent}
                          assets={characterInfo?.interfaceConfig?.assets || []}
                          regexScripts={regexScripts}
                        />
                      </>
                    ) : (
                      <MessageParser
                        content={latestMsg.content}
                        assets={characterInfo?.interfaceConfig?.assets || []}
                        regexScripts={regexScripts}
                        onBackgroundChange={setDisplayedImage}
                        onStatsChange={setParsedStats}
                        onCharacterSpritesChange={setActiveCharacterSprites}
                      />
                    )}
                  </div>
                )}

                {!isEditing && !isUser && vnPages && vnPages.length > 1 && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        disabled={vnPageIdx <= 0}
                        onClick={() => setAssistantDialogPageIndex((i) => Math.max(0, i - 1))}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 text-xs text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/15"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        이전
                      </button>
                      <span className="text-xs text-gray-400 tabular-nums min-w-[4rem] text-center">
                        {vnPageIdx + 1} / {vnPages.length}
                      </span>
                      <button
                        type="button"
                        disabled={vnPageIdx >= vnPages.length - 1}
                        onClick={() =>
                          setAssistantDialogPageIndex((i) => Math.min(vnPages.length - 1, i + 1))
                        }
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#e45463]/85 text-xs text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-[#d04352]"
                      >
                        다음
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 text-center leading-snug">
                      <span className="hidden sm:inline">
                        키보드: <kbd className="px-1 rounded bg-white/10">Space</kbd> /{' '}
                        <kbd className="px-1 rounded bg-white/10">Enter</kbd> → 다음 ·{' '}
                        <kbd className="px-1 rounded bg-white/10">←</kbd> /{' '}
                        <kbd className="px-1 rounded bg-white/10">Backspace</kbd> → 이전 (입력창에 포커스일 때는
                        적용되지 않음)
                      </span>
                      <span className="sm:hidden">긴 대사는「이전 / 다음」으로 넘깁니다.</span>
                    </p>
                  </div>
                )}

                {!isEditing && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditTargetId(latestMsg.id)
                        setEditContent(latestMsg.content)
                      }}
                      className="text-gray-400 hover:text-white"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(latestMsg.id)}
                      className="text-gray-400 hover:text-red-400"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsLogOpen(true)}
                  className="absolute -top-8 right-0 px-4 py-1.5 bg-black/60 hover:bg-black/80 rounded-t-lg border-x border-t border-white/20 text-xs text-gray-300 transition-colors backdrop-blur-md"
                >
                  Log (대화 기록)
                </button>
              </div>
            </div>
          )
        })()}

        {/* Layer 4: Chat Log Modal */}
        {isLogOpen && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center pt-20 pb-6 px-4">
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 text-white bg-black/50 py-3 px-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5"/> 대화 기록</h3>
              <button 
                onClick={() => setIsLogOpen(false)}
                className="px-4 py-1.5 bg-[#e45463] hover:bg-[#d04352] rounded-lg text-sm transition font-medium"
              >
                닫기
              </button>
            </div>
            <div className="w-full max-w-4xl flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
              {messages.map(msg => {
                const isUser = msg.role === 'user'
                const isEditingLog = editTargetId === msg.id
                return (
                  <div key={msg.id} className={`p-5 rounded-2xl border border-white/5 relative group transition ${isUser ? 'bg-blue-900/20 ml-10' : 'bg-[#111] mr-10'}`}>
                    <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-2 uppercase">
                      {isUser ? (characterInfo?.userName || 'User') : characterInfo?.name}
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
                          <button onClick={handleSaveEdit} className="text-sm text-yellow-400 hover:text-yellow-300">저장</button>
                          <button onClick={() => setEditTargetId(null)} className="text-sm text-gray-400 hover:text-white">취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-[15px] text-gray-200 whitespace-pre-wrap leading-relaxed ${isUser ? 'italic' : ''}`}>
                        {isUser ? msg.content : (
                          // Rerender MessageParser visually inside Log exactly as the original text was
                          <MessageParser 
                            content={msg.content} 
                            assets={characterInfo?.interfaceConfig?.assets || []}
                            regexScripts={regexScripts}
                            onBackgroundChange={setDisplayedImage}
                            onStatsChange={setParsedStats}
                            onCharacterSpritesChange={setActiveCharacterSprites}
                          />
                        )}
                      </div>
                    )}
                    
                    {!isEditingLog && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditTargetId(msg.id); setEditContent(msg.content); }} className="text-gray-400 hover:text-white" title="수정"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-gray-400 hover:text-red-400" title="삭제"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full px-4 py-3 z-50 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => openSaveLoadMenu('save')}
              className="text-xs bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 px-3 py-2.5 rounded-xl backdrop-blur-md flex items-center justify-center transition"
              title="시스템 설정 (세이브/로드)"
            >
              <Settings size={16} />
              <span className="ml-1 hidden sm:inline">System</span>
            </button>
            <button
              onClick={() => setShowModelModal(true)}
              className="text-xs bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 px-3 py-2.5 rounded-xl backdrop-blur-md flex items-center justify-center transition"
              title="모델 변경"
            >
              {models.find((m) => m.id === selectedModel)?.icon}
              <span className="ml-1 hidden sm:inline">
                {models.find((m) => m.id === selectedModel)?.label?.split('·')[0].trim() ?? 'Select'}
              </span>
            </button>
          </div>
          
          <div className="flex flex-1 ml-2 items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition">
            <textarea
              ref={chatInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="행동이나 대사를 입력하세요..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-[15px] focus:outline-none resize-none overflow-hidden h-auto max-h-24 py-1.5"
              rows={1}
            />
            <button
              onClick={sendMessage}
              className="ml-2 p-2 rounded-lg bg-[#e45463]/80 hover:bg-[#d04352] transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                    void setLastChatModelSelection({
                      provider: model.provider,
                      modelId: model.id,
                    })
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
                    void setChatParameters({ temperature: next, maxInputChars, maxOutputChars })
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
                  void setChatParameters({ temperature, maxInputChars: safe, maxOutputChars })
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
                  void setChatParameters({ temperature, maxInputChars, maxOutputChars: safe })
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
        <>
          {/* 배경 딤 */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-screen w-full max-w-[320px] z-50 shadow-2xl">
            <ChatMenu
              characterId={typeof id === 'string' ? id : ''}
              characterName={characterInfo?.name ?? ''}
              onClose={() => setMenuOpen(false)}
              onNewChat={() => {
                if (!characterInfo || typeof id !== 'string') return
                void (async () => {
                  if (messages.length > 0) {
                    await saveChatSession(id, messages)
                  }
                  const assets = characterInfo.interfaceConfig?.assets ?? []
                  const localChar = await getLocalCharacter(id)
                  const initBgId = localChar?.details?.initialBackground as string | undefined
                  const initCharId = localChar?.details?.initialCharacter as string | undefined
                  if (initBgId) {
                    const a = assets.find((x: any) => x.id === initBgId)
                    if (a?.url) setDisplayedImage(a.url)
                  }
                  if (initCharId) {
                    const a = assets.find((x: any) => x.id === initCharId)
                    if (a?.url) setActiveCharacterSprites([a.url])
                  } else {
                    setActiveCharacterSprites([])
                  }
                  const initTags = [
                    initBgId ? `<img=${initBgId}:background>` : '',
                    initCharId ? `<img=${initCharId}>` : '',
                  ].filter(Boolean).join(' ')
                  const firstLineText = [initTags, characterInfo.firstLine].filter(Boolean).join('\n')
                  const fresh: any[] = characterInfo.situation
                    ? [
                        { id: crypto.randomUUID(), role: 'user', content: `{${characterInfo.situation}}` },
                        ...(characterInfo.userDescription
                          ? [{ id: crypto.randomUUID(), role: 'user', content: `{${characterInfo.userDescription}}` }]
                          : []),
                        ...(firstLineText
                          ? [{ id: crypto.randomUUID(), role: 'assistant', content: firstLineText }]
                          : []),
                      ]
                    : []
                  setMessages(fresh)
                })()
              }}
              onLoadSession={(msgs: any[]) => setMessages(msgs)}
            />
          </div>
        </>
      )}
      {/* Save/Load VN System Modal */}
      {isSaveLoadOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col relative shadow-2xl">
            <button 
              onClick={() => setIsSaveLoadOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              닫기 ✕
            </button>
            <div className="flex border-b border-white/10 mb-6 gap-6">
              <button 
                onClick={() => setSaveLoadTab('save')}
                className={`pb-3 px-2 text-lg font-bold transition-colors ${saveLoadTab === 'save' ? 'text-white border-b-2 border-[#e45463]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                SAVE (진행 상황 저장)
              </button>
              <button 
                onClick={() => setSaveLoadTab('load')}
                className={`pb-3 px-2 text-lg font-bold transition-colors ${saveLoadTab === 'load' ? 'text-white border-b-2 border-[#e45463]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                LOAD (불러오기)
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({length: 10}).map((_, i) => {
                  const sIdx = i + 1
                  const savedData = saveSlots.find(s => s.slotIndex === sIdx)
                  
                  return (
                    <div 
                      key={`slot-${sIdx}`}
                      onClick={() => {
                        if (saveLoadTab === 'save') handleSaveSlot(sIdx)
                        else if (saveLoadTab === 'load' && savedData) handleLoadSlot(sIdx)
                      }}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden group h-32 flex flex-col justify-center ${
                        savedData 
                          ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40' 
                          : 'border-white/5 bg-black/40 border-dashed hover:border-white/30 text-gray-600'
                      }`}
                    >
                      {/* Optional: Add a miniature background thumbnail here if we capture logic for it later */}
                      <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-[#e45463] bg-black/50 px-2 py-0.5 rounded">SLOT {sIdx.toString().padStart(2, '0')}</span>
                      
                      {savedData && (
                        <button
                          onClick={(e) => handleDeleteSlot(e, sIdx)}
                          className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-500/80 rounded transition opacity-0 group-hover:opacity-100"
                          title="슬롯 삭제"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      )}

                      {savedData ? (
                        <div className="mt-4">
                          <p className="text-xs text-gray-400 mb-1">{new Date(savedData.savedAt).toLocaleString()}</p>
                          <p className="text-sm font-medium text-white line-clamp-2">{savedData.previewText}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-medium">EMPTY</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
