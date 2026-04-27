import { v4 as uuidv4 } from 'uuid'
import type { PromptBundle, ModuleBundle } from './appSettings'
import type { LoreEntry } from './interfaceConfig'
import JSZip from 'jszip'

const RISU_RPACK_MAP_BASE64 =
  'xA0eC70rP1X8RW71ZlNPGuC7MJSGumu/QVBvm+/etxBhFyDfMomonW2ryZAADF2v0sFW5RZkkYJldJfKI9ZS0f+0oOgvilg4WmAZlknb18g7PkNLpWNHqmopkvQVz2I0eNMdPOIFjipXDhvNTC3yQCwleUgPsnq1p2w35px7VH7+h9yaAuQzouuxLgPdmaaw59WIGIN89r7hXJ/DIUYfCE7QdhJf7v2PROqjXosoCTWeacwKx4UHrUrzd+ln1NqEgJO2TXP6JyZ/BMb78XI5UcI2qWis+O3FucvOdaQ9gdlCcByVEbzYjJj5WaET9xR9s+xxwOON8AGuWzEGJCI6uCz3hIvJZfu2n66zAy0BaXQf5KPs7lw0IZNKD2riYgKeIpz9PPxxx8atWWcFcG2KRBL6JIZfr9F6R87+UGPdUQZvGOBSqAmdVnNMuFNsw6AOGc8+DX4HMmhG6kj5mS6rpEkgXlU1OAy807FYFnkoChrh8s3EOduiumBydn2V73/IwN43lL+1FIGSJUWs5/Vmpys2WsET40s66I2DG3wnsJpC64eq3FSOeCbSVynUt/gvj4l18EF3wh7/2BUR5QSXF/Mx0JsA18q0Tyo72bJr2l2hPzBhvZE9Tubfvk2CjB0jEJhk9IUze5BDu6mI8dalHPbMbrlbC5bt1enFywimgEA='

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

const RISU_RPACK_DECODE_MAP = base64ToBytes(RISU_RPACK_MAP_BASE64).slice(256, 512)

function decodeRPack(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = RISU_RPACK_DECODE_MAP[data[i]]
  return out
}

function parseRisuModuleLorebook(raw: unknown): LoreEntry[] {
  if (!Array.isArray(raw)) return []
  const out: LoreEntry[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    if (item.mode === 'folder') continue
    const prompt = typeof item.content === 'string' ? item.content.trim() : ''
    if (!prompt) continue
    const keys = typeof item.key === 'string' ? item.key : ''
    const secondaryKeys = typeof item.secondkey === 'string' ? item.secondkey : ''
    const selective = item.selective === true && secondaryKeys.trim().length > 0
    out.push({
      id: uuidv4(),
      name:
        (typeof item.comment === 'string' && item.comment.trim()) ||
        (typeof item.name === 'string' && item.name.trim()) ||
        '항목',
      keys,
      order: typeof item.insertorder === 'number' ? item.insertorder : out.length,
      prompt,
      alwaysActive: item.alwaysActive === true,
      multipleKeys: keyTokensFromUnknown(keys).length > 1 || keyTokensFromUnknown(secondaryKeys).length > 1,
      useRegex: false,
      ...(selective ? { selective: true as const, secondaryKeys } : {}),
    })
  }
  return out
}

function parseRisuModuleRegex(raw: unknown): { id: string; pattern: string; replace: string; flags: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { id: string; pattern: string; replace: string; flags: string }[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const pattern = typeof item.in === 'string' ? item.in : ''
    if (!pattern) continue
    out.push({
      id: uuidv4(),
      pattern,
      replace: typeof item.out === 'string' ? item.out : '',
      flags:
        item.ableFlag === true && typeof item.flag === 'string' && item.flag.trim()
          ? item.flag.trim()
          : 'g',
    })
  }
  return out
}

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

  const j = json as Record<string, unknown>

  // Risu native module JSON wrapper: { type: 'risuModule', module: {...} }
  if (j.type === 'risuModule' && isRecord(j.module)) {
    const m = j.module as Record<string, unknown>
    const loreEntries = parseRisuModuleLorebook(m.lorebook)
    const regexRules = parseRisuModuleRegex(m.regex)
    if (
      loreEntries.length > 0 ||
      regexRules.length > 0 ||
      typeof m.customModuleToggle === 'string' ||
      typeof m.backgroundEmbedding === 'string'
    ) {
      return {
        id: uuidv4(),
        name: String(m.name || fileName?.replace(/\.[^/.]+$/, '') || 'Imported Risu Module'),
        description: String(m.description || 'Risu module에서 가져온 모듈입니다.'),
        enabled: true,
        lorebook: { enabled: loreEntries.length > 0, entries: loreEntries },
        regex: { enabled: regexRules.length > 0, rules: regexRules },
        assets: { enabled: false, items: [] },
        customModuleToggle: typeof m.customModuleToggle === 'string' ? m.customModuleToggle : '',
        toggleState: {},
        backgroundEmbedding: typeof m.backgroundEmbedding === 'string' ? m.backgroundEmbedding : '',
      }
    }
  }
  
  // 1. 로어북 추출
  const entriesRaw = j.entries || (isRecord(j.character_book) && j.character_book.entries)
  const entries = Array.isArray(entriesRaw) ? bookEntriesToLore(entriesRaw) : []

  // 2. 정규식 추출
  let rawRegex: unknown[] = []
  if (Array.isArray(j.regex_scripts)) rawRegex = j.regex_scripts
  else if (Array.isArray(j.scripts)) rawRegex = j.scripts

  const regexRules = rawRegex.filter(isRecord).map((r) => ({
    id: typeof r.id === 'string' ? r.id : uuidv4(),
    pattern: typeof r.regex === 'string' ? r.regex : typeof r.pattern === 'string' ? r.pattern : '',
    replace: typeof r.replacement === 'string' ? r.replacement : typeof r.replace === 'string' ? r.replace : '',
    flags: typeof r.flags === 'string' ? r.flags : 'gm',
  }))

  // 3. 에셋 추출
  let rawAssets: unknown[] = []
  if (Array.isArray(j.assets)) rawAssets = j.assets

  const assetItems = rawAssets.filter(isRecord).map((a) => ({
    id: typeof a.id === 'string' ? a.id : uuidv4(),
    type: a.type === 'audio' ? 'audio' as const : 'image' as const,
    name: typeof a.name === 'string' ? a.name : 'asset',
    url: typeof a.url === 'string' ? a.url : typeof a.src === 'string' ? a.src : '',
  }))

  const hasPrompt = Boolean(j.global_prompt || j.system_prompt || j.jailbreak_prompt)

  // 모듈로 인정할 최소 조건: 로어북, 정규식, 에셋 중 하나라도 있거나, 커스텀 프롬프트가 존재하는 경우
  if (entries.length > 0 || regexRules.length > 0 || assetItems.length > 0 || hasPrompt) {
    return {
      id: uuidv4(),
      name: String(j.name || fileName?.replace(/\.[^/.]+$/, '') || 'Imported Module'),
      description: String(j.description || '외부 포맷에서 가져온 모듈입니다.'),
      enabled: true,
      lorebook: {
        enabled: entries.length > 0,
        entries: entries as LoreEntry[],
      },
      regex: { 
        enabled: regexRules.length > 0, 
        rules: regexRules 
      },
      assets: { 
        enabled: assetItems.length > 0, 
        items: assetItems 
      },
    }
  }

  return null
}

/**
 * Native Risu `.risum` binary -> ModuleBundle 변환.
 * 포맷: [magic=111][ver=0][mainLen u32LE][rpack(main json)]...
 */
export async function parseRisuModuleFile(file: File): Promise<ModuleBundle | null> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length < 6) return null

  let pos = 0
  const readByte = () => (pos < bytes.length ? bytes[pos++] : -1)
  const readU32LE = () => {
    if (pos + 4 > bytes.length) return -1
    const n =
      bytes[pos] |
      (bytes[pos + 1] << 8) |
      (bytes[pos + 2] << 16) |
      (bytes[pos + 3] << 24)
    pos += 4
    return n >>> 0
  }

  if (readByte() !== 111) return null
  if (readByte() !== 0) return null

  const mainLen = readU32LE()
  if (mainLen <= 0 || pos + mainLen > bytes.length) return null

  const mainEncoded = bytes.slice(pos, pos + mainLen)
  const mainJson = new TextDecoder('utf-8').decode(decodeRPack(mainEncoded))
  let parsed: unknown
  try {
    parsed = JSON.parse(mainJson)
  } catch {
    return null
  }
  return parseExternalModuleBundle(parsed, file.name)
}

/**
 * ZIP / .charx / .risum 파일을 분석하여 여러 번들(프롬프트 또는 모듈)을 추출 시도.
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
    console.error('Error reading zip/charx/risum file:', err)
  }
  
  return { prompts, modules }
}
