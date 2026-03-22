export type AssetType = 'background' | 'character' | 'ui'

export type AssetSourceType = 'upload' | 'url'

export interface AssetRef {
  id: string
  type: AssetType
  sourceType: AssetSourceType
  url: string
  label: string
}

export interface ScreenCharacter {
  slot: 'left' | 'center' | 'right'
  assetId: string
  expression?: string
}

export interface ScreenDialogue {
  speakerName: string
  text: string
}

export interface ScreenChoice {
  id: string
  label: string
}

export interface ScreenConfig {
  background?: string
  characters?: ScreenCharacter[]
  dialogue?: ScreenDialogue
  choices?: ScreenChoice[]
}

export type GameType = 'dating' | 'rpg' | 'vn' | 'custom'

export interface StatDefinition {
  name: string
  key: string
  min: number
  max: number
  initial: number
}

export interface SceneMeta {
  id: string
  label: string
}

export interface LoreEntry {
  id: string
  name: string
  keys: string
  order: number
  prompt: string
  alwaysActive: boolean
  multipleKeys: boolean
  useRegex: boolean
}

export interface UIBoxConfig {
  [key: string]: string | number | undefined
  backgroundColor?: string
  opacity?: number
  nameColor?: string
  textColor?: string
  borderRadius?: number
}

export interface InterfaceConfig {
  code: string
  assets: AssetRef[]
  layoutPreset: 'dating-sim-v1' | 'custom'
  lastParsedScreen?: ScreenConfig
  gameType?: GameType
  stats?: StatDefinition[]
  flags?: string[]
  scenes?: SceneMeta[]
  dialogueScript?: string
  dialogueScriptMode?: 'natural' | 'json' // To track which input mode is being used
  bgImagePrompt?: string
  charImagePrompt?: string
  uiTheme?: UIBoxConfig
}

export type CharacterDraft = {
  loreEntries?: LoreEntry[]
  name?: string
  description?: string
  firstLine?: string
  personality?: string
  situation?: string
  worldSetting?: string
  isPublic?: boolean
  tags?: string[]
  userName?: string
  userDescription?: string
  protagonist?: { name: string; description: string }[]
  supporting?: { name: string; description: string }[]
  isAdult?: boolean
  details?: any
  interfaceConfig?: InterfaceConfig
  [key: string]: any
}

export const CHARACTER_DRAFT_KEY = 'character-draft'

export function loadCharacterDraft(): CharacterDraft {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CHARACTER_DRAFT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CharacterDraft
  } catch {
    return {}
  }
}

export function saveCharacterDraft(patch: Partial<CharacterDraft>): void {
  if (typeof window === 'undefined') return
  try {
    const current = loadCharacterDraft()
    const next: CharacterDraft = { ...current, ...patch }
    window.localStorage.setItem(CHARACTER_DRAFT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

