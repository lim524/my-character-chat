import { applyRegexScripts } from '@/lib/interfaceRuntime'
import type { RegexScriptEntry, AssetRef } from '@/lib/interfaceConfig'

export type ParsedImageTag = { rawRef: string }

const IMG_TAG_REGEX = /<img\s*=\s*([^>]+?)\s*>/gi
const IMG_SRC_TAG_REGEX = /<img-src\s*=\s*([^>]+?)\s*>/gi
const HTML_IMG_TAG_REGEX = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi

export function normalizeImageControlTags(content: string, regexScripts?: RegexScriptEntry[]): string {
  const displayContent = applyRegexScripts(content, regexScripts, 'modify_display')
  return displayContent
    .replace(HTML_IMG_TAG_REGEX, (_full, src: string) => `<img=${String(src).trim()}>`)
    .replace(IMG_SRC_TAG_REGEX, (_full, ref: string) => `<img=${String(ref).trim()}>`)
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
  const v = raw.trim()
  const suffixMatch = v.match(/^(.*?):\s*(background|character|etc|overlay|ui)\s*$/i)
  if (suffixMatch) {
    return { ref: suffixMatch[1].trim(), typeHint: suffixMatch[2].toLowerCase() }
  }
  return { ref: v, typeHint: '' }
}

export function resolveAssetByRef(assets: AssetRef[], ref: string): AssetRef | undefined {
  const key = ref.trim()
  if (!key) return undefined
  const lower = key.toLowerCase()
  const normalize = (v: string) => v.trim().toLowerCase().replace(/[_\-\s]+/g, '')
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

    if (normalize(a.id) === keyNorm || normalize(label) === keyNorm || normalize(url) === keyNorm) return true
    if (normalize(baseName) === keyNorm || normalize(baseNoExt) === keyNorm) return true
    if (normalize(a.id) === keyBaseNorm || normalize(label) === keyBaseNorm) return true
    if (normalize(baseName) === keyBaseNorm || normalize(baseNoExt) === keyBaseNorm) return true
    return false
  })
}
