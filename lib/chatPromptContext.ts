/**
 * 채팅 API: 모듈 번들 정규식.
 * 로어북 조립은 lib/lorebookActivation.ts 의 buildLorebookForChat 사용.
 */

export { buildLorebookForChat, type BuiltLorebookForApi } from './lorebookActivation'
export type { ChatMessageLite } from './lorebookActivation'

type RegexRuleLike = {
  pattern?: string
  replace?: string
  replacement?: string
  flags?: string
}

function safeRegExp(pattern: string, flags: string): RegExp | null {
  try {
    const f = (flags || '')
      .split('')
      .filter((c) => 'gimsuy'.includes(c.toLowerCase()))
      .join('')
    const withG = f.includes('g') ? f : f + 'g'
    return new RegExp(pattern, withG)
  } catch {
    return null
  }
}

/** 모듈에 정의된 정규식(마이페이지) — 요청/응답 파이프라인에 추가 적용 */
export function applyModuleRegexRules(text: string, modules: unknown): string {
  if (!Array.isArray(modules) || !text) return text
  let out = text
  for (const m of modules) {
    if (m === null || typeof m !== 'object' || Array.isArray(m)) continue
    const mod = m as Record<string, unknown>
    if (mod.enabled !== true) continue
    const rx = mod.regex
    if (!rx || typeof rx !== 'object' || (rx as { enabled?: boolean }).enabled !== true) continue
    const rules = (rx as { rules?: unknown }).rules
    if (!Array.isArray(rules)) continue
    for (const r of rules) {
      if (r === null || typeof r !== 'object') continue
      const rule = r as RegexRuleLike
      const pattern = typeof rule.pattern === 'string' ? rule.pattern : ''
      if (!pattern) continue
      const rep =
        typeof rule.replace === 'string'
          ? rule.replace
          : typeof rule.replacement === 'string'
            ? rule.replacement
            : ''
      const flags = typeof rule.flags === 'string' ? rule.flags : 'g'
      const re = safeRegExp(pattern, flags)
      if (!re) continue
      out = out.replace(re, rep)
    }
  }
  return out
}
