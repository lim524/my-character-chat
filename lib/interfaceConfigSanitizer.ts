import type { GameVariableDefinition, InterfaceConfig } from './interfaceConfig'
import { isValidVariableKey } from './gameVariables'

const ALLOWED_HREF_PROTOCOLS = new Set(['http:', 'https:'])
const MAX_CUSTOM_CSS_LENGTH = 20000

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeCustomCss(css: unknown): string | undefined {
  if (typeof css !== 'string') return undefined
  const trimmed = css.trim()
  if (!trimmed) return undefined
  if (trimmed.length > MAX_CUSTOM_CSS_LENGTH) {
    return trimmed.slice(0, MAX_CUSTOM_CSS_LENGTH)
  }
  return trimmed
}

export function isSafeExternalHref(href: string): boolean {
  try {
    const url = new URL(href)
    return ALLOWED_HREF_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

export function sanitizeImportedInterfaceConfig(
  input: unknown,
  warnings: string[]
): Partial<InterfaceConfig> {
  if (!isPlainObject(input)) return {}
  const next: Partial<InterfaceConfig> = {}

  if (Array.isArray(input.assets)) {
    next.assets = input.assets as InterfaceConfig['assets']
  }
  if (typeof input.layoutPreset === 'string' && (input.layoutPreset === 'dating-sim-v1' || input.layoutPreset === 'custom')) {
    next.layoutPreset = input.layoutPreset
  }
  if (typeof input.dialogueScript === 'string') next.dialogueScript = input.dialogueScript
  if (Array.isArray(input.scenarioRules)) next.scenarioRules = input.scenarioRules as InterfaceConfig['scenarioRules']
  if (typeof input.backgroundEmbedding === 'string') next.backgroundEmbedding = input.backgroundEmbedding
  if (Array.isArray(input.regexScripts)) next.regexScripts = input.regexScripts as InterfaceConfig['regexScripts']
  if (Array.isArray(input.stats)) next.stats = input.stats as InterfaceConfig['stats']
  if (Array.isArray(input.extraInterfaceEntries)) next.extraInterfaceEntries = input.extraInterfaceEntries as InterfaceConfig['extraInterfaceEntries']
  if (typeof input.characterSpriteLiftPx === 'number' && Number.isFinite(input.characterSpriteLiftPx)) {
    next.characterSpriteLiftPx = Math.max(0, Math.min(400, input.characterSpriteLiftPx))
  }

  const sanitizedCss = sanitizeCustomCss(input.customCSS)
  if (typeof input.customCSS === 'string' && !sanitizedCss) {
    warnings.push('interfaceConfig.customCSS 값이 비어 있어 무시되었습니다.')
  } else if (typeof input.customCSS === 'string' && input.customCSS.trim().length > MAX_CUSTOM_CSS_LENGTH) {
    warnings.push(`interfaceConfig.customCSS 길이가 길어 ${MAX_CUSTOM_CSS_LENGTH}자로 잘렸습니다.`)
  }
  if (sanitizedCss) next.customCSS = sanitizedCss

  if (Array.isArray(input.gameVariables)) {
    const cleaned: GameVariableDefinition[] = []
    for (const row of input.gameVariables) {
      if (!row || typeof row !== 'object') continue
      const o = row as Record<string, unknown>
      const key = typeof o.key === 'string' ? o.key.trim() : ''
      if (!key || !isValidVariableKey(key)) continue
      const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : crypto.randomUUID()
      const label = typeof o.label === 'string' ? o.label.slice(0, 120) : key
      const type =
        o.type === 'number' || o.type === 'boolean' || o.type === 'string' ? o.type : 'string'
      const defaultValue =
        typeof o.defaultValue === 'string'
          ? o.defaultValue.slice(0, 500)
          : String(o.defaultValue ?? '').slice(0, 500)
      cleaned.push({ id, key, label, type, defaultValue })
    }
    next.gameVariables = cleaned
  }

  return next
}
