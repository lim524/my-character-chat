import { v4 as uuidv4 } from 'uuid'
import type { PromptBundle, ModuleBundle } from './appSettings'
import type { LoreEntry } from './interfaceConfig'
import JSZip from 'jszip'

export function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

/** ST는 `keys` 문자열, Risu v2/v3 export는 `keys`를 문자열 배열로 둠 */
export function keyTokensFromUnknown(raw: unknown): string[] {
  if (typeof raw === 'string') {
    return raw
      .split(/[,，\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (Array.isArray(raw)) {
    const out: string[] = []
    for (const x of raw) {
      if (typeof x === 'string' && x.trim()) out.push(x.trim())
    }
    return out
  }
  return []
}

/**
 * ST/Risu character_book entry → 앱 LoreEntry용 키 필드.
 */
export function mergedKeysFromStBook(raw: Record<string, unknown>): {
  keys: string
  secondaryKeys: string
  selective: boolean
  multipleKeys: boolean
} {
  const ext = (raw.extensions as Record<string, unknown> | undefined) ?? {}
  const primary = keyTokensFromUnknown(raw.keys)
  const secondary: string[] = []
  const sk = raw.secondary_keys
  if (Array.isArray(sk)) {
    for (const x of sk) {
      if (typeof x === 'string' && x.trim()) secondary.push(x.trim())
    }
  } else if (typeof sk === 'string' && sk.trim()) {
    secondary.push(...sk.split(/[,，\n\r]+/).map((s) => s.trim()).filter(Boolean))
  }
  
  // MMC custom field support
  if (typeof ext.mmc_secondaryKeys === 'string' && ext.mmc_secondaryKeys.trim()) {
    secondary.push(...ext.mmc_secondaryKeys.split(/[,，\n\r]+/).map((s) => s.trim()).filter(Boolean))
  }

  const selective = raw.selective === true && secondary.length > 0
  if (selective) {
    const uniqP = [...new Set(primary)]
    const uniqS = [...new Set(secondary)]
    return {
      keys: uniqP.join(', '),
      secondaryKeys: uniqS.join(', '),
      selective: true,
      multipleKeys: ext.mmc_multipleKeys === true || uniqP.length > 1 || uniqS.length > 1,
    }
  }

  const uniq = [...new Set([...primary, ...secondary])]
  const keys = uniq.join(', ')
  return {
    keys,
    secondaryKeys: '',
    selective: false,
    multipleKeys: ext.mmc_multipleKeys === true || uniq.length > 1,
  }
}

export function bookEntriesToLore(entries: unknown): LoreEntry[] {
  if (!Array.isArray(entries)) return []
  const out: LoreEntry[] = []
  for (const raw of entries) {
    if (!isRecord(raw)) continue
    if (raw.enabled === false) continue
    const ext = (raw.extensions as Record<string, unknown> | undefined) ?? {}
    const { keys, secondaryKeys, selective, multipleKeys } = mergedKeysFromStBook(raw)
    const prompt =
      typeof raw.content === 'string'
        ? raw.content
        : typeof raw.entry === 'string'
          ? raw.entry
          : typeof raw.text === 'string'
            ? raw.text
            : ''
    if (!prompt.trim()) continue
    const displayName =
      (typeof raw.name === 'string' && raw.name.trim()) ||
      (typeof raw.comment === 'string' && raw.comment.trim()) ||
      '항목'
    
    out.push({
      id: typeof ext.mmc_id === 'string' ? ext.mmc_id : uuidv4(),
      name: displayName,
      keys,
      order: typeof raw.insertion_order === 'number' ? raw.insertion_order : out.length,
      prompt,
      alwaysActive: raw.constant === true,
      multipleKeys: ext.mmc_multipleKeys === true || multipleKeys,
      useRegex: raw.use_regex === true || ext.mmc_useRegex === true,
      ...(selective ? { selective: true as const, secondaryKeys } : {}),
    })
  }
  return out
}

/**
 * 외부 JSON 데이터를 분석하여 LoreEntry[]로 변환 시도.
 * RisuAI (v2/v3), SillyTavern, 또는 단순 배열 지원.
 */
export function parseExternalLoreEntries(json: unknown): LoreEntry[] {
  if (Array.isArray(json)) {
    // 이미 LoreEntry 형태거나 유사한 배열인 경우
    return bookEntriesToLore(json)
  }
  if (!isRecord(json)) return []

  // RisuAI / SillyTavern character_book
  const j = json as Record<string, unknown>
  const entries = j.entries || (isRecord(j.character_book) && j.character_book.entries)
  if (Array.isArray(entries)) {
    return bookEntriesToLore(entries)
  }

  // 단일 항목인 경우
  const single = bookEntriesToLore([json])
  return single
}

/**
 * 텍스트 파일을 분석하여 LoreEntry[]로 변환.
 * 이중 개행으로 한 항목씩 구분하거나 파일 전체를 한 항목으로 취급.
 */
export function parseTextToLoreEntries(text: string, fileName?: string): LoreEntry[] {
  const content = text.trim()
  if (!content) return []

  // 규칙: 이중 개행(\n\n)이 있으면 여러 항목으로 분리 시도
  const chunks = content.split(/\n\s*\n/).filter((s) => s.trim())
  
  if (chunks.length > 1) {
    return chunks.map((chunk, i) => ({
      id: uuidv4(),
      name: `${fileName?.replace(/\.[^/.]+$/, '') || 'Imported'} #${i + 1}`,
      keys: '',
      order: 100 + i,
      prompt: chunk.trim(),
      alwaysActive: true,
      multipleKeys: false,
      useRegex: false,
    }))
  }

  return [{
    id: uuidv4(),
    name: fileName?.replace(/\.[^/.]+$/, '') || 'Imported Lore',
    keys: '',
    order: 100,
    prompt: content,
    alwaysActive: true,
    multipleKeys: false,
    useRegex: false,
  }]
}

/**
 * 외부 데이터를 분석하여 RegexScriptEntry[]로 변환.
 * RisuAI의 regex_scripts 또는 단순 배열 지원.
 */
export function parseExternalRegexScripts(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json.filter(isRecord)
  if (!isRecord(json)) return []

  // RisuAI 포맷
  const j = json as Record<string, unknown>
  const scripts = j.regex_scripts || j.scripts
  if (Array.isArray(scripts)) return scripts.filter(isRecord) as Record<string, unknown>[]

  return []
}

/**
 * 외부 JSON 데이터를 분석하여 PromptBundle로 변환 시도.
 */
export function parseExternalPromptBundle(json: unknown, fileName?: string): PromptBundle | null {
  if (!isRecord(json)) return null

  // RisuAI / SillyTavern 프롬프트 프리셋 감지
  const j = json as Record<string, unknown>
  const main = j.global_prompt || j.system_prompt || j.main_prompt || j.prompt
  const jb = j.jailbreak_prompt || j.jailbreak
  const append = j.post_history_instructions || j.system_prompt_prefix

  if (main || jb || append) {
    return {
      id: uuidv4(),
      name: String(j.preset_name || j.name || fileName?.replace(/\.[^/.]+$/, '') || 'Imported Prompt'),
      description: String(j.description || '외부 포맷에서 가져온 프롬프트입니다.'),
      enabled: true,
      mainPrompt: typeof main === 'string' ? main : '',
      characterPrompt: '',
      jailbreakPrompt: typeof jb === 'string' ? jb : '',
      systemPromptAppend: typeof append === 'string' ? append : '',
    }
  }

  return null
}

/**
 * 외부 JSON 데이터를 분석하여 ModuleBundle로 변환 시도.
 */
export function parseExternalModuleBundle(json: unknown, fileName?: string): ModuleBundle | null {
  if (!isRecord(json)) return null

  // 캐릭터 북 (entries 배열이 있는 경우)
  const j = json as Record<string, unknown>
  const entriesRaw = j.entries || (isRecord(j.character_book) && j.character_book.entries)
  if (Array.isArray(entriesRaw)) {
    const entries = bookEntriesToLore(entriesRaw)
    if (entries.length > 0) {
      return {
        id: uuidv4(),
        name: String(j.name || fileName?.replace(/\.[^/.]+$/, '') || 'Imported Book'),
        description: String(j.description || '외부 포맷에서 가져온 로어북입니다.'),
        enabled: true,
        lorebook: {
          enabled: true,
          entries: entries as LoreEntry[],
        },
        regex: { enabled: false, rules: [] },
        assets: { enabled: false, items: [] },
      }
    }
  }

  return null
}

/**
 * ZIP 또는 .charx 파일을 분석하여 여러 번들(프롬프트 또는 모듈)을 추출 시도.
 */
export async function parseZipToBundles(file: File): Promise<{ prompts: PromptBundle[], modules: ModuleBundle[] }> {
  const prompts: PromptBundle[] = []
  const modules: ModuleBundle[] = []
  
  try {
    const zip = await JSZip.loadAsync(file)
    
    for (const [path, zipFile] of Object.entries(zip.files)) {
      if (zipFile.dir) continue
      
      // JSON 파일만 분석 (필요시 .txt 도 추가 가능)
      if (path.endsWith('.json')) {
        const text = await zipFile.async('text')
        try {
          const json = JSON.parse(text)
          
          // 1. 프롬프트 프리셋 확인
          const p = parseExternalPromptBundle(json, path)
          if (p) prompts.push(p)
          
          // 2. 모듈/로어북 확인
          const m = parseExternalModuleBundle(json, path)
          if (m) modules.push(m)
          
        } catch (e) {
          console.warn(`Failed to parse JSON in zip: ${path}`, e)
        }
      }
    }
  } catch (err) {
    console.error('Error reading zip/charx file:', err)
  }
  
  return { prompts, modules }
}
