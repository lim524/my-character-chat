import { v4 as uuidv4 } from 'uuid'
import type { LocalCharacter } from './localStorage'
import type { LoreEntry, InterfaceConfig } from './interfaceConfig'
import { createInitialInterfaceConfig } from './interfaceEval'
import { normalizeLoreEntry } from './lorebookActivation'
import { sanitizeImportedInterfaceConfig } from './interfaceConfigSanitizer'
import { sanitizeGlobalUiLayer, type GlobalUiLayer } from './globalUiLayers'

/** 카드 JSON에서 표지/프로필 이미지 경로 또는 URL (상대 경로는 CharX에서 assets와 매칭). */
export function extractCoverImagePathFromCardJson(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  const raw = json as Record<string, unknown>
  const d = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>
  const ext = (d.extensions && typeof d.extensions === 'object' ? d.extensions : {}) as Record<string, unknown>
  const risuRaw = ext.risuai || ext.risu || ext.risuViewer
  const risu = (risuRaw && typeof risuRaw === 'object' ? risuRaw : {}) as Record<string, unknown>
  const mcc = (ext.my_character_chat || ext.mcc || {}) as Record<string, unknown>

  const candidates: unknown[] = [
    d.image,
    d.avatar,
    d.cover,
    d.character_avatar,
    d.char_avatar,
    risu.image,
    risu.cover,
    risu.avatar,
    risu.characterImage,
    mcc.coverImage,
    mcc.profileImage,
    mcc.image,
  ]
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

export interface ImportCardResult {
  character: LocalCharacter
  warnings: string[]
  /** `extensions.my_character_chat.globalUiLayers`가 있을 때만 (없으면 기존 앱 전역 설정 유지) */
  globalUiLayers?: GlobalUiLayer[]
}

/**
 * 캐릭터 카드 V2/V3 (SillyTavern / RisuAI) JSON 데이터를 앱 내부 LocalCharacter 형식으로 변환.
 */
export function importCardToLocalCharacter(json: unknown): ImportCardResult {
  const warnings: string[] = []
  if (!json || typeof json !== 'object') {
    throw new Error('올바른 JSON 데이터가 아닙니다.')
  }

  const raw = json as Record<string, unknown>
  const d = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>
  
  const character: LocalCharacter = {
    id: uuidv4(),
    name: String(d.name || d.char_name || '').trim() || '이름 없음',
    description: String(d.description || d.char_persona || '').trim(),
    personality: String(d.personality || '').trim(),
    situation: String(d.scenario || d.world_scenario || d.situation || '').trim(),
    firstLine: String(d.first_mes || d.mes_example || d.first_line || '').trim(),
    imageUrl: '', 
    userName: String(d.user_name || '').trim(),
    userRole: String(d.user_role || '').trim(),
    userDescription: String(d.user_description || '').trim(),
    worldSetting: String(d.world_scenario || d.world_setting || '').trim(),
    supporting: [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    isAdult: !!d.is_adult,
    isPublic: true,
    details: {},
    interfaceConfig: createInitialInterfaceConfig(),
  }

  // 확장 필드 (RisuAI / MCC 전용 설정 복원)
  const ext = (d.extensions && typeof d.extensions === 'object' ? d.extensions : {}) as Record<string, unknown>
  const mcc = (ext.my_character_chat || ext.mcc || {}) as Record<string, unknown>
  
  if (mcc.interfaceConfig && typeof mcc.interfaceConfig === 'object') {
    const sanitized = sanitizeImportedInterfaceConfig(mcc.interfaceConfig, warnings)
    character.interfaceConfig = { ...character.interfaceConfig, ...sanitized } as InterfaceConfig
  }
  if (mcc.details && typeof mcc.details === 'object') {
    character.details = { ...character.details, ...(mcc.details as Record<string, unknown>) }
  }

  let globalUiLayers: GlobalUiLayer[] | undefined
  if (Array.isArray(mcc.globalUiLayers)) {
    const layers: GlobalUiLayer[] = []
    for (const item of mcc.globalUiLayers) {
      const l = sanitizeGlobalUiLayer(item)
      if (l) layers.push(l)
    }
    globalUiLayers = layers
    if (layers.length > 0) {
      warnings.push(`카드에서 전역 인터페이스 레이어 ${layers.length}개를 불러왔습니다.`)
    } else {
      warnings.push('카드의 전역 인터페이스 목록이 비어 있어 앱 전역 설정을 비웁니다.')
    }
  }

  // Lore Entries (캐릭터 북)
  const cb = d.character_book as Record<string, unknown> | undefined
  if (cb && Array.isArray(cb.entries)) {
    const entries: LoreEntry[] = []
    for (const rawEnt of cb.entries) {
      const normalized = normalizeLoreEntry(rawEnt)
      if (normalized) entries.push(normalized)
    }
    if (entries.length > 0) {
      character.loreEntries = entries
    }
    warnings.push(`로어북(Character Book) 항목 ${entries.length}개를 가져왔습니다.`)
  }

  const coverPath = extractCoverImagePathFromCardJson(json)
  if (coverPath) {
    character.imageUrl = coverPath
    character.image_url = coverPath
  }

  return globalUiLayers !== undefined ? { character, warnings, globalUiLayers } : { character, warnings }
}

export type DownloadCharacterCardOptions = {
  /** 포함 시 `extensions.my_character_chat.globalUiLayers`로 저장 */
  globalUiLayers?: GlobalUiLayer[]
}

/**
 * 캐릭터를 V2 스펙의 JSON 카드 파일로 내려받기.
 */
export function downloadCharacterCardJson(
  character: LocalCharacter & { loreEntries?: LoreEntry[] },
  options?: DownloadCharacterCardOptions
): void {
  if (typeof window === 'undefined') return

  const mccPayload: Record<string, unknown> = {
    interfaceConfig: character.interfaceConfig,
    details: character.details,
  }
  if (options?.globalUiLayers !== undefined) {
    mccPayload.globalUiLayers = options.globalUiLayers
  }

  const data = {
    name: character.name,
    description: character.description,
    personality: character.personality,
    scenario: character.situation,
    first_mes: character.firstLine,
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    character_book: {
      name: character.name,
      description: 'Imported Lorebook',
      entries: character.loreEntries || [],
    },
    tags: character.tags || [],
    extensions: {
      my_character_chat: mccPayload,
    }
  }

  const v2Card = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data,
  }

  const blob = new Blob([JSON.stringify(v2Card, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${character.name || 'character'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
