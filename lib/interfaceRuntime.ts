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

/** 추가 인터페이스 JSON의 `characterLayout` (여러 행이 있으면 뒤 행이 앞 행을 덮어씀) */
export type ExtraInterfaceCharacterLayout = {
  /** 화면 아래에서 스프라이트를 올리는 px (설정 시 초기 화면 탭의 값보다 우선) */
  liftPx?: number
  /** 전체 스프라이트 영역 확대/축소 (0.5 ~ 1.5 권장) */
  scale?: number
  /** 나란히 배치 시 한 명당 최대 너비(px) */
  maxWidthPx?: number
  /** 스프라이트 박스 높이(vh). 미설정 시 채팅 기본값 */
  heightVh?: number
  multi?: {
    /** `<img=캐릭터>` 태그가 여러 개일 때 가로로 나열 */
    sideBySide?: boolean
    /** 스프라이트 사이 간격(px) */
    gapPx?: number
    /** 한 줄에 최대 몇 명까지 (넘으면 줄바꿈). 미설정 시 제한 없음 */
    maxPerRow?: number
    /** 세로 맞춤: items-end 기준 보조 (start | center | end) */
    align?: 'start' | 'center' | 'end'
    /** 가로 정렬 */
    justify?: 'center' | 'start' | 'end' | 'between' | 'around'
  }
}

function mergeMulti(
  base: ExtraInterfaceCharacterLayout['multi'] | undefined,
  next: ExtraInterfaceCharacterLayout['multi'] | undefined
): ExtraInterfaceCharacterLayout['multi'] | undefined {
  if (!next && !base) return undefined
  return { ...base, ...next }
}

export function parseMergedCharacterLayoutFromExtraEntries(
  entries: ExtraInterfaceEntry[] | undefined
): ExtraInterfaceCharacterLayout {
  let merged: ExtraInterfaceCharacterLayout = {}
  if (!entries?.length) return merged
  for (const e of entries) {
    const raw = e.json?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as { characterLayout?: ExtraInterfaceCharacterLayout }
      const cl = data.characterLayout
      if (!cl || typeof cl !== 'object') continue
      merged = {
        ...merged,
        ...cl,
        multi: mergeMulti(merged.multi, cl.multi),
      }
    } catch {
      // invalid JSON
    }
  }
  return merged
}

/** 초기 화면 lift + 추가 인터페이스 lift 병합 */
export function effectiveCharacterLiftPx(
  interfaceLift: number | undefined,
  extra: ExtraInterfaceCharacterLayout
): number {
  const fromExtra = extra.liftPx
  if (typeof fromExtra === 'number' && Number.isFinite(fromExtra)) {
    return Math.min(400, Math.max(0, fromExtra))
  }
  return Math.min(400, Math.max(0, interfaceLift ?? 0))
}
