/**
 * 캐릭터별 다중 채팅방 관리 시스템.
 * 각 채팅방은 고유 ID, 이름, 생성일자를 가지며,
 * 대화 기록은 채팅방 단위로 저장/불러오기됩니다.
 */
import { kvGet, kvRemove, kvSet } from './idbKV'
import type { ChatMessage } from '@/components/chat/types'

export interface ChatRoom {
  id: string
  name: string
  createdAt: string
  lastUsedAt?: string
}

/** 키 형식: chatrooms-{characterId} */
function roomsKey(characterId: string) {
  return `chatrooms-${characterId}`
}

/** 키 형식: chatroom-msg-{characterId}-{roomId} */
function roomMessagesKey(characterId: string, roomId: string) {
  return `chatroom-msg-${characterId}-${roomId}`
}

/** 채팅방별 게임 변수 (동적 상태) */
function roomGameVariablesKey(characterId: string, roomId: string) {
  return `chatroom-gamevars-${characterId}-${roomId}`
}

/** 해당 캐릭터의 모든 채팅방 목록 조회 */
export async function getChatRooms(characterId: string): Promise<ChatRoom[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(roomsKey(characterId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((room) => room && typeof room.id === 'string' && typeof room.name === 'string')
      .map((room) => {
        const createdAt =
          typeof room.createdAt === 'string' && room.createdAt ? room.createdAt : new Date().toISOString()
        const lastUsedAt =
          typeof room.lastUsedAt === 'string' && room.lastUsedAt ? room.lastUsedAt : createdAt
        return { id: room.id, name: room.name, createdAt, lastUsedAt } as ChatRoom
      })
  } catch {
    return []
  }
}

/** 채팅방 목록 저장 */
async function saveChatRoomList(characterId: string, rooms: ChatRoom[]): Promise<void> {
  await kvSet(roomsKey(characterId), JSON.stringify(rooms))
}

/** 새 채팅방 생성. 생성된 방 객체를 반환. */
export async function createChatRoom(characterId: string, name?: string): Promise<ChatRoom> {
  const rooms = await getChatRooms(characterId)
  const nextNum = rooms.length + 1
  const room: ChatRoom = {
    id: crypto.randomUUID(),
    name: name || `Chat ${nextNum}`,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  }
  rooms.push(room)
  await saveChatRoomList(characterId, rooms)
  return room
}

/** 채팅방 이름 변경 */
export async function renameChatRoom(
  characterId: string,
  roomId: string,
  newName: string
): Promise<void> {
  const rooms = await getChatRooms(characterId)
  const room = rooms.find((r) => r.id === roomId)
  if (room) {
    room.name = newName
    await saveChatRoomList(characterId, rooms)
  }
}

/** 채팅방 삭제 (대화 기록도 함께 삭제) */
export async function deleteChatRoom(characterId: string, roomId: string): Promise<void> {
  const rooms = await getChatRooms(characterId)
  const filtered = rooms.filter((r) => r.id !== roomId)
  await saveChatRoomList(characterId, filtered)
  // 해당 방의 대화 기록도 삭제
  try {
    await kvSet(roomMessagesKey(characterId, roomId), '')
  } catch {
    // ignore
  }
  try {
    await kvRemove(roomGameVariablesKey(characterId, roomId))
  } catch {
    // ignore
  }
}

/** 특정 채팅방의 대화 기록 불러오기 */
export async function getChatRoomMessages(
  characterId: string,
  roomId: string
): Promise<ChatMessage[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(roomMessagesKey(characterId, roomId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 특정 채팅방에 대화 기록 저장 */
export async function saveChatRoomMessages(
  characterId: string,
  roomId: string,
  messages: ChatMessage[]
): Promise<void> {
  const key = roomMessagesKey(characterId, roomId)
  const payload = JSON.stringify(messages)
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await kvSet(key, payload)
      return
    } catch (e) {
      lastError = e
    }
  }
  console.error('[chatRooms] 메시지 저장 실패', { characterId, roomId, lastError })
  throw (lastError instanceof Error ? lastError : new Error('chatroom save failed'))
}

/**
 * 마지막으로 사용한 채팅방 ID를 저장/불러오기.
 * 다시 채팅 페이지에 접속했을 때 마지막 방을 자동으로 열기 위해 사용.
 */
export async function getLastActiveRoomId(characterId: string): Promise<string | null> {
  try {
    return (await kvGet(`last-room-${characterId}`)) || null
  } catch {
    return null
  }
}

export async function setLastActiveRoomId(characterId: string, roomId: string): Promise<void> {
  await kvSet(`last-room-${characterId}`, roomId)
}

export async function touchChatRoom(characterId: string, roomId: string): Promise<void> {
  const rooms = await getChatRooms(characterId)
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return
  room.lastUsedAt = new Date().toISOString()
  await saveChatRoomList(characterId, rooms)
}

export async function getMostRecentlyUsedRoomId(characterId: string): Promise<string | null> {
  const rooms = await getChatRooms(characterId)
  if (rooms.length === 0) return null
  const sorted = [...rooms].sort((a, b) => {
    const aLast = Date.parse(a.lastUsedAt || a.createdAt)
    const bLast = Date.parse(b.lastUsedAt || b.createdAt)
    if (aLast !== bLast) return bLast - aLast
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
  return sorted[0]?.id ?? null
}

export async function getChatRoomGameVariables(
  characterId: string,
  roomId: string
): Promise<Record<string, string | number | boolean>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = await kvGet(roomGameVariablesKey(characterId, roomId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string | number | boolean> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export async function setChatRoomGameVariables(
  characterId: string,
  roomId: string,
  state: Record<string, string | number | boolean>
): Promise<void> {
  await kvSet(roomGameVariablesKey(characterId, roomId), JSON.stringify(state))
}
