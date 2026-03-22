/** localStorage key for the list of characters (local-only). */
export const LOCAL_CHARACTERS_KEY = 'local-characters'

import { type InterfaceConfig } from './interfaceConfig'

export interface EmotionImageItem {
  id: string
  imageUrl: string
  label: string
}

export interface LocalCharacter {
  id: string
  name: string
  description: string
  personality: string
  situation: string
  firstLine?: string
  image_url?: string
  imageUrl?: string
  is_adult?: boolean
  isAdult?: boolean
  tags?: string[]
  user_name?: string
  userName?: string
  user_role?: string
  userRole?: string
  user_description?: string
  userDescription?: string
  world_setting?: string
  worldSetting?: string
  emotion_images?: EmotionImageItem[]
  emotionImages?: EmotionImageItem[]
  is_public?: boolean
  isPublic?: boolean
  details?: Record<string, unknown>
  interfaceConfig?: InterfaceConfig
  protagonist?: { name: string; description: string }[]
  supporting?: { name: string; description: string }[]
  created_at?: string
  createdAt?: string
}

export function getLocalCharacters(): LocalCharacter[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_CHARACTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isQuotaExceededError(e: unknown): boolean {
  const err = e as { name?: string; code?: number; message?: string }
  return (
    err?.name === 'QuotaExceededError' ||
    err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err?.code === 22 ||
    err?.code === 1014 ||
    (typeof err?.message === 'string' && /quota/i.test(err.message))
  )
}

export type LocalStorageWriteResult = { ok: true } | { ok: false; error: string }

export function setLocalCharacters(characters: LocalCharacter[]): LocalStorageWriteResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저 환경에서만 저장할 수 있습니다.' }
  }
  try {
    localStorage.setItem(LOCAL_CHARACTERS_KEY, JSON.stringify(characters))
    return { ok: true }
  } catch (e: unknown) {
    console.error('[setLocalCharacters]', e)
    return {
      ok: false,
      error: isQuotaExceededError(e)
        ? '저장 공간이 부족합니다. 캐릭터에 넣은 이미지(특히 업로드한 고해상도 파일)가 많으면 브라우저 localStorage 한도(대략 5MB 전후)를 넘을 수 있습니다. 이미지를 줄이거나 용량을 낮춘 뒤 다시 저장해 주세요.'
        : '캐릭터 목록을 저장하지 못했습니다.',
    }
  }
}

export function getLocalCharacter(id: string): LocalCharacter | null {
  return getLocalCharacters().find((c) => c.id === id) ?? null
}

export function saveLocalCharacter(character: LocalCharacter): LocalStorageWriteResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저에서만 저장할 수 있습니다.' }
  }
  try {
    const list = getLocalCharacters()
    const idx = list.findIndex((c) => c.id === character.id)
    if (idx >= 0) list[idx] = character
    else list.push(character)
    return setLocalCharacters(list)
  } catch (e: unknown) {
    console.error('[saveLocalCharacter]', e)
    return {
      ok: false,
      error: isQuotaExceededError(e)
        ? '저장 공간이 부족합니다. 이미지 에셋이 너무 크면 localStorage 한도를 넘을 수 있습니다. 이미지 수·해상도를 줄인 뒤 다시 시도해 주세요.'
        : '캐릭터 저장 중 오류가 발생했습니다.',
    }
  }
}

export function deleteLocalCharacter(id: string): void {
  setLocalCharacters(getLocalCharacters().filter((c) => c.id !== id))
}

// ==========================================
// VN Save & Load System
// ==========================================

export interface SaveSlot {
  slotIndex: number
  savedAt: string
  previewText: string
  messages: any[] // We use any[] here to avoid circular dependency with Message type in chat/[id].tsx, or we can just trust the shape.
}

export function getSaveSlots(characterId: string): SaveSlot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`save-${characterId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGameSlot(characterId: string, slotIndex: number, messages: any[], previewText: string): void {
  const slots = getSaveSlots(characterId)
  const existingIdx = slots.findIndex(s => s.slotIndex === slotIndex)
  
  const newSlot: SaveSlot = {
    slotIndex,
    savedAt: new Date().toISOString(),
    previewText,
    messages
  }

  if (existingIdx >= 0) {
    slots[existingIdx] = newSlot
  } else {
    slots.push(newSlot)
  }

  // Optional: sort by slot index
  slots.sort((a, b) => a.slotIndex - b.slotIndex)

  localStorage.setItem(`save-${characterId}`, JSON.stringify(slots))
}

export function loadGameSlot(characterId: string, slotIndex: number): SaveSlot | null {
  const slots = getSaveSlots(characterId)
  return slots.find(s => s.slotIndex === slotIndex) || null
}

export function deleteGameSlot(characterId: string, slotIndex: number): void {
  const slots = getSaveSlots(characterId)
  const filtered = slots.filter(s => s.slotIndex !== slotIndex)
  localStorage.setItem(`save-${characterId}`, JSON.stringify(filtered))
}

// ==========================================
// Chat Session History System
// ==========================================

export interface ChatSession {
  id: string          // uuid
  savedAt: string     // ISO 날짜
  previewText: string // 마지막 메시지 미리보기
  messageCount: number
  messages: any[]
}

export function getChatSessions(characterId: string): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`chat-sessions-${characterId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveChatSession(characterId: string, messages: any[]): ChatSession | null {
  if (typeof window === 'undefined') return null
  if (!messages || messages.length === 0) return null
  // 마지막 어시스턴트 혹은 마지막 메시지 기준 preview
  const lastMsg = [...messages].reverse().find(m => m.role === 'assistant') ?? messages[messages.length - 1]
  const preview = (lastMsg?.content ?? '')
    .replace(/<img=[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .trim()
    .slice(0, 60) || '(대화 내용 없음)'

  const session: ChatSession = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    previewText: preview,
    messageCount: messages.length,
    messages,
  }
  const sessions = getChatSessions(characterId)
  sessions.unshift(session) // 최신 순으로 앞에 추가
  // 최대 50개 유지
  if (sessions.length > 50) sessions.splice(50)
  localStorage.setItem(`chat-sessions-${characterId}`, JSON.stringify(sessions))
  return session
}

export function deleteChatSession(characterId: string, sessionId: string): void {
  if (typeof window === 'undefined') return
  const sessions = getChatSessions(characterId).filter(s => s.id !== sessionId)
  localStorage.setItem(`chat-sessions-${characterId}`, JSON.stringify(sessions))
}

