import type { GameVariableDefinition } from './interfaceConfig'

/** 채팅·전역 UI에서 동일하게 사용 */
export const GAME_VARIABLES_UPDATED_EVENT = 'game-variables-updated'

export function dispatchGameVariablesUpdated(
  values: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GAME_VARIABLES_UPDATED_EVENT, { detail: values }))
}

/** 태그 사이 전체를 JSON으로 파싱 (중첩 객체 허용). */
const GAME_STATE_FULL_BLOCK = /\[game_state\][\s\S]*?\[\/game_state\]/i

export function stripGameStateBlock(content: string): string {
  return content.replace(GAME_STATE_FULL_BLOCK, '').trim()
}

export function parseGameStatePayload(jsonStr: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(jsonStr) as unknown
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    return v as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * 원문에서 블록을 파싱하고, 유효하면 본문에서 제거한 문자열을 반환한다.
 * JSON 파싱 실패 시 원문 유지(디버깅용).
 */
export function extractGameStateFromAssistant(content: string): {
  displayContent: string
  payload: Record<string, unknown> | null
} {
  const m = content.match(GAME_STATE_FULL_BLOCK)
  if (!m || m.index === undefined) return { displayContent: content, payload: null }
  const inner = m[0]
    .replace(/^\[game_state\]\s*/i, '')
    .replace(/\s*\[\/game_state\]\s*$/i, '')
    .trim()
  const payload = parseGameStatePayload(inner)
  if (!payload) return { displayContent: content, payload: null }
  const displayContent = `${content.slice(0, m.index)}${content.slice(m.index + m[0].length)}`.trim()
  return { displayContent, payload }
}

export function isValidVariableKey(key: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}

export function coerceDefault(def: GameVariableDefinition): string | number | boolean {
  const raw = String(def.defaultValue ?? '').trim()
  switch (def.type) {
    case 'number': {
      const n = Number(raw)
      return Number.isFinite(n) ? n : 0
    }
    case 'boolean':
      return raw === 'true' || raw === '1' || raw === 'yes'
    default:
      return raw
  }
}

export function initialGameStateFromDefs(
  defs: GameVariableDefinition[]
): Record<string, string | number | boolean> {
  const o: Record<string, string | number | boolean> = {}
  for (const d of defs) {
    if (!isValidVariableKey(d.key)) continue
    o[d.key] = coerceDefault(d)
  }
  return o
}

function coerceIncoming(
  def: GameVariableDefinition,
  v: unknown
): string | number | boolean {
  switch (def.type) {
    case 'number': {
      const n = Number(v)
      return Number.isFinite(n) ? n : coerceDefault(def)
    }
    case 'boolean':
      if (typeof v === 'boolean') return v
      if (v === 'true' || v === 1) return true
      if (v === 'false' || v === 0) return false
      return coerceDefault(def) as boolean
    default:
      return v === null || v === undefined ? String(coerceDefault(def)) : String(v)
  }
}

/** 정의에 있는 키만 병합. incoming의 여분 키는 무시. */
export function mergeGameVariableValues(
  defs: GameVariableDefinition[],
  previous: Record<string, string | number | boolean>,
  incoming: Record<string, unknown>
): Record<string, string | number | boolean> {
  const defByKey = new Map(defs.map((d) => [d.key, d]))
  const next = { ...previous }
  for (const key of Object.keys(incoming)) {
    const def = defByKey.get(key)
    if (!def) continue
    next[key] = coerceIncoming(def, incoming[key])
  }
  return next
}

/** 전역 HTML `{{key}}` 치환용 — HTML 이스케이프 */
export function escapeHtmlForGameVar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function applyGameVariablePlaceholders(
  html: string,
  values: Record<string, string | number | boolean>
): string {
  return html.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, key: string) => {
    const v = values[key]
    const str = v === null || v === undefined ? '' : String(v)
    return escapeHtmlForGameVar(str)
  })
}

export function valuesToDisplayMap(
  values: Record<string, string | number | boolean>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(values)) {
    out[k] = v === null || v === undefined ? '' : String(v)
  }
  return out
}
