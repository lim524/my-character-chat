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
  toggleMenuId?: string
  parentId?: string
  /** 클릭 시 토글할 overlay id */
  triggerOverlayId?: string
  /** 클릭 시 토글할 asset id */
  triggerAssetId?: string
  /** true면 클릭 시 onToggleOverlay로 토글 (기본 true) */
  toggleOverlay?: boolean
  /** Framer Motion 프로퍼티 (initial, animate, transition 등) */
  motion?: Record<string, unknown>
  /** 특정 이벤트 트리거 시 실행할 애니메이션 설정 */
  animation?: Record<string, unknown>
}

export type ParsedInterfaceOverlay = {
  id: string
  assetId?: string
  url?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full'
  style?: React.CSSProperties
  visible?: boolean
  /** Framer Motion 프로퍼티 (initial, animate, transition 등) */
  motion?: Record<string, unknown>
  /** 특정 이벤트 트리거 시 실행할 애니메이션 설정 */
  animation?: Record<string, unknown>
}

export type ParsedInterfaceVisibility = {
  dialogue?: boolean
  character?: boolean
  background?: boolean
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

/** extraInterfaceEntries의 JSON에서 overlays 배열만 모음 */
export function parseExtraInterfaceOverlays(
  entries: ExtraInterfaceEntry[] | undefined
): ParsedInterfaceOverlay[] {
  const overlays: ParsedInterfaceOverlay[] = []
  if (!entries?.length) return overlays
  for (const e of entries) {
    const raw = e.json?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as { overlays?: ParsedInterfaceOverlay[] }
      if (Array.isArray(data.overlays)) {
        for (const ov of data.overlays) {
          if (ov && typeof ov.id === 'string') overlays.push(ov)
        }
      }
    } catch {
      // invalid JSON
    }
  }
  return overlays
}

/** extraInterfaceEntries의 JSON에서 visibility 설정 추출 (여러 행이 있으면 뒤 행이 덮어씀) */
export function parseMergedVisibility(
  entries: ExtraInterfaceEntry[] | undefined
): ParsedInterfaceVisibility {
  let merged: ParsedInterfaceVisibility = {
    dialogue: true,
    character: true,
    background: true,
  }
  if (!entries?.length) return merged
  for (const e of entries) {
    const raw = e.json?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as { visibility?: ParsedInterfaceVisibility }
      if (data.visibility && typeof data.visibility === 'object') {
        merged = { ...merged, ...data.visibility }
      }
    } catch {
      // ignore
    }
  }
  return merged
}

/** 추가 인터페이스 JSON의 `characterLayout` (여러 행이 있으면 뒤 행이 앞 행을 덮어씀) */
export type ExtraInterfaceCharacterLayout = {
  /** 화면 아래에서 스프라이트를 올리는 px (채팅 세로 위치는 이 값만 사용) */
  liftPx?: number
  /** 전체 스프라이트 영역 확대/축소 (0.5 ~ 1.5 권장) */
  scale?: number
  /** 나란히 배치 시 한 명당 최대 너비(px). 좁은 화면에서는 자동으로 `96vw` 이하로 줄어듦 */
  maxWidthPx?: number
  /**
   * 한 명당 최대 너비를 뷰포트 비율로도 제한 (예: 88 → 화면 너비의 88%를 넘지 않음).
   * `maxWidthPx`와 함께 쓰면 `min(px, vw)`로 적용됩니다.
   */
  maxWidthVw?: number
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

/**
 * DatingSimScreenPreview의 `pb-32`(8rem)와 맞추기 위한 기본값.
 * 설정을 안 넣으면 스프라이트가 대화창·입력창에 가려지지 않도록 예약 영역을 둡니다.
 */
export const DEFAULT_CHARACTER_LIFT_PX = 128

/** 추가 인터페이스 `liftPx`가 있으면 사용, 없으면 `interfaceLift`(interfaceConfig.characterSpriteLiftPx) */
export function effectiveCharacterLiftPx(
  interfaceLift: number | undefined,
  extra: ExtraInterfaceCharacterLayout
): number {
  const fromExtra = extra.liftPx
  if (typeof fromExtra === 'number' && Number.isFinite(fromExtra)) {
    return Math.min(400, Math.max(0, fromExtra))
  }
  if (typeof interfaceLift === 'number' && Number.isFinite(interfaceLift)) {
    return Math.min(400, Math.max(0, interfaceLift))
  }
  return DEFAULT_CHARACTER_LIFT_PX
}
