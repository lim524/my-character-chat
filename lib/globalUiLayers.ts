import { kvGet, kvSet } from './idbKV'
import { sanitizeCustomCss } from './interfaceConfigSanitizer'

/** IndexedDB 키 — 설정에서 관리하는 전역 HTML/CSS/JS 레이어 목록 */
export const GLOBAL_UI_LAYERS_KEY = 'global-ui-layers'

const MAX_HTML_LENGTH = 100_000
const MAX_JS_LENGTH = 50_000

export interface GlobalUiLayer {
  id: string
  /** 목록에서 표시할 이름 */
  name: string
  /** 적용 여부 (꺼두면 CSS/HTML/JS 모두 비활성) */
  enabled: boolean
  /** 고정 오버레이에 삽입할 HTML (스크립트는 javascript 필드 사용) */
  html: string
  css: string
  javascript: string
}

export const GLOBAL_UI_LAYERS_UPDATED_EVENT = 'global-ui-layers-updated'

export function dispatchGlobalUiLayersUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GLOBAL_UI_LAYERS_UPDATED_EVENT))
}

/** HTML 문자열에서 <script> 블록 제거 (실행은 javascript 필드 전용) */
export function stripScriptTagsFromHtml(input: string): string {
  if (!input) return ''
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

export function sanitizeGlobalUiHtml(html: unknown): string {
  if (typeof html !== 'string') return ''
  const stripped = stripScriptTagsFromHtml(html)
  if (stripped.length > MAX_HTML_LENGTH) return stripped.slice(0, MAX_HTML_LENGTH)
  return stripped
}

export function sanitizeGlobalUiJs(js: unknown): string {
  if (typeof js !== 'string') return ''
  const t = js.trim()
  if (!t) return ''
  if (t.length > MAX_JS_LENGTH) return t.slice(0, MAX_JS_LENGTH)
  return t
}

export function sanitizeGlobalUiLayer(raw: unknown): GlobalUiLayer | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : crypto.randomUUID()
  const name = typeof o.name === 'string' ? o.name.slice(0, 200) : ''
  const enabled = o.enabled !== false
  const html = sanitizeGlobalUiHtml(o.html)
  const css = sanitizeCustomCss(o.css) ?? ''
  const javascript = sanitizeGlobalUiJs(o.javascript)
  return { id, name, enabled, html, css, javascript }
}

export async function getGlobalUiLayers(): Promise<GlobalUiLayer[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(GLOBAL_UI_LAYERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: GlobalUiLayer[] = []
    for (const item of parsed) {
      const layer = sanitizeGlobalUiLayer(item)
      if (layer) out.push(layer)
    }
    return out
  } catch {
    return []
  }
}

export async function setGlobalUiLayers(layers: GlobalUiLayer[]): Promise<void> {
  if (typeof window === 'undefined') return
  const cleaned = layers.map((x) => sanitizeGlobalUiLayer(x)).filter(Boolean) as GlobalUiLayer[]
  await kvSet(GLOBAL_UI_LAYERS_KEY, JSON.stringify(cleaned))
}

export function createEmptyGlobalUiLayer(): GlobalUiLayer {
  return {
    id: crypto.randomUUID(),
    name: '',
    enabled: true,
    html: '',
    css: '',
    javascript: '',
  }
}
