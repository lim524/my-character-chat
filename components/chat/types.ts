import type { ReactNode } from 'react'
import type { InterfaceConfig, LoreEntry } from '@/lib/interfaceConfig'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  created_at?: string
}

/** Header / UI용 최소 캐릭터 정보 (페이지의 Character와 호환) */
export type ChatCharacterSummary = {
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
  interfaceConfig?: InterfaceConfig
  loreEntries?: LoreEntry[]
  worldSetting?: string
  supporting?: { name: string; description: string }[]
  tags?: string[]
  isAdult?: boolean
  isPublic?: boolean
}

export type ChatModelItem = {
  id: string
  provider: string
  label: string
  description?: string
  icon?: ReactNode
}
