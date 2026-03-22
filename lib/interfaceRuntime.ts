import type { ExtraInterfaceEntry, RegexScriptEntry, RegexScriptType } from './interfaceConfig'

/** RisuAI 스타일: 지정 phase에 맞는 규칙만 순서대로 적용 */
export function applyRegexScripts(
  text: string,
  scripts: RegexScriptEntry[] | undefined,
  phase: RegexScriptType
): string {
  if (!text || !scripts?.length) return text
  let out = text
  for (const s of scripts) {
    if (!s.enabled || s.scriptType !== phase || !s.pattern) continue
    try {
      const re = new RegExp(s.pattern, 'g')
      out = out.replace(re, s.replacement ?? '')
    } catch {
      // 잘못된 정규식은 건너뜀
    }
  }
  return out
}

export type ParsedInterfaceIcon = {
  id: string
  label?: string
  position?: string
  lucide?: string
  href?: string
}

/** extraInterfaceEntries의 JSON에서 icons 배열만 모음 */
export function parseExtraInterfaceIcons(
  entries: ExtraInterfaceEntry[] | undefined
): ParsedInterfaceIcon[] {
  const icons: ParsedInterfaceIcon[] = []
  if (!entries?.length) return icons
  for (const e of entries) {
    const raw = e.json?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as { icons?: ParsedInterfaceIcon[] }
      if (Array.isArray(data.icons)) {
        for (const ic of data.icons) {
          if (ic && typeof ic.id === 'string') icons.push(ic)
        }
      }
    } catch {
      // invalid JSON
    }
  }
  return icons
}
