import { applyRegexScripts } from '@/lib/interfaceRuntime'
import type { RegexScriptEntry, AssetRef } from '@/lib/interfaceConfig'

export type ParsedImageTag = { rawRef: string }

const IMG_TAG_REGEX = /<img\s*=\s*([^>]+?)\s*>/gi
const IMG_SRC_TAG_REGEX = /<img-src\s*=\s*([^>]+?)\s*>/gi
const IMG_SRC_DASH_TAG_REGEX = /<img-src-([^>]+?)\s*>/gi
const HTML_IMG_TAG_REGEX = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi
const ESCAPED_IMG_TAG_REGEX = /&lt;\s*img\s*=\s*([^&]+?)\s*&gt;/gi
const ESCAPED_IMG_SRC_TAG_REGEX = /&lt;\s*img-src\s*=\s*([^&]+?)\s*&gt;/gi
const ESCAPED_IMG_SRC_DASH_TAG_REGEX = /&lt;\s*img-src-([^&]+?)\s*&gt;/gi

function normalizeTagRef(v: string): string {
  let out = v.trim()
  // Remove invisible characters that often appear in model output.
  out = out.replace(/[\u200B-\u200D\uFEFF]/g, '')
  // Strip common wrappers/backticks/quotes/brackets from both ends.
  out = out
    .replace(/^[\s"'`[{(<]+/, '')
    .replace(/[\s"'`\]})>,.;!?]+$/, '')
  // Self-closing tags can leave trailing slash inside capture.
  out = out.replace(/\/+$/g, '').trim()
  // Some model outputs contain accidental inner whitespace around IDs/URLs.
  out = out.replace(/\s+/g, '')
  return out
}

export function normalizeImageControlTags(content: string, regexScripts?: RegexScriptEntry[]): string {
  const displayContent = applyRegexScripts(content, regexScripts, 'modify_display')
  return displayContent
    .replace(ESCAPED_IMG_SRC_DASH_TAG_REGEX, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
    .replace(ESCAPED_IMG_SRC_TAG_REGEX, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
    .replace(ESCAPED_IMG_TAG_REGEX, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
    .replace(HTML_IMG_TAG_REGEX, (_full, src: string) => `<img=${String(src).trim()}>`)
    .replace(IMG_SRC_DASH_TAG_REGEX, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
    .replace(IMG_SRC_TAG_REGEX, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
    .replace(/<img\s*=\s*([^>]+?)\/>/gi, (_full, ref: string) => `<img=${normalizeTagRef(String(ref))}>`)
}

export function parseImageTags(content: string): ParsedImageTag[] {
  const out: ParsedImageTag[] = []
  let m: RegExpExecArray | null
  while ((m = IMG_TAG_REGEX.exec(content)) !== null) {
    out.push({ rawRef: m[1] })
  }
  return out
}

export function splitRefAndType(raw: string): { ref: string; typeHint: string } {
  const v = normalizeTagRef(raw)
  const suffixMatch = v.match(/^(.*?):\s*(background|character|etc|overlay|ui)\s*$/i)
  if (suffixMatch) {
    return { ref: normalizeTagRef(suffixMatch[1]), typeHint: suffixMatch[2].toLowerCase() }
  }
  return { ref: v, typeHint: '' }
}

export function resolveAssetByRef(assets: AssetRef[], ref: string): AssetRef | undefined {
  const key = ref.trim()
  if (!key) return undefined
  const lower = key.toLowerCase()
  const normalize = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  const keyNorm = normalize(key)
  const keyBase = lower.replace(/\.[a-z0-9]+$/i, '')
  const keyBaseNorm = normalize(keyBase)
  const decodeSafe = (v: string) => {
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  }

  return assets.find((a) => {
    const label = a.label || ''
    const url = a.url || ''
    const urlNormalized = url.replace(/\\/g, '/')
    const baseNameRaw = urlNormalized.split('/').pop() || ''
    const baseName = decodeSafe(baseNameRaw)
    const baseNoExt = baseName.replace(/\.[a-z0-9]+$/i, '')

    if (a.id === key || label === key || url === key) return true
    if (a.id.toLowerCase() === lower || label.toLowerCase() === lower || url.toLowerCase() === lower) return true
    if (url.endsWith(`/${key}`) || url.endsWith(`\\${key}`)) return true
    if (baseName.toLowerCase() === lower || baseNoExt.toLowerCase() === lower) return true

    const idNorm = normalize(a.id)
    const labelNorm = normalize(label)
    const urlNorm = normalize(url)
    const baseNorm = normalize(baseName)
    const baseNoExtNorm = normalize(baseNoExt)

    if (idNorm === keyNorm || labelNorm === keyNorm || urlNorm === keyNorm) return true
    if (baseNorm === keyNorm || baseNoExtNorm === keyNorm) return true
    if (idNorm === keyBaseNorm || labelNorm === keyBaseNorm) return true
    if (baseNorm === keyBaseNorm || baseNoExtNorm === keyBaseNorm) return true

    // Fuzzy fallback: allow partial alias match (e.g. "Marin Kitagawa_default")
    if (keyNorm.length >= 6) {
      if (labelNorm.includes(keyNorm) || keyNorm.includes(labelNorm)) return true
      if (baseNoExtNorm.includes(keyNorm) || keyNorm.includes(baseNoExtNorm)) return true
    }
    return false
  })
}
