/**
 * Character Card V2 / V3 호환 JSON ↔ LocalCharacter 매핑.
 * 앱 전용 데이터는 `data.extensions.my_character_chat` (v3) 또는 최상위 `my_character_chat` (v2 평면)에 둡니다.
 */

import type { InterfaceConfig, LoreEntry } from './interfaceConfig'
import type { LocalCharacter } from './localStorage'
import { v4 as uuidv4 } from 'uuid'

export const MMC_EXTENSION_ID = 'my_character_chat'

/** v3 `data` 안에 넣을 확장 페이로드 */
export type MyCharacterChatExtension = {
  version: 1
  /** LocalCharacter 중 카드 표준 필드에 없는 나머지 */
  payload: Record<string, unknown>
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

/** SillyTavern lorebook entry 형태 (일부 필드만 사용) */
type STBookEntry = {
  name?: string
  keys?: string
  content?: string
  extensions?: Record<string, unknown>
  enabled?: boolean
  insertion_order?: number
  priority?: number
  id?: number
  comment?: string
  selective?: boolean
  constant?: boolean
  position?: string
}

function loreToBookEntries(entries: LoreEntry[] | undefined): STBookEntry[] {
  if (!entries?.length) return []
  return entries.map((e) => ({
    name: e.name,
    keys: e.keys,
    content: e.prompt,
    enabled: true,
    insertion_order: e.order,
    constant: e.alwaysActive === true,
    selective: e.alwaysActive !== true,
    extensions: {
      mmc_id: e.id,
      mmc_multipleKeys: e.multipleKeys,
      mmc_useRegex: e.useRegex,
    },
  }))
}

function bookEntriesToLore(entries: unknown): LoreEntry[] {
  if (!Array.isArray(entries)) return []
  const out: LoreEntry[] = []
  for (const raw of entries) {
    if (!isRecord(raw)) continue
    const ext = (raw.extensions as Record<string, unknown> | undefined) ?? {}
    out.push({
      id: typeof ext.mmc_id === 'string' ? ext.mmc_id : uuidv4(),
      name: typeof raw.name === 'string' ? raw.name : '항목',
      keys: typeof raw.keys === 'string' ? raw.keys : '',
      order: typeof raw.insertion_order === 'number' ? raw.insertion_order : out.length,
      prompt: typeof raw.content === 'string' ? raw.content : '',
      alwaysActive: raw.constant === true,
      multipleKeys: ext.mmc_multipleKeys === true,
      useRegex: ext.mmc_useRegex === true,
    })
  }
  return out
}

function pickExtensionFromImported(data: Record<string, unknown>): MyCharacterChatExtension | null {
  const extRoot = data.extensions
  if (isRecord(extRoot)) {
    const mmc = extRoot[MMC_EXTENSION_ID]
    if (isRecord(mmc) && mmc.version === 1 && isRecord(mmc.payload)) {
      return mmc as unknown as MyCharacterChatExtension
    }
  }
  const flat = data[MMC_EXTENSION_ID]
  if (isRecord(flat) && flat.version === 1 && isRecord(flat.payload)) {
    return flat as unknown as MyCharacterChatExtension
  }
  return null
}

function stripUndefined<T extends Record<string, unknown>>(o: T): T {
  for (const k of Object.keys(o)) {
    if (o[k] === undefined) delete o[k]
  }
  return o
}

/**
 * LocalCharacter →보낼 카드 JSON (V3 스타일 권장).
 */
export function exportCharacterToCard(char: LocalCharacter): Record<string, unknown> {
  const situation = char.situation ?? ''
  const world = char.worldSetting ?? char.world_setting ?? ''
  const scenarioParts = [world && `【세계관】\n${world}`, situation && `【상황】\n${situation}`].filter(
    Boolean
  )
  const scenario = scenarioParts.join('\n\n') || situation

  const loreEntries =
    (char as LocalCharacter & { loreEntries?: LoreEntry[] }).loreEntries ?? []
  const character_book =
    loreEntries.length > 0
      ? {
          name: `${char.name ?? 'character'} lore`,
          description: '',
          scan_depth: 4,
          token_budget: 512,
          recursive_scanning: false,
          extensions: {},
          entries: loreToBookEntries(loreEntries),
        }
      : undefined

  const c = char as LocalCharacter & { loreEntries?: LoreEntry[] }

  const payload: Record<string, unknown> = {
    id: c.id,
    firstLine: c.firstLine,
    imageUrl: c.imageUrl ?? c.image_url,
    image_url: c.image_url ?? c.imageUrl,
    emotionImages: c.emotionImages ?? c.emotion_images,
    emotion_images: c.emotion_images ?? c.emotionImages,
    userName: c.userName ?? c.user_name,
    user_name: c.user_name ?? c.userName,
    userRole: c.userRole ?? c.user_role,
    user_role: c.user_role ?? c.userRole,
    userDescription: c.userDescription ?? c.user_description,
    user_description: c.user_description ?? c.userDescription,
    worldSetting: c.worldSetting ?? c.world_setting,
    world_setting: c.world_setting ?? c.worldSetting,
    supporting: c.supporting,
    protagonist: c.protagonist,
    isAdult: c.isAdult ?? c.is_adult,
    is_adult: c.is_adult ?? c.isAdult,
    isPublic: c.isPublic ?? c.is_public,
    is_public: c.is_public ?? c.isPublic,
    details: c.details ?? {},
    interfaceConfig: c.interfaceConfig,
    loreEntries: c.loreEntries ?? loreEntries,
  }

  stripUndefined(payload as Record<string, unknown>)

  const dataLayer: Record<string, unknown> = {
    name: c.name ?? 'Unnamed',
    description: c.description ?? '',
    personality: c.personality ?? '',
    scenario,
    first_mes: c.firstLine ?? '',
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: c.tags ?? [],
    creator: '',
    character_version: '1.0',
    extensions: {
      [MMC_EXTENSION_ID]: {
        version: 1,
        payload,
      } satisfies MyCharacterChatExtension,
    },
  }

  if (character_book) {
    dataLayer.character_book = character_book
  }

  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: dataLayer,
  }
}

export type ImportCardResult = {
  character: LocalCharacter
  warnings: string[]
}

/**
 * 카드 JSON → LocalCharacter (새 id 발급 가능).
 */
export function importCardToLocalCharacter(
  json: unknown,
  options?: { newId?: boolean }
): ImportCardResult {
  const warnings: string[] = []
  if (!isRecord(json)) {
    throw new Error('카드 JSON이 객체가 아닙니다.')
  }

  let data: Record<string, unknown> = json
  if (json.spec === 'chara_card_v3' && isRecord(json.data)) {
    data = json.data
  } else if (isRecord(json.data) && typeof (json.data as { name?: string }).name === 'string') {
    data = json.data as Record<string, unknown>
    warnings.push('spec 필드가 없어 data를 직접 읽었습니다.')
  }

  const name = String(data.name ?? 'Imported')
  const description = String(data.description ?? '')
  const personality = String(data.personality ?? '')
  const scenario = String(data.scenario ?? '')
  const first_mes = String(data.first_mes ?? '')

  const mmc = pickExtensionFromImported(data)

  const tags = Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : []

  let loreEntries: LoreEntry[] = []
  const cb = data.character_book
  if (isRecord(cb) && Array.isArray(cb.entries)) {
    loreEntries = bookEntriesToLore(cb.entries)
  }

  const baseFromMmc: Partial<LocalCharacter> = mmc
    ? (JSON.parse(JSON.stringify(mmc.payload)) as Partial<LocalCharacter>)
    : {}

  const id = options?.newId !== false ? uuidv4() : String(baseFromMmc.id ?? uuidv4())

  const interfaceConfig =
    (baseFromMmc.interfaceConfig as InterfaceConfig | undefined) ?? undefined

  const character: LocalCharacter = {
    id,
    name: baseFromMmc.name ?? name,
    description: baseFromMmc.description ?? description,
    personality: baseFromMmc.personality ?? personality,
    situation: baseFromMmc.situation ?? scenario,
    firstLine: baseFromMmc.firstLine ?? first_mes,
    tags: (baseFromMmc.tags as string[] | undefined) ?? tags,
    imageUrl: baseFromMmc.imageUrl ?? baseFromMmc.image_url,
    image_url: baseFromMmc.image_url ?? baseFromMmc.imageUrl,
    emotionImages: baseFromMmc.emotionImages ?? baseFromMmc.emotion_images,
    emotion_images: baseFromMmc.emotion_images ?? baseFromMmc.emotionImages,
    userName: baseFromMmc.userName ?? baseFromMmc.user_name,
    user_name: baseFromMmc.user_name ?? baseFromMmc.userName,
    userRole: baseFromMmc.userRole ?? baseFromMmc.user_role,
    user_role: baseFromMmc.user_role ?? baseFromMmc.userRole,
    userDescription: baseFromMmc.userDescription ?? baseFromMmc.user_description,
    user_description: baseFromMmc.user_description ?? baseFromMmc.userDescription,
    worldSetting: baseFromMmc.worldSetting ?? baseFromMmc.world_setting,
    world_setting: baseFromMmc.world_setting ?? baseFromMmc.worldSetting,
    isAdult: baseFromMmc.isAdult ?? baseFromMmc.is_adult ?? false,
    isPublic: baseFromMmc.isPublic ?? baseFromMmc.is_public ?? true,
    details: (baseFromMmc.details as Record<string, unknown> | undefined) ?? {},
    supporting: baseFromMmc.supporting ?? [],
    protagonist: baseFromMmc.protagonist ?? [],
    interfaceConfig,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const withLore = character as LocalCharacter & { loreEntries?: LoreEntry[] }
  const mergedLore = [...(baseFromMmc as { loreEntries?: LoreEntry[] }).loreEntries ?? [], ...loreEntries]
  if (mergedLore.length > 0) {
    withLore.loreEntries = mergedLore
  }

  if (!mmc) {
    warnings.push(
      '확장 필드(my_character_chat)가 없어 기본 카드 필드만 반영했습니다. interfaceConfig·에셋은 비어 있을 수 있습니다.'
    )
  }

  return { character: withLore, warnings }
}

export function downloadCharacterCardJson(char: LocalCharacter, filename?: string): void {
  const card = exportCharacterToCard(char)
  const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename ?? `${(char.name || 'character').replace(/[^\w\-가-힣]+/g, '_')}.card.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
