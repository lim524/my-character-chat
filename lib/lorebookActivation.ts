/**
 * 로어북: 최근 대화 텍스트에 키가 나타나면 해당 항목만 시스템에 넣습니다.
 * (항상 활성은 키 없이 포함) 별도 스캔 설정 UI 없이 깊이·예산은 고정값.
 */

import type { LoreEntry } from './interfaceConfig'

export type ChatMessageLite = { role: string; content: string }

/** 최근 메시지 몇 개를 스캔할지 (Risu/일반 챗앱과 비슷한 기본) */
const SCAN_DEPTH = 12
/** 활성화된 로어 본문 합산 상한 */
const MAX_ACTIVATED_CHARS = 12_000
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function normalizeLoreEntry(raw: unknown): LoreEntry | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const e = raw as Record<string, unknown>
  
  // prompt: MCC('prompt') or Risu/ST('content')
  const prompt = (typeof e.prompt === 'string' ? e.prompt : typeof e.content === 'string' ? e.content : '').trim()
  if (!prompt) return null

  // name: MCC('name') or Risu/ST('comment', 'label')
  const name = typeof e.name === 'string' ? e.name : typeof e.comment === 'string' ? e.comment : typeof e.label === 'string' ? e.label : '항목'

  // keys: MCC(string) or Risu/ST(string[])
  let keys = ''
  if (typeof e.keys === 'string') {
    keys = e.keys
  } else if (Array.isArray(e.keys)) {
    keys = e.keys.filter((k) => typeof k === 'string').join(', ')
  }

  const id = typeof e.id === 'string' ? e.id : (typeof e.uid === 'number' ? `lore-${e.uid}` : '')
  const secondaryKeys = typeof e.secondaryKeys === 'string' ? e.secondaryKeys : ''

  // enabled 체크 (Risu/ST는 enabled: false일 수 있음)
  if (e.enabled === false) return null

  return {
    id: id || `lore-${Math.random().toString(36).slice(2)}`,
    name,
    keys,
    order: typeof e.order === 'number' && Number.isFinite(e.order) ? e.order : (typeof e.insertion_order === 'number' ? e.insertion_order : 0),
    prompt,
    alwaysActive: e.alwaysActive === true || e.constant === true,
    multipleKeys: e.multipleKeys === true || Array.isArray(e.keys),
    useRegex: e.useRegex === true,
    ...(e.selective === true && secondaryKeys.trim() ? { selective: true as const, secondaryKeys } : {}),
  }
}

export function parseLoreEntriesArray(raw: unknown): LoreEntry[] {
  if (!Array.isArray(raw)) return []
  const out: LoreEntry[] = []
  for (const x of raw) {
    const e = normalizeLoreEntry(x)
    if (e) out.push(e)
  }
  return out
}

function primaryKeyList(entry: LoreEntry): string[] {
  const k = entry.keys.trim()
  if (!k) return []
  if (entry.multipleKeys) {
    return k
      .split(/[,，\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [k]
}

function keyMatchesContext(context: string, key: string, useRegex: boolean): boolean {
  if (!key) return false
  if (useRegex) {
    const t = key.trim()
    /** Risu/ST: `/패턴/flags` 형태 */
    if (t.startsWith('/') && t.lastIndexOf('/') >= 1) {
      const end = t.lastIndexOf('/')
      const body = t.slice(1, end)
      const flags = t.slice(end + 1)
      try {
        return new RegExp(body, flags || undefined).test(context)
      } catch {
        return false
      }
    }
    try {
      return new RegExp(key, 'i').test(context)
    } catch {
      return false
    }
  }
  return context.toLowerCase().includes(key.toLowerCase())
}

function secondaryKeyList(entry: LoreEntry): string[] {
  const k = entry.secondaryKeys?.trim() ?? ''
  if (!k) return []
  return k
    .split(/[,，\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function entryMatchesScanText(entry: LoreEntry, scanText: string): boolean {
  if (entry.alwaysActive) return true
  const primary = primaryKeyList(entry)

  if (entry.selective && (entry.secondaryKeys?.trim() ?? '').length > 0) {
    const secondary = secondaryKeyList(entry)
    if (secondary.length === 0) {
      // selective 플래그만 있고 2차 키 파싱 실패 시 일반 키만 사용
    } else {
      const pHit =
        primary.length === 0 ||
        primary.some((k) => keyMatchesContext(scanText, k, entry.useRegex))
      const sHit = secondary.some((k) => keyMatchesContext(scanText, k, entry.useRegex))
      return pHit && sHit
    }
  }

  /** 키가 비어 있으면 "상시 로어"로 취급 */
  if (primary.length === 0) return true
  return primary.some((k) => keyMatchesContext(scanText, k, entry.useRegex))
}

export function buildScanContext(messages: ChatMessageLite[], scanDepth: number): string {
  const depth = clamp(Math.floor(scanDepth) || SCAN_DEPTH, 1, 100)
  const slice = messages.slice(-depth)
  return slice
    .map((m) => {
      const role = typeof m.role === 'string' ? m.role : 'user'
      const content = typeof m.content === 'string' ? m.content : ''
      return `${role}: ${content}`
    })
    .join('\n\n')
}

export type ModuleLoreRow = {
  id: string
  moduleName: string
  order: number
  keywords: string[]
  content: string
}

export function extractModuleLoreRows(modules: unknown): ModuleLoreRow[] {
  if (!Array.isArray(modules)) return []
  const rows: ModuleLoreRow[] = []
  let orderSeq = 0
  for (const m of modules) {
    if (m === null || typeof m !== 'object' || Array.isArray(m)) continue
    const mod = m as Record<string, unknown>
    if (mod.enabled !== true) continue
    const modName =
      typeof mod.name === 'string' && mod.name.trim() ? mod.name.trim() : '모듈'
    const lb = mod.lorebook as { enabled?: boolean; entries?: unknown } | null | undefined
    if (!lb || typeof lb !== 'object' || lb.enabled !== true) continue
    const entries = lb.entries
    if (!Array.isArray(entries)) continue
    for (const ent of entries) {
      if (ent === null || typeof ent !== 'object') continue
      const e = ent as Record<string, unknown>
      const content = typeof e.content === 'string' ? e.content.trim() : ''
      if (!content) continue
      const kw = Array.isArray(e.keywords)
        ? e.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
        : []
      orderSeq += 1
      rows.push({
        id: `mod-${modName}-${orderSeq}`,
        moduleName: modName,
        order: orderSeq * 10,
        keywords: kw.map((k) => k.trim().toLowerCase()),
        content,
      })
    }
  }
  return rows
}

function moduleRowMatches(row: ModuleLoreRow, scanText: string): boolean {
  if (row.keywords.length === 0) return true
  const c = scanText.toLowerCase()
  return row.keywords.some((k) => c.includes(k.toLowerCase()))
}

type LorePiece = { id: string; order: number; text: string }

function trimByCharBudget(pieces: LorePiece[], maxChars: number): LorePiece[] {
  const sorted = [...pieces].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  let used = 0
  const out: LorePiece[] = []
  for (const p of sorted) {
    const n = p.text.length
    if (used + n <= maxChars) {
      out.push(p)
      used += n
    } else {
      break
    }
  }
  return out
}

function entryToPiece(e: LoreEntry): LorePiece {
  return {
    id: e.id,
    order: e.order,
    text: `### ${e.name}${e.alwaysActive ? ' [항상 활성]' : ''}\n${e.prompt}`,
  }
}

function moduleToPiece(r: ModuleLoreRow): LorePiece {
  return {
    id: r.id,
    order: r.order,
    text: `### [모듈: ${r.moduleName}]\n${r.content}`,
  }
}

function piecesFromChatScan(
  entriesSorted: LoreEntry[],
  moduleSorted: ModuleLoreRow[],
  initialScanText: string
): LorePiece[] {
  const charOn = new Set<string>()
  const modOn = new Set<string>()
  const pieces: LorePiece[] = []

  function tryEntry(e: LoreEntry, scanText: string): void {
    if (charOn.has(e.id)) return
    if (!entryMatchesScanText(e, scanText)) return
    charOn.add(e.id)
    pieces.push(entryToPiece(e))
  }

  function tryMod(r: ModuleLoreRow, scanText: string): void {
    if (modOn.has(r.id)) return
    if (!moduleRowMatches(r, scanText)) return
    modOn.add(r.id)
    pieces.push(moduleToPiece(r))
  }

  function onePass(scanText: string): void {
    for (const e of entriesSorted) tryEntry(e, scanText)
    for (const r of moduleSorted) tryMod(r, scanText)
  }

  onePass(initialScanText)
  return pieces
}

export type BuiltLorebookForApi = {
  /** 카드 문자열 필드 `lorebook` (스캔 대상 아님) */
  legacyLorebookText: string
  /** 대화 스캔으로 골라진 활성 로어만 합친 문자열 */
  scannedLoreText: string
}

export function buildLorebookForChat(
  rawCharacter: Record<string, unknown>,
  modules: unknown,
  messages: ChatMessageLite[]
): BuiltLorebookForApi {
  const legacyLorebookText =
    typeof rawCharacter.lorebook === 'string' ? rawCharacter.lorebook.trim() : ''

  const entries = parseLoreEntriesArray(rawCharacter.loreEntries)
  const moduleRows = extractModuleLoreRows(modules)

  const scanText = buildScanContext(messages, SCAN_DEPTH)
  const entriesSorted = [...entries].sort((a, b) => a.order - b.order)
  const moduleSorted = [...moduleRows].sort((a, b) => a.order - b.order)

  const rawPieces = piecesFromChatScan(entriesSorted, moduleSorted, scanText)
  const trimmed = trimByCharBudget(rawPieces, MAX_ACTIVATED_CHARS)
  const scannedLoreText = trimmed.map((p) => p.text).join('\n\n')

  return { legacyLorebookText, scannedLoreText }
}

/** @deprecated 예전 단일 문자열 조립 */
export function buildDynamicLorebookSection(
  rawCharacter: Record<string, unknown>,
  modules: unknown,
  messages: ChatMessageLite[]
): string {
  const b = buildLorebookForChat(rawCharacter, modules, messages)
  const chunks: string[] = []
  if (b.legacyLorebookText) chunks.push(b.legacyLorebookText)
  if (b.scannedLoreText) chunks.push(`# 활성화된 로어북\n${b.scannedLoreText}`)
  return chunks.length ? chunks.join('\n\n---\n\n') : '없음'
}
