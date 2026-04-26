'use client'
import ChatMenu from '@/components/ChatMenu'
import { ChatDialoguePanel } from '@/components/chat/ChatDialoguePanel'
import { ChatHeaderBar } from '@/components/chat/ChatHeaderBar'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { ChatLogModal } from '@/components/chat/ChatLogModal'
import { ChatModelModal } from '@/components/chat/ChatModelModal'
import { ChatSettingsModal } from '@/components/chat/ChatSettingsModal'
import { ChatStatsOverlay } from '@/components/chat/ChatStatsOverlay'
import { ChatVnLayer } from '@/components/chat/ChatVnLayer'
import { ChatAssetPicker } from '@/components/chat/ChatAssetPicker'
import CustomStyleInjector from '@/components/CustomStyleInjector'
import type { ChatCharacterSummary, ChatMessage, ChatModelItem } from '@/components/chat/types'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/router'
import { getLocalCharacter, type LocalCharacter } from '@/lib/localStorage'
import type { InterfaceConfig, LoreEntry, AssetRef } from '@/lib/interfaceConfig'
import { deriveChatState } from '@/lib/chatState'
import {
  getChatRooms,
  createChatRoom,
  getChatRoomMessages,
  saveChatRoomMessages,
  getLastActiveRoomId,
  setLastActiveRoomId,
  touchChatRoom,
  getMostRecentlyUsedRoomId,
  type ChatRoom,
} from '@/lib/chatRooms'
import {
  getApiModels,
  getApiProviders,
  getChatParameters,
  getLastChatModelSelection,
  getPromptBundles,
  getModuleBundles,
  getUserPersona,
  type ProviderId,
} from '@/lib/appSettings'
import { kvGet } from '@/lib/idbKV'
import { stripDataUrlsFromJsonValue } from '@/lib/stripDataUrlsForApi'
import {
  effectiveCharacterLiftPx,
  parseMergedCharacterLayoutFromExtraEntries,
} from '@/lib/interfaceRuntime'
import {
  paginateAssistantContent,
  VN_DEFAULT_CHARS_PER_PAGE,
} from '@/lib/vnDialogPagination'
import {
  normalizeImageControlTags,
  parseImageTags,
  resolveAssetByRef,
  splitRefAndType,
} from '@/lib/chatImageTags'
import { shouldApplyAssistantReply } from '@/lib/chatConcurrency'
import { buildScanContext } from '@/lib/lorebookActivation'
import Image from 'next/image'
import { Sparkles, Zap, Feather, Gem } from 'lucide-react'

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
  /** 캐릭터 로어북 (채팅 API 키워드 스캔에 사용) */
  loreEntries?: LoreEntry[]
  worldSetting?: string
  supporting?: { name: string; description: string }[]
  tags?: string[]
  isAdult?: boolean
  isPublic?: boolean
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

/**
 * 새 채팅 진입 시: `situation`이 없어도 첫 대사·초기 배경/캐릭터 태그만 있으면 assistant 메시지를 넣어
 * 대화창(VN 박스)이 비지 않게 함.
 */
function buildOpeningMessages(args: {
  situation?: string
  userDescription?: string
  firstLine?: string
  initialBackgroundAssetId?: string
  initialCharacterAssetId?: string
}): ChatMessage[] {
  const initTags = [
    args.initialBackgroundAssetId ? `<img=${args.initialBackgroundAssetId}:background>` : '',
    args.initialCharacterAssetId ? `<img=${args.initialCharacterAssetId}>` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const firstLineText = [initTags, args.firstLine].filter(Boolean).join('\n')

  const out: ChatMessage[] = []
  const sit = args.situation?.trim()
  if (sit) {
    out.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: `{${sit}}`,
      created_at: new Date().toISOString(),
    })
    const ud = args.userDescription?.trim()
    if (ud) {
      out.push({
        id: crypto.randomUUID(),
        role: 'user',
        content: `{${ud}}`,
        created_at: new Date().toISOString(),
      })
    }
  }
  if (firstLineText) {
    out.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: firstLineText,
      created_at: new Date().toISOString(),
    })
  }
  return out
}

function normalizeAssistantImageTags(raw: string): string {
  if (!raw) return raw
  return raw
    .replace(/&lt;\s*img-src-([^&]+?)\s*&gt;/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/&lt;\s*img-src\s*=\s*([^&]+?)\s*&gt;/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/&lt;\s*img\s+src\s*=\s*["']([^"']+)["']\s*\/?\s*&gt;/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/&lt;\s*img\s*=\s*([^&]+?)\s*&gt;/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/<img-src-([^>]+?)\s*\/?>/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/<img-src\s*=\s*([^>]+?)\s*\/?>/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
    .replace(/<img\s*=\s*([^>]+?)\s*\/?>/gi, (_m, ref: string) => `<img=${String(ref).trim()}>`)
}

function pickAssetsForApi(args: {
  assets: AssetRef[]
  recentMessages: ChatMessage[]
  displayedImage: string | null
  activeCharacterSprites: string[]
}): AssetRef[] {
  const { assets, recentMessages, displayedImage, activeCharacterSprites } = args
  if (!assets.length) return []

  const picked = new Map<string, AssetRef>()
  const push = (asset?: AssetRef) => {
    if (!asset) return
    if (!picked.has(asset.id)) picked.set(asset.id, asset)
  }

  const recentSlice = recentMessages.slice(-12)
  for (const msg of recentSlice) {
    const normalized = normalizeImageControlTags(msg.content)
    for (const tag of parseImageTags(normalized)) {
      const { ref } = splitRefAndType(tag.rawRef)
      push(resolveAssetByRef(assets, ref))
    }
  }

  if (displayedImage) {
    push(assets.find((a) => a.url === displayedImage))
  }
  for (const spriteUrl of activeCharacterSprites) {
    push(assets.find((a) => a.url === spriteUrl))
  }

  // Ensure minimal candidates exist even when tags are sparse.
  const hasBg = [...picked.values()].some((a) => a.type === 'background')
  const hasChar = [...picked.values()].some((a) => a.type === 'character')
  if (!hasBg) {
    assets.filter((a) => a.type === 'background').slice(0, 3).forEach(push)
  }
  if (!hasChar) {
    assets.filter((a) => a.type === 'character').slice(0, 8).forEach(push)
  }
  if (picked.size < 12) {
    assets
      .filter((a) => a.type === 'ui')
      .slice(0, 4)
      .forEach(push)
  }

  return [...picked.values()].slice(0, 24)
}

function buildCharacterInfoForApi(args: {
  characterInfo: Character
  recentMessages: ChatMessage[]
  displayedImage: string | null
  activeCharacterSprites: string[]
}): Record<string, unknown> {
  const { characterInfo, recentMessages, displayedImage, activeCharacterSprites } = args
  const fullAssets = characterInfo.interfaceConfig?.assets || []
  const selectedAssets = pickAssetsForApi({
    assets: fullAssets,
    recentMessages,
    displayedImage,
    activeCharacterSprites,
  }).map((a) => ({
    id: a.id,
    type: a.type,
    label: a.label,
    // keep URL only when non-data; API may use basename hints.
    url: typeof a.url === 'string' && !a.url.startsWith('data:') ? a.url : '',
  }))

  const iface = characterInfo.interfaceConfig
  const scanText = buildScanContext(recentMessages, 12).toLowerCase()
  const selectedLoreEntries = (characterInfo.loreEntries ?? [])
    .filter((entry) => {
      if (entry.alwaysActive) return true
      const keyText = (entry.keys || '').trim()
      if (!keyText) return false
      const keys = keyText
        .split(/[,，\n\r]+/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
      if (keys.length === 0) return false
      return keys.some((k) => scanText.includes(k))
    })
    .slice(0, 32)

  return {
    id: characterInfo.id,
    name: characterInfo.name,
    personality: characterInfo.personality,
    description: characterInfo.description,
    situation: characterInfo.situation,
    firstLine: characterInfo.firstLine,
    worldSetting: characterInfo.worldSetting,
    supporting: characterInfo.supporting ?? [],
    loreEntries: selectedLoreEntries,
    userName: characterInfo.userName,
    userRole: characterInfo.userRole,
    userDescription: characterInfo.userDescription,
    isAdult: characterInfo.isAdult,
    isPublic: characterInfo.isPublic,
    tags: characterInfo.tags ?? [],
    interfaceConfig: {
      assets: selectedAssets,
      dialogueScript: iface?.dialogueScript ?? '',
      scenarioRules: iface?.scenarioRules ?? [],
      backgroundEmbedding: iface?.backgroundEmbedding ?? '',
      regexScripts: iface?.regexScripts ?? [],
      stats: iface?.stats ?? [],
    },
  }
}

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [characterInfo, setCharacterInfo] = useState<Character | null>(null)
  const [displayedImage, setDisplayedImage] = useState<string | null>(null)
  const [activeCharacterSprites, setActiveCharacterSprites] = useState<string[]>([])
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]) // 추가: 현재 활성화된 기타 오버레이 ID들
  const [manualOverlayIds, setManualOverlayIds] = useState<string[]>([])
  const [overlayOnlyMode, setOverlayOnlyMode] = useState(false)
  const [parsedStats, setParsedStats] = useState<Record<string, number>>({})
  const [models, setModels] = useState<ChatModelItem[]>([])
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('openai')
  const [showModelModal, setShowModelModal] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [assistantDialogPageIndex, setAssistantDialogPageIndex] = useState(0)
  const [viewMessageIndex, setViewMessageIndex] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const assistantPageIndexRef = useRef(0)
  assistantPageIndexRef.current = assistantDialogPageIndex

  const [menuOpen, setMenuOpen] = useState(false)
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const activeRoomIdRef = useRef<string | null>(null)
  const roomSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef(false)
  const savePendingRef = useRef<{ roomId: string | null; messages: ChatMessage[] } | null>(null)
  const requestSeqRef = useRef(0)
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])


  const [temperature, setTemperature] = useState(0.7)
  const combinedOverlayIds = useMemo(
    () => Array.from(new Set([...activeOverlays, ...manualOverlayIds])),
    [activeOverlays, manualOverlayIds]
  )

  const handleToggleOverlay = useCallback((id: string) => {
    setManualOverlayIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const [maxOutputChars, setMaxOutputChars] = useState(4000)
  const [maxInputChars, setMaxInputChars] = useState(4000)
  const regexScripts = characterInfo?.interfaceConfig?.regexScripts

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
        const list: ChatModelItem[] = []
          ; (Object.keys(modelsMap) as ProviderId[]).forEach((pid) => {
            ; (modelsMap[pid] ?? []).forEach((mid) => {
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
        let chosen: ChatModelItem | undefined = curId
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
          setSelectedProvider(chosen.provider as ProviderId)
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

      const formattedCharRaw = localChar
      const globalPersona = await getUserPersona()
      const formattedCharacter: Character = {
        id: formattedCharRaw.id,
        name: formattedCharRaw.name,
        personality: formattedCharRaw.personality ?? '',
        description: formattedCharRaw.description ?? '',
        situation: formattedCharRaw.situation ?? '',
        firstLine: formattedCharRaw.firstLine,
        imageUrl: imageUrl || undefined,
        userName: (formattedCharRaw.userName ?? formattedCharRaw.user_name) || globalPersona.name,
        userRole: formattedCharRaw.userRole ?? formattedCharRaw.user_role,
        userDescription: (formattedCharRaw.userDescription ?? formattedCharRaw.user_description) || globalPersona.description,
        emotionImages,
        interfaceConfig: formattedCharRaw.interfaceConfig,
        worldSetting: formattedCharRaw.worldSetting ?? formattedCharRaw.world_setting,
        supporting: formattedCharRaw.supporting ?? [],
        loreEntries: (formattedCharRaw as { loreEntries?: LoreEntry[] }).loreEntries,
        tags: formattedCharRaw.tags,
        isAdult: formattedCharRaw.isAdult ?? formattedCharRaw.is_adult,
        isPublic: formattedCharRaw.isPublic ?? formattedCharRaw.is_public,
      }
      setCharacterInfo(formattedCharacter)

      const assets = localChar.interfaceConfig?.assets ?? []
      const initBgId = localChar.details?.initialBackground as string | undefined
      const initCharId = localChar.details?.initialCharacter as string | undefined

      // Background Fallback: 지정된 ID가 있으면 먼저 찾고, 없거나 못 찾으면 첫 번째 배경 에셋 사용
      let bgUrl: string | null = null
      if (initBgId) {
        bgUrl = assets.find((a) => a.id === initBgId)?.url || null
      }
      if (!bgUrl) {
        bgUrl = assets.find((a) => a.type === 'background')?.url || null
      }
      setDisplayedImage(bgUrl)

      // === 채팅방 시스템 초기화 ===
      const characterId = id as string
      let rooms = await getChatRooms(characterId)
      let roomId: string | null = await getLastActiveRoomId(characterId)

      // 채팅방이 하나도 없으면 자동 생성
      if (rooms.length === 0) {
        // 기존 단일 저장소(chat-{id})에 데이터가 있으면 마이그레이션
        const legacyKey = `chat-${characterId}`
        const legacySaved = await kvGet(legacyKey)
        const newRoom = await createChatRoom(characterId, 'Chat 1')
        roomId = newRoom.id
        
        if (legacySaved) {
          try {
            const legacyMessages = JSON.parse(legacySaved) as ChatMessage[]
            if (Array.isArray(legacyMessages) && legacyMessages.length > 0) {
              await saveChatRoomMessages(characterId, newRoom.id, legacyMessages)
            }
          } catch { /* ignore */ }
        }
        rooms = await getChatRooms(characterId)
      }

      // 마지막 활성 방이 없거나 유효하지 않으면 lastUsedAt 기반 MRU 방 선택
      if (!roomId || !rooms.find(r => r.id === roomId)) {
        roomId = await getMostRecentlyUsedRoomId(characterId)
      }

      if (roomId) {
        setActiveRoomId(roomId)
        await setLastActiveRoomId(characterId, roomId)
        await touchChatRoom(characterId, roomId)

        // 해당 채팅방의 메시지 로드
        let initialMessages = await getChatRoomMessages(characterId, roomId)

        if (initialMessages.length === 0) {
          initialMessages = buildOpeningMessages({
            situation: formattedCharacter.situation,
            userDescription: formattedCharacter.userDescription,
            firstLine: formattedCharacter.firstLine,
            initialBackgroundAssetId: initBgId,
            initialCharacterAssetId: initCharId,
          })
          await saveChatRoomMessages(characterId, roomId, initialMessages)
        }
        setMessages(initialMessages)
        setViewMessageIndex(initialMessages.length - 1)
      }
    })()
  }, [id])

  // [개선] 메시지나 인덱스가 바뀔 때마다 전체 기록을 훑어 현재 화면 상태(배경, 캐릭터, 오버레이) 도출
  useEffect(() => {
    if (!characterInfo || messages.length === 0) return

    const assets = (characterInfo.interfaceConfig?.assets || []) as AssetRef[]
    const { backgroundUrl, characterUrls, overlayIds, overlayOnlyMode, stats } = deriveChatState(
      messages,
      viewMessageIndex,
      assets,
      characterInfo as unknown as LocalCharacter
    )

    setDisplayedImage(backgroundUrl)
    setActiveCharacterSprites(characterUrls)
    setActiveOverlays(overlayIds)
    setOverlayOnlyMode(overlayOnlyMode)
    setParsedStats(stats)
  }, [messages, viewMessageIndex, characterInfo])

  useEffect(() => {
    messagesRef.current = messages
    if (messages.length > 0 && viewMessageIndex === -1) {
      setViewMessageIndex(messages.length - 1)
    }
  }, [messages, viewMessageIndex])

  const flushPersistCurrentRoom = useCallback(async (
    roomIdOverride?: string | null,
    messagesOverride?: ChatMessage[]
  ): Promise<void> => {
    const characterId = typeof id === 'string' ? id : ''
    const roomId = roomIdOverride ?? activeRoomIdRef.current
    const messagesToPersist = messagesOverride ?? messagesRef.current
    if (!characterId || !roomId) return
    if (saveInFlightRef.current) {
      savePendingRef.current = { roomId, messages: messagesToPersist }
      return
    }
    saveInFlightRef.current = true
    try {
      await saveChatRoomMessages(characterId, roomId, messagesToPersist)
      await touchChatRoom(characterId, roomId)
    } finally {
      saveInFlightRef.current = false
      if (savePendingRef.current) {
        const pending = savePendingRef.current
        savePendingRef.current = null
        await flushPersistCurrentRoom(pending.roomId, pending.messages)
      }
    }
  }, [id])

  const schedulePersistCurrentRoom = useCallback((
    roomIdOverride?: string | null,
    messagesOverride?: ChatMessage[]
  ): void => {
    if (roomSaveTimerRef.current) {
      clearTimeout(roomSaveTimerRef.current)
    }
    roomSaveTimerRef.current = setTimeout(() => {
      void flushPersistCurrentRoom(roomIdOverride, messagesOverride)
    }, 250)
  }, [flushPersistCurrentRoom])

  useEffect(() => {
    if (typeof window !== 'undefined' && id && typeof id === 'string' && activeRoomId) {
      schedulePersistCurrentRoom(activeRoomId, messages)
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id, activeRoomId, schedulePersistCurrentRoom])

  useEffect(() => {
    const onPageHide = () => {
      if (roomSaveTimerRef.current) {
        clearTimeout(roomSaveTimerRef.current)
        roomSaveTimerRef.current = null
      }
      void flushPersistCurrentRoom(activeRoomIdRef.current, messagesRef.current)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (roomSaveTimerRef.current) {
          clearTimeout(roomSaveTimerRef.current)
          roomSaveTimerRef.current = null
        }
        void flushPersistCurrentRoom(activeRoomIdRef.current, messagesRef.current)
      }
    }
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (roomSaveTimerRef.current) {
        clearTimeout(roomSaveTimerRef.current)
        roomSaveTimerRef.current = null
      }
      void flushPersistCurrentRoom(activeRoomIdRef.current, messagesRef.current)
    }
  }, [id, activeRoomId, flushPersistCurrentRoom])

  const sendToAI = async (
    message: string,
    characterInfo: Character
  ): Promise<string> => {
    try {
      if (!selectedModel) return '모델이 설정되지 않았습니다. 마이페이지에서 Models를 추가해 주세요.'
      const providers = await getApiProviders()
      const key = providers?.[selectedProvider]?.apiKey ?? ''
      if (!key) return 'API 키가 비어있습니다. 마이페이지에서 API Key를 입력해 주세요.'
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

      const maxTokens = Math.max(256, Math.floor(maxOutputChars || 8192))
      const trimmedMessage = message

      const contextMessages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: trimmedMessage,
          created_at: new Date().toISOString(),
        },
      ]
      const recentMessages = contextMessages.slice(-500)
      const characterInfoForApi = buildCharacterInfoForApi({
        characterInfo,
        recentMessages,
        displayedImage,
        activeCharacterSprites,
      })
      const chatPayload = stripDataUrlsFromJsonValue({
        messages: recentMessages,
        characterInfo: characterInfoForApi,
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
        return '응답 실패 (서버 오류 또는 API 키 확인)'
      }

      const result = await res.json()
      return String(result.reply ?? '')
    } catch (err) {
      console.error('AI 연결 오류:', err)
      return 'AI 응답 실패 (네트워크 오류)'
    }
  }

  const sendMessage = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || !characterInfo || isSending) return
    const requestToken = ++requestSeqRef.current
    const roomIdAtSend = activeRoomIdRef.current
    setIsSending(true)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const reply = await sendToAI(trimmedInput, characterInfo)
      if (
        !shouldApplyAssistantReply({
          requestToken,
          latestRequestToken: requestSeqRef.current,
          roomIdAtSend,
          currentRoomId: activeRoomIdRef.current,
        })
      ) {
        return
      }
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: normalizeAssistantImageTags(reply),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => {
        const next = [...prev, assistantMessage]
        setViewMessageIndex(next.length - 1)
        return next
      })
    } finally {
      if (requestToken === requestSeqRef.current) {
        setIsSending(false)
      }
    }
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

  const characterLayout = useMemo(
    () => parseMergedCharacterLayoutFromExtraEntries(characterInfo?.interfaceConfig?.extraInterfaceEntries),
    [characterInfo?.interfaceConfig?.extraInterfaceEntries]
  )

  /** liftPx(JSON) → 없으면 interfaceConfig.characterSpriteLiftPx → 없으면 미리보기와 동일 기본(128px) */
  const effectiveLiftPx = useMemo(
    () =>
      effectiveCharacterLiftPx(characterInfo?.interfaceConfig?.characterSpriteLiftPx, characterLayout),
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
  const spriteMaxWidthVw =
    typeof characterLayout.maxWidthVw === 'number' && Number.isFinite(characterLayout.maxWidthVw)
      ? Math.min(100, Math.max(5, characterLayout.maxWidthVw))
      : null

  const spriteCellMaxWidthStyle = useMemo((): CSSProperties | undefined => {
    if (spriteMaxWidthPx != null && spriteMaxWidthVw != null) {
      return { maxWidth: `min(${spriteMaxWidthPx}px, ${spriteMaxWidthVw}vw)` }
    }
    if (spriteMaxWidthPx != null) {
      return { maxWidth: `min(${spriteMaxWidthPx}px, 96vw)` }
    }
    if (spriteMaxWidthVw != null) {
      return { maxWidth: `${spriteMaxWidthVw}vw` }
    }
    return undefined
  }, [spriteMaxWidthPx, spriteMaxWidthVw])
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

  const currentTurn = messages[viewMessageIndex] ?? messages[messages.length - 1]
  const assistantPagesForLatest = useMemo(() => {
    if (!currentTurn || currentTurn.role !== 'assistant') return null
    return paginateAssistantContent(currentTurn.content, VN_DEFAULT_CHARS_PER_PAGE)
  }, [currentTurn?.id, currentTurn?.content, currentTurn])

  useEffect(() => {
    setAssistantDialogPageIndex(0)
  }, [currentTurn?.id])

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
      
      const n = assistantPagesForLatest?.length || 0
      const idx = assistantDialogPageIndex
      const isUserMsg = currentTurn?.role === 'user'

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        if (!isUserMsg && idx < n - 1) {
          e.preventDefault()
          setAssistantDialogPageIndex(idx + 1)
        } else if (viewMessageIndex < messages.length - 1) {
          e.preventDefault()
          setViewMessageIndex(viewMessageIndex + 1)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        if (!isUserMsg && idx > 0) {
          e.preventDefault()
          setAssistantDialogPageIndex(idx - 1)
        } else if (viewMessageIndex > 0) {
          e.preventDefault()
          setViewMessageIndex(viewMessageIndex - 1)
        }
      } else if (e.key === 'Home') {
        if (viewMessageIndex > 0 || idx > 0) {
          e.preventDefault()
          setViewMessageIndex(0)
          setAssistantDialogPageIndex(0)
        }
      } else if (e.key === 'End') {
        if (viewMessageIndex < messages.length - 1) {
          e.preventDefault()
          setViewMessageIndex(messages.length - 1)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [assistantPagesForLatest, isLogOpen, editTargetId, viewMessageIndex, messages.length, currentTurn?.role, assistantDialogPageIndex])

  const handleSelectRoom = async (roomId: string) => {
    const characterId = typeof id === 'string' ? id : ''
    if (!characterId) return

    const currentRoomId = activeRoomIdRef.current
    const currentMessages = [...messagesRef.current]
    if (currentRoomId && currentRoomId !== roomId) {
      await flushPersistCurrentRoom(currentRoomId, currentMessages)
    }
    setActiveRoomId(roomId)
    await setLastActiveRoomId(characterId, roomId)
    await touchChatRoom(characterId, roomId)
    const msgs = await getChatRoomMessages(characterId, roomId)
    setMessages(msgs)
    setViewMessageIndex(msgs.length - 1)
    setMenuOpen(false)
  }

  const handleCreateRoom = async (room: ChatRoom) => {
    const characterId = typeof id === 'string' ? id : ''
    if (!characterId) return

    const currentRoomId = activeRoomIdRef.current
    const currentMessages = [...messagesRef.current]
    if (currentRoomId && currentRoomId !== room.id) {
      await flushPersistCurrentRoom(currentRoomId, currentMessages)
    }

    setActiveRoomId(room.id)
    await setLastActiveRoomId(characterId, room.id)
    await touchChatRoom(characterId, room.id)
    
    // 새 방의 초기 메시지 생성
    const localChar = await getLocalCharacter(characterId)
    const initBgId = localChar?.details?.initialBackground as string | undefined
    const initCharId = localChar?.details?.initialCharacter as string | undefined
    const initialMessages = buildOpeningMessages({
      situation: characterInfo?.situation,
      userDescription: characterInfo?.userDescription,
      firstLine: characterInfo?.firstLine,
      initialBackgroundAssetId: initBgId,
      initialCharacterAssetId: initCharId,
    })
    
    await saveChatRoomMessages(characterId, room.id, initialMessages)
              await touchChatRoom(characterId, room.id)
    setMessages(initialMessages)
    setViewMessageIndex(initialMessages.length - 1)
  }

  const handleDeleteRoom = async (roomId: string) => {
    const characterId = typeof id === 'string' ? id : ''
    if (!characterId) return

    // 삭제된 방이 현재 활성화된 방이면 목록에서 다른 방을 선택해줌
    if (activeRoomId === roomId) {
      const rooms = await getChatRooms(characterId)
      if (rooms.length > 0) {
        await handleSelectRoom(rooms[0].id)
      } else {
        // 모든 방이 지워졌으면 새 방을 하나 만듦
        const newRoom = await createChatRoom(characterId, 'Chat 1')
        await handleCreateRoom(newRoom)
      }
    }
  }

  return (
    <div className="bg-[#0d0d0d] text-white h-screen flex flex-col overflow-hidden relative">
      <CustomStyleInjector css={characterInfo?.interfaceConfig?.customCSS} />
      {displayedImage && (
        <div className="sm:hidden absolute inset-0 z-0">
          <Image
            src={displayedImage}
            alt="배경"
            fill
            className="object-cover opacity-15"
            unoptimized={isDataUrl(displayedImage)}
          />
        </div>
      )}

      {characterInfo && (
        <ChatHeaderBar
          characterInfo={characterInfo as ChatCharacterSummary}
          onBack={() => {
            void (async () => {
              await flushPersistCurrentRoom()
              await router.push('/')
            })()
          }}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          isDataUrl={isDataUrl}
        />
      )}

      {characterInfo?.interfaceConfig?.stats && characterInfo.interfaceConfig.stats.length > 0 && (
        <ChatStatsOverlay stats={characterInfo.interfaceConfig.stats} parsedStats={parsedStats} />
      )}

      <div
        className="relative flex flex-1 overflow-hidden bg-[#050505]"
        onClick={() => {
          if (!assistantPagesForLatest || assistantPagesForLatest.length <= 1) return
          if (isLogOpen || editTargetId !== null) return
          if (assistantDialogPageIndex < assistantPagesForLatest.length - 1) {
            setAssistantDialogPageIndex(assistantDialogPageIndex + 1)
          }
        }}
      >
        <ChatVnLayer
          displayedImage={displayedImage}
          isDataUrl={isDataUrl}
          nSprites={nSprites}
          effectiveLiftPx={effectiveLiftPx}
          spriteScale={spriteScale}
          sideBySide={sideBySide}
          gridColumnCount={gridColumnCount}
          gapPx={gapPx}
          justifyContent={justifyContent}
          alignItemsFlex={alignItemsFlex}
          spriteCellMaxWidthStyle={spriteCellMaxWidthStyle}
          spriteHeightVh={spriteHeightVh}
          activeCharacterSprites={activeCharacterSprites}
          extraInterfaceEntries={characterInfo?.interfaceConfig?.extraInterfaceEntries}
          assets={characterInfo?.interfaceConfig?.assets || []}
          activeOverlays={combinedOverlayIds}
          overlayOnlyMode={overlayOnlyMode}
          onToggleOverlay={handleToggleOverlay}
        />

        <ChatDialoguePanel
          isLogOpen={isLogOpen}
          messages={messages}
          characterInfo={characterInfo as ChatCharacterSummary | null}
          regexScripts={regexScripts}
          editTargetId={editTargetId}
          setEditTargetId={setEditTargetId}
          editContent={editContent}
          setEditContent={setEditContent}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
          assistantPagesForLatest={assistantPagesForLatest}
          assistantDialogPageIndex={assistantDialogPageIndex}
          setAssistantDialogPageIndex={setAssistantDialogPageIndex}
          viewMessageIndex={viewMessageIndex}
          setViewMessageIndex={setViewMessageIndex}
          onOpenLog={() => setIsLogOpen(true)}
        />

        {isLogOpen && (
          <ChatLogModal
            messages={messages}
            characterInfo={characterInfo as ChatCharacterSummary | null}
            regexScripts={regexScripts}
            editTargetId={editTargetId}
            setEditTargetId={setEditTargetId}
            editContent={editContent}
            setEditContent={setEditContent}
            onSaveEdit={handleSaveEdit}
            onDeleteMessage={handleDeleteMessage}
            onClose={() => setIsLogOpen(false)}
            bottomRef={bottomRef}
          />
        )}
      </div>

      <ChatInputBar
        chatInputRef={chatInputRef}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        isSending={isSending}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenModelModal={() => setShowModelModal(true)}
        onOpenAssetPicker={() => setIsAssetPickerOpen(!isAssetPickerOpen)}
        isAssetPickerOpen={isAssetPickerOpen}
        models={models}
        selectedModel={selectedModel}
      />

      {isAssetPickerOpen && characterInfo && (
        <div className="absolute bottom-[80px] left-4 right-4 max-w-4xl mx-auto z-[60]">
          <ChatAssetPicker
            assets={characterInfo.interfaceConfig?.assets || []}
            onSelect={(asset) => {
              const tag = asset.type === 'background' 
                ? `<img-src=${asset.id}:background>` 
                : asset.type === 'character' 
                  ? `<img-src=${asset.id}:character>` 
                  : `<img-src=${asset.id}:etc>`
              setInput((prev) => (prev ? `${prev} ${tag}` : tag))
              
              // 즉시 미리보기 반영
              if (asset.type === 'background') {
                setDisplayedImage(asset.url)
              }
            }}
            onClose={() => setIsAssetPickerOpen(false)}
          />
        </div>
      )}

      <ChatSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ChatModelModal
        open={showModelModal}
        onClose={() => setShowModelModal(false)}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        setSelectedProvider={setSelectedProvider}
        temperature={temperature}
        setTemperature={setTemperature}
        maxInputChars={maxInputChars}
        setMaxInputChars={setMaxInputChars}
        maxOutputChars={maxOutputChars}
        setMaxOutputChars={setMaxOutputChars}
      />

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
              activeRoomId={activeRoomId}
              onClose={() => setMenuOpen(false)}
              onSelectRoom={handleSelectRoom}
              onCreateRoom={handleCreateRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          </div>
        </>
      )}
    </div>
  )
}
