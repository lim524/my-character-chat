/**
 * 캐릭터 목록, 채팅 세션, 세이브 슬롯 등 로컬 전용 데이터.
 * 실제 저장은 `lib/idbKV.ts` IndexedDB 단일 object store에 문자열(JSON)로 보관합니다.
 */
export const LOCAL_CHARACTERS_KEY = 'local-characters'

import { type InterfaceConfig, type LoreEntry } from './interfaceConfig'
import type { GlobalUiLayer } from './globalUiLayers'
import type { ChatMessage } from '@/components/chat/types'
import {
  characterHasInlineDataUrls,
  extractCharacterBlobsForStorage,
  hydrateCharacterBlobs,
  removeAllBlobsForCharacter,
} from './characterBlobStorage'
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
  /** 캐릭터 로어북 (저장 시 draft와 함께 보관) */
  loreEntries?: LoreEntry[]
  /** 채팅 전역 UI 레이어 — 저장된 경우 채팅에서 앱 전역 설정보다 우선 */
  globalUiLayers?: GlobalUiLayer[]
  protagonist?: { name: string; description: string }[]
  supporting?: { name: string; description: string }[]
  created_at?: string
  createdAt?: string
}

/** IDB에 저장되는 형태(블롭은 ref 문자열). 마이그레이션 후 persist. */
async function readCharacterListStored(): Promise<LocalCharacter[]> {
  const raw = await kvGet(LOCAL_CHARACTERS_KEY)
  if (!raw) return []
  let list: LocalCharacter[] = []
  try {
    const parsed = JSON.parse(raw)
    list = Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
  let changed = false
  for (let i = 0; i < list.length; i++) {
    if (characterHasInlineDataUrls(list[i])) {
      list[i] = await extractCharacterBlobsForStorage(list[i])
      changed = true
    }
  }
  if (changed) {
    try {
      await kvSet(LOCAL_CHARACTERS_KEY, JSON.stringify(list))
    } catch (e) {
      console.error('[readCharacterListStored] 마이그레이션 저장 실패', e)
    }
  }
  return list
}

async function readStoredCharacterById(id: string): Promise<LocalCharacter | null> {
  const list = await readCharacterListStored()
  return list.find((c) => c.id === id) ?? null
}

/** UI·채팅용: 인라인 data URL로 복원 */
export async function getLocalCharacters(): Promise<LocalCharacter[]> {
  if (typeof window === 'undefined') return []
  try {
    const list = await readCharacterListStored()
    return Promise.all(list.map((c) => hydrateCharacterBlobs(c)))
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
    const stored = await Promise.all(characters.map((c) => extractCharacterBlobsForStorage(c)))
    await kvSet(LOCAL_CHARACTERS_KEY, JSON.stringify(stored))
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
  if (typeof window === 'undefined') return null
  try {
    const stored = await readStoredCharacterById(id)
    if (!stored) return null
    return await hydrateCharacterBlobs(stored)
  } catch {
    return null
  }
}

export async function saveLocalCharacter(character: LocalCharacter): Promise<LocalStorageWriteResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저에서만 저장할 수 있습니다.' }
  }
  try {
    const extracted = await extractCharacterBlobsForStorage(character)
    const list = await readCharacterListStored()
    const idx = list.findIndex((c) => c.id === extracted.id)
    if (idx >= 0) list[idx] = extracted
    else list.push(extracted)
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
  const list = await readCharacterListStored()
  await setLocalCharacters(list.filter((c) => c.id !== id))
  await removeAllBlobsForCharacter(id)
}

// ==========================================
// VN Save & Load System
// ==========================================

export interface SaveSlot {
  slotIndex: number
  savedAt: string
  previewText: string
  messages: ChatMessage[]
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
  messages: ChatMessage[],
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
  messages: ChatMessage[]
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

export async function saveChatSession(characterId: string, messages: ChatMessage[]): Promise<ChatSession | null> {
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
