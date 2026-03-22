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

/** RisuAI Regex Script와 동일한 4종 수정 타입 */
export type RegexScriptType =
  | 'modify_input'
  | 'modify_output'
  | 'modify_request'
  | 'modify_display'

/** RisuAI 스타일: 정규식(IN)으로 매칭된 문자열을 replacement(OUT)로 치환 */
export interface RegexScriptEntry {
  id: string
  name: string
  scriptType: RegexScriptType
  /** IN: 정규식 패턴 */
  pattern: string
  /** OUT: 치환 문자열 ($1, $2 등 캡처 그룹 사용 가능) */
  replacement: string
  enabled: boolean
}

/** 시나리오·게임 규칙을 행 단위로 관리 (테이블 UI). 통합 텍스트는 dialogueScript에 동기화 */
export interface ScenarioRuleEntry {
  id: string
  name: string
  content: string
}

/** 추가 인터페이스: 화면 아이콘·오버레이 등 JSON 블록 (행 단위) */
export interface ExtraInterfaceEntry {
  id: string
  name: string
  /** 화면에 반영할 설정 JSON (아이콘, 위치, 스타일 등) */
  json: string
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
  /**
   * 백그라운드 임베딩: 대화 전송 시 시스템/백그라운드에 항상 합쳐지는 텍스트 (RisuAI Background embedding 개념)
   */
  backgroundEmbedding?: string
  /** RisuAI Regex Script와 같은 형식의 규칙 목록 (실제 적용은 /chat 등에서 수행) */
  regexScripts?: RegexScriptEntry[]
  /** 시나리오 및 게임 규칙 행 목록 */
  scenarioRules?: ScenarioRuleEntry[]
  /** 추가 인터페이스 설정 (JSON 행 목록) */
  extraInterfaceEntries?: ExtraInterfaceEntry[]
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
  } catch (e) {
    console.error('[saveCharacterDraft] localStorage 실패 (용량 초과 가능)', e)
  }
}

/** setState에서 병합한 전체 드래프트를 그대로 저장 (patch만 저장하면 상태와 어긋날 수 있음) */
export function persistCharacterDraft(draft: CharacterDraft): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHARACTER_DRAFT_KEY, JSON.stringify(draft))
  } catch (e) {
    console.error('[persistCharacterDraft] localStorage 실패 (용량 초과 가능)', e)
  }
}

