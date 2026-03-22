/**
 * 캐릭터 목록, 채팅 세션, 세이브 슬롯 등 로컬 전용 데이터.
 * 실제 저장은 `lib/idbKV.ts` IndexedDB 단일 object store에 문자열(JSON)로 보관합니다.
 */
export const LOCAL_CHARACTERS_KEY = 'local-characters'

import { type InterfaceConfig } from './interfaceConfig'
import { kvGet, kvSet } from './idbKV'

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

export async function getLocalCharacters(): Promise<LocalCharacter[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(LOCAL_CHARACTERS_KEY)
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

export async function setLocalCharacters(characters: LocalCharacter[]): Promise<LocalStorageWriteResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저 환경에서만 저장할 수 있습니다.' }
  }
  try {
    await kvSet(LOCAL_CHARACTERS_KEY, JSON.stringify(characters))
    return { ok: true }
  } catch (e: unknown) {
    console.error('[setLocalCharacters]', e)
    return {
      ok: false,
      error: isQuotaExceededError(e)
        ? '저장 공간이 부족합니다. 브라우저(IndexedDB) 할당 한도를 넘었을 수 있습니다. 이미지·대화 데이터를 줄인 뒤 다시 시도해 주세요.'
        : '캐릭터 목록을 저장하지 못했습니다.',
    }
  }
}

export async function getLocalCharacter(id: string): Promise<LocalCharacter | null> {
  const list = await getLocalCharacters()
  return list.find((c) => c.id === id) ?? null
}

export async function saveLocalCharacter(character: LocalCharacter): Promise<LocalStorageWriteResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저에서만 저장할 수 있습니다.' }
  }
  try {
    const list = await getLocalCharacters()
    const idx = list.findIndex((c) => c.id === character.id)
    if (idx >= 0) list[idx] = character
    else list.push(character)
    return setLocalCharacters(list)
  } catch (e: unknown) {
    console.error('[saveLocalCharacter]', e)
    return {
      ok: false,
      error: isQuotaExceededError(e)
        ? '저장 공간이 부족합니다. IndexedDB 한도를 넘었을 수 있습니다. 데이터를 줄인 뒤 다시 시도해 주세요.'
        : '캐릭터 저장 중 오류가 발생했습니다.',
    }
  }
}

export async function deleteLocalCharacter(id: string): Promise<void> {
  const list = await getLocalCharacters()
  await setLocalCharacters(list.filter((c) => c.id !== id))
}

// ==========================================
// VN Save & Load System
// ==========================================

export interface SaveSlot {
  slotIndex: number
  savedAt: string
  previewText: string
  messages: any[]
}

export async function getSaveSlots(characterId: string): Promise<SaveSlot[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(`save-${characterId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveGameSlot(
  characterId: string,
  slotIndex: number,
  messages: any[],
  previewText: string
): Promise<void> {
  const slots = await getSaveSlots(characterId)
  const existingIdx = slots.findIndex((s) => s.slotIndex === slotIndex)

  const newSlot: SaveSlot = {
    slotIndex,
    savedAt: new Date().toISOString(),
    previewText,
    messages,
  }

  if (existingIdx >= 0) {
    slots[existingIdx] = newSlot
  } else {
    slots.push(newSlot)
  }

  slots.sort((a, b) => a.slotIndex - b.slotIndex)
  await kvSet(`save-${characterId}`, JSON.stringify(slots))
}

export async function loadGameSlot(characterId: string, slotIndex: number): Promise<SaveSlot | null> {
  const slots = await getSaveSlots(characterId)
  return slots.find((s) => s.slotIndex === slotIndex) || null
}

export async function deleteGameSlot(characterId: string, slotIndex: number): Promise<void> {
  const slots = await getSaveSlots(characterId)
  const filtered = slots.filter((s) => s.slotIndex !== slotIndex)
  await kvSet(`save-${characterId}`, JSON.stringify(filtered))
}

// ==========================================
// Chat Session History System
// ==========================================

export interface ChatSession {
  id: string
  savedAt: string
  previewText: string
  messageCount: number
  messages: any[]
}

export async function getChatSessions(characterId: string): Promise<ChatSession[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(`chat-sessions-${characterId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveChatSession(characterId: string, messages: any[]): Promise<ChatSession | null> {
  if (typeof window === 'undefined') return null
  if (!messages || messages.length === 0) return null
  const lastMsg =
    [...messages].reverse().find((m) => m.role === 'assistant') ?? messages[messages.length - 1]
  const preview =
    (lastMsg?.content ?? '')
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
  const sessions = await getChatSessions(characterId)
  sessions.unshift(session)
  if (sessions.length > 50) sessions.splice(50)
  await kvSet(`chat-sessions-${characterId}`, JSON.stringify(sessions))
  return session
}

export async function deleteChatSession(characterId: string, sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return
  const sessions = (await getChatSessions(characterId)).filter((s) => s.id !== sessionId)
  await kvSet(`chat-sessions-${characterId}`, JSON.stringify(sessions))
}
