import type { AssetRef } from './interfaceConfig'
import type { LocalCharacter } from './localStorage'
import type { ChatMessage } from '@/components/chat/types'
import {
  normalizeImageControlTags,
  parseImageTags,
  resolveAssetByRef,
  splitRefAndType,
} from './chatImageTags'

export interface DerivedChatState {
  backgroundUrl: string | null
  characterUrls: string[]
  overlayIds: string[]
  overlayOnlyMode: boolean
  stats: Record<string, number>
}

function getFallbackCharacterUrls(
  assets: AssetRef[],
  characterInfo: LocalCharacter | null
): string[] {
  const initCharId = characterInfo?.details?.initialCharacter as string | undefined
  if (initCharId) {
    const found = assets.find((a) => a.id === initCharId)?.url
    if (found) return [found]
  }
  const firstChar = assets.find((a) => a.type === 'character')?.url
  if (firstChar) return [firstChar]
  if (characterInfo?.imageUrl || characterInfo?.image_url) {
    return [(characterInfo.imageUrl || characterInfo.image_url) as string]
  }
  const emotions = (characterInfo as { emotionImages?: Array<{ imageUrl?: string }> } | null)?.emotionImages
  const firstEmotionUrl = emotions?.find((e) => typeof e?.imageUrl === 'string' && e.imageUrl)?.imageUrl
  if (firstEmotionUrl) return [firstEmotionUrl]
  return []
}

function looksLikeDirectImageRef(ref: string): boolean {
  const v = ref.trim().toLowerCase()
  if (!v) return false
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:image/') ||
    v.startsWith('/') ||
    v.startsWith('./') ||
    v.startsWith('../')
  )
}

function inferDirectRefType(typeHint: string, ref: string): 'background' | 'character' | 'overlay' | 'unknown' {
  if (typeHint === 'background') return 'background'
  if (typeHint === 'character') return 'character'
  if (typeHint === 'etc' || typeHint === 'overlay' || typeHint === 'ui') return 'overlay'
  const lower = ref.toLowerCase()
  if (lower.includes('background') || lower.includes('/bg') || lower.includes('_bg')) return 'background'
  return 'character'
}

/**
 * 대화 기록(0~viewIndex)을 처음부터 훑으며
 * 가장 마지막에 선언된 배경, 캐릭터, 오버레이, 능력치 상태를 도출합니다.
 */
export function deriveChatState(
  messages: ChatMessage[],
  viewIndex: number,
  assets: AssetRef[],
  characterInfo: LocalCharacter | null
): DerivedChatState {
  const isDev = process.env.NODE_ENV !== 'production'
  let backgroundUrl: string | null = null
  let characterUrls: string[] = []
  let overlayIds: string[] = []
  let overlayOnlyMode = false
  const stats: Record<string, number> = {}

  // 1. 기본값 설정 (캐릭터 설정에서 가져옴)
  const initBgId = characterInfo?.details?.initialBackground as string | undefined
  if (initBgId) {
    backgroundUrl = assets.find(a => a.id === initBgId)?.url || null
  }
  if (!backgroundUrl) {
    backgroundUrl = assets.find(a => a.type === 'background')?.url || null
  }

  characterUrls = getFallbackCharacterUrls(assets, characterInfo)

  // 2. 대화 기록 스캔 (태그Regex)
  const jsonRegex = /({[\s\S]*?})$/

  const limit = Math.min(viewIndex, messages.length - 1)
  let latestUserMessageIndex = -1
  for (let i = 0; i <= limit; i++) {
    if (messages[i].role === 'user') {
      latestUserMessageIndex = i
    }
    // Runtime image state must parse canonical control tags only.
    // Applying display regex scripts here can accidentally remove/transform tags.
    const content = normalizeImageControlTags(messages[i].content)
    
    // 능력치(JSON) 추출
    const jsonMatch = content.match(jsonRegex)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        Object.assign(stats, parsed)
      } catch { /* ignore */ }
    }

    // 이미지 태그 추출
    let foundBgInThisMsg: string | null = null
    const foundCharsInThisMsg: string[] = []
    const foundOverlaysInThisMsg: string[] = []
    let hasCharacterIntentTagInThisMsg = false

    for (const tag of parseImageTags(content)) {
      const { ref: assetRef, typeHint } = splitRefAndType(tag.rawRef)
      if (typeHint === 'character') hasCharacterIntentTagInThisMsg = true
      const asset = resolveAssetByRef(assets, assetRef)
      if (asset && asset.url) {
        if (asset.type === 'background' || typeHint === 'background') {
          foundBgInThisMsg = asset.url
        } else if (asset.type === 'character' || typeHint === 'character') {
          hasCharacterIntentTagInThisMsg = true
          foundCharsInThisMsg.push(asset.url)
        } else if (asset.type === 'ui' || typeHint === 'etc' || typeHint === 'overlay' || typeHint === 'ui') {
          foundOverlaysInThisMsg.push(asset.id)
        }
      } else if (looksLikeDirectImageRef(assetRef)) {
        const inferredType = inferDirectRefType(typeHint, assetRef)
        if (inferredType === 'background') {
          foundBgInThisMsg = assetRef
        } else if (inferredType === 'character') {
          hasCharacterIntentTagInThisMsg = true
          foundCharsInThisMsg.push(assetRef)
        }
      } else if (isDev && (typeHint === 'character' || assetRef.trim())) {
        // Debug hint: tag existed but could not map to a usable character image.
        console.warn('[chat-state] unresolved image tag', {
          messageIndex: i,
          rawRef: tag.rawRef,
          parsedRef: assetRef,
          typeHint,
        })
      }
    }

    // 메시지 단위로 상태 덮어쓰기
    if (foundBgInThisMsg) backgroundUrl = foundBgInThisMsg
    if (foundCharsInThisMsg.length > 0) {
      // Keep all character tags declared in this message in stable order.
      characterUrls = Array.from(new Set(foundCharsInThisMsg))
    } else if (isDev && hasCharacterIntentTagInThisMsg) {
      // Sticky guard: keep previous character state when this turn's character tag was invalid.
      console.warn('[chat-state] character tag found but no valid sprite resolved; keeping previous state', {
        messageIndex: i,
        previousCharacterCount: characterUrls.length,
      })
    }

    // 오버레이 목록은 마지막 선언 유지.
    if (foundOverlaysInThisMsg.length > 0) {
      overlayIds = foundOverlaysInThisMsg
    }

    // 단독 모드는 "현재 메시지"의 태그 조건으로만 계산 (sticky 방지)
    overlayOnlyMode =
      foundOverlaysInThisMsg.length > 0 &&
      foundCharsInThisMsg.length === 0 &&
      !foundBgInThisMsg &&
      !hasCharacterIntentTagInThisMsg &&
      characterUrls.length === 0
  }

  // 기본 정책: 기타 단독 모드가 아니면 캐릭터 최소 1명 보장
  if (!overlayOnlyMode && characterUrls.length === 0) {
    characterUrls = getFallbackCharacterUrls(assets, characterInfo)
  }

  // While reading assistant output after the latest user input, keep character sprites stable.
  // This prevents temporary flicker/disappear before the next user turn.
  if (latestUserMessageIndex >= 0 && limit > latestUserMessageIndex && characterUrls.length > 0) {
    characterUrls = Array.from(new Set(characterUrls))
  }

  return { backgroundUrl, characterUrls, overlayIds, overlayOnlyMode, stats }
}
