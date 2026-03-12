/** localStorage key for the list of characters (local-only). */
export const LOCAL_CHARACTERS_KEY = 'local-characters'

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

export function setLocalCharacters(characters: LocalCharacter[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_CHARACTERS_KEY, JSON.stringify(characters))
}

export function getLocalCharacter(id: string): LocalCharacter | null {
  return getLocalCharacters().find((c) => c.id === id) ?? null
}

export function saveLocalCharacter(character: LocalCharacter): void {
  const list = getLocalCharacters()
  const idx = list.findIndex((c) => c.id === character.id)
  if (idx >= 0) list[idx] = character
  else list.push(character)
  setLocalCharacters(list)
}

export function deleteLocalCharacter(id: string): void {
  setLocalCharacters(getLocalCharacters().filter((c) => c.id !== id))
}
