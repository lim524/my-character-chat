/**
 * CharX / 이미지 팩 폴더에서 에셋 타입 추론: 경로 힌트 → 픽셀 크기.
 */

import type { AssetType } from './interfaceConfig'

/** 긴 변이 이 값 이하이면 주로 스프라이트·감정차로 간주 */
export const CHAR_MAX_LONG_SIDE = 1024

/** 긴 변이 이 값 이상이면 배경 후보 */
export const BG_MIN_LONG_SIDE = 1100

/** 둘 다 큰 이미지(예: 1200×900) — 배경에 가깝게 */
export const BOTH_SIDES_LARGE_MIN = 880

/**
 * data URL에서 이미지 픽셀 크기 (브라우저 전용).
 */
export function measureImageFromDataUrl(dataUrl: string): Promise<{ w: number; h: number } | null> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    const img = new Image()
    const done = (w: number | null, h: number | null) => {
      img.onload = null
      img.onerror = null
      if (w != null && h != null && w > 0 && h > 0) resolve({ w, h })
      else resolve(null)
    }
    img.onload = () => done(img.naturalWidth, img.naturalHeight)
    img.onerror = () => done(null, null)
    img.src = dataUrl
  })
}

export type PathHint = 'background' | 'character' | 'profile' | null

/**
 * 파일 경로/이름으로 역할 힌트 (명시 메타가 없을 때).
 * profile 은 프로필 전용으로 빼고 에셋 목록에는 넣지 않을 때 사용.
 */
export function hintFromAssetPath(relPath: string): PathHint {
  const s = relPath.replace(/\\/g, '/').toLowerCase()
  const base = s.split('/').pop() ?? s

  if (
    /(^|\/)(avatar|profile|icon|portrait|cover|mainchar|char_face)(\/|$|\.)/.test(s) ||
    /^(avatar|profile|cover|icon|portrait|main)\./.test(base)
  ) {
    return 'profile'
  }
  if (
    /(^|\/)(bg|background|scene|stage|room|map|sky|floor|wall|place|location|backdrop)(\/|$|\.)/.test(s) ||
    /^(bg|background|scene|stage|room)([_\-]|\.)/.test(base)
  ) {
    return 'background'
  }
  if (/(^|\/)(sprite|emotion|expr|face|pose|costume|char)(\/|$|\.)/.test(s)) {
    return 'character'
  }
  return null
}

/**
 * 픽셀만으로 character vs background 구분 (프로필은 호출부에서 별도).
 */
export function classifyAssetTypeByPixels(w: number, h: number): Exclude<AssetType, 'ui'> {
  const long = Math.max(w, h)
  const short = Math.min(w, h)
  const ratio = long / Math.max(short, 1)

  if (long >= BG_MIN_LONG_SIDE) return 'background'
  if (short >= BOTH_SIDES_LARGE_MIN && ratio < 2.4) return 'background'
  if (long <= CHAR_MAX_LONG_SIDE && ratio <= 2.3) return 'character'
  if (ratio >= 2.6 && short >= 420) return 'background'
  return long > CHAR_MAX_LONG_SIDE + 40 ? 'background' : 'character'
}
