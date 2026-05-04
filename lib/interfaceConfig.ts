import { kvGet, kvSet } from './idbKV'
import type { EmotionImageItem } from './localStorage'
import type { GlobalUiLayer } from './globalUiLayers'

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

/** 로어북 한 줄: 키가 최근 대화에 있으면 prompt 삽입 (항상 활성은 키 불필요) */
export interface LoreEntry {
  id: string
  name: string
  keys: string
  order: number
  prompt: string
  alwaysActive: boolean
  multipleKeys: boolean
  useRegex: boolean
  /**
   * SillyTavern / Risu `selective`: true면 `keys`(1차)와 `secondaryKeys`(2차)가 **모두** 매칭될 때만 활성.
   * Risu 카드는 1·2차를 OR로 합치면 안 됨.
   */
  selective?: boolean
  /** selective 전용 2차 키 (쉼표·줄바꿈으로 여러 개) */
  secondaryKeys?: string
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

/** 채팅에서 갱신되는 게임 상태 변수 — AI `[game_state]{...}[/game_state]` 와 전역 UI `{{key}}` 연동 */
export interface GameVariableDefinition {
  id: string
  /** 영문 식별자 — AI JSON 키·플레이스홀더에 사용 ([a-zA-Z_][a-zA-Z0-9_]*) */
  key: string
  label: string
  type: 'string' | 'number' | 'boolean'
  /** 타입에 맞게 문자열로 저장(숫자·불리언도 입력칸은 문자열) */
  defaultValue: string
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
  /**
   * 채팅방 스탠딩 캐릭터를 화면 아래에서 위로 올리는 거리(px).
   * 0이면 기본(대화창 바로 위), 값을 키울수록 대화창·하단에서 더 위로 배치됩니다.
   */
  characterSpriteLiftPx?: number
  /** 사용자가 직접 작성한 전역 CSS 코드 (@keyframes 등 포함) */
  customCSS?: string
  /** 동적 게임 변수 정의 — 채팅방별 값은 IndexedDB에 별도 저장 */
  gameVariables?: GameVariableDefinition[]
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
  id?: string
  imageUrl?: string
  emotionImages?: EmotionImageItem[]
  is_public?: boolean
  is_adult?: boolean
  image_url?: string
  emotion_images?: EmotionImageItem[]
  user_name?: string
  user_role?: string
  user_description?: string
  world_scenario?: string
  world_setting?: string
  details?: unknown
  interfaceConfig?: InterfaceConfig
  /** 생성 화면 전용 — IndexedDB 앱 전역 설정과 별도로 드래프트에만 보관 (새 캐릭터 시 이전 인터페이스 유물 방지) */
  globalUiLayers?: GlobalUiLayer[]
  [key: string]: unknown
}

export const CHARACTER_DRAFT_KEY = 'character-draft'

export async function loadCharacterDraft(): Promise<CharacterDraft> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = await kvGet(CHARACTER_DRAFT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CharacterDraft
  } catch {
    return {}
  }
}

export async function saveCharacterDraft(patch: Partial<CharacterDraft>): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const current = await loadCharacterDraft()
    const next: CharacterDraft = { ...current, ...patch }
    await kvSet(CHARACTER_DRAFT_KEY, JSON.stringify(next))
  } catch (e) {
    console.error('[saveCharacterDraft] IndexedDB 저장 실패 (용량 초과 가능)', e)
  }
}

/** setState에서 병합한 전체 드래프트를 그대로 저장 (patch만 저장하면 상태와 어긋날 수 있음) */
export async function persistCharacterDraft(draft: CharacterDraft): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await kvSet(CHARACTER_DRAFT_KEY, JSON.stringify(draft))
  } catch (e) {
    console.error('[persistCharacterDraft] IndexedDB 저장 실패 (용량 초과 가능)', e)
  }
}

