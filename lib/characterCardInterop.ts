import { v4 as uuidv4 } from 'uuid'
import type { LocalCharacter } from './localStorage'
import type { LoreEntry, InterfaceConfig } from './interfaceConfig'
import { createInitialInterfaceConfig } from './interfaceEval'
import { normalizeLoreEntry } from './lorebookActivation'

export interface ImportCardResult {
  character: LocalCharacter
  warnings: string[]
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
    character.interfaceConfig = { ...character.interfaceConfig, ...(mcc.interfaceConfig as object) } as InterfaceConfig
  }
  if (mcc.details && typeof mcc.details === 'object') {
    character.details = { ...character.details, ...(mcc.details as Record<string, unknown>) }
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

  return { character, warnings }
}

/**
 * 캐릭터를 V2 스펙의 JSON 카드 파일로 내려받기.
 */
export function downloadCharacterCardJson(character: LocalCharacter & { loreEntries?: LoreEntry[] }): void {
  if (typeof window === 'undefined') return

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
      my_character_chat: {
        interfaceConfig: character.interfaceConfig,
        details: character.details,
      }
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
