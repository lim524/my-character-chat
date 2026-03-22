/**
 * 캐릭터별 큰 data URL을 IndexedDB 별도 키로 분리해 `local-characters` JSON 크기를 줄입니다.
 * 참조 문자열: ref://mcc-blob/{characterId}/{slot}
 */

import { kvGet, kvRemoveByPrefix, kvSet } from './idbKV'
import type { AssetRef } from './interfaceConfig'
import type { EmotionImageItem, LocalCharacter } from './localStorage'

export const BLOB_REF_SCHEME = 'ref://mcc-blob/'

export function blobStorageKey(characterId: string, slot: string): string {
  return `mcc-blob:${characterId}:${slot}`
}

function isDataUrl(s: string | undefined): s is string {
  return typeof s === 'string' && s.startsWith('data:')
}

function isBlobRef(s: string | undefined): boolean {
  return typeof s === 'string' && s.startsWith(BLOB_REF_SCHEME)
}

export function parseBlobRef(s: string): { characterId: string; slot: string } | null {
  if (!isBlobRef(s)) return null
  const rest = s.slice(BLOB_REF_SCHEME.length)
  const i = rest.indexOf('/')
  if (i <= 0) return null
  const characterId = rest.slice(0, i)
  const slot = decodeURIComponent(rest.slice(i + 1))
  if (!characterId || !slot) return null
  return { characterId, slot }
}

async function putBlob(characterId: string, slot: string, dataUrl: string): Promise<string> {
  const key = blobStorageKey(characterId, slot)
  await kvSet(key, dataUrl)
  return `${BLOB_REF_SCHEME}${characterId}/${encodeURIComponent(slot)}`
}

async function getBlob(ref: string): Promise<string | null> {
  const parsed = parseBlobRef(ref)
  if (!parsed) return null
  return kvGet(blobStorageKey(parsed.characterId, parsed.slot))
}

/** 인라인 data URL이 있으면 블롭으로 옮기고 ref 문자열로 바꾼 캐릭터 */
export async function extractCharacterBlobsForStorage(char: LocalCharacter): Promise<LocalCharacter> {
  const id = char.id
  const next = JSON.parse(JSON.stringify(char)) as LocalCharacter

  if (isDataUrl(next.imageUrl)) {
    next.imageUrl = await putBlob(id, 'profile', next.imageUrl)
    next.image_url = next.imageUrl
  } else if (isDataUrl(next.image_url)) {
    next.image_url = await putBlob(id, 'profile', next.image_url)
    next.imageUrl = next.image_url
  }

  const emotions = next.emotionImages ?? next.emotion_images
  if (Array.isArray(emotions)) {
    for (const e of emotions as EmotionImageItem[]) {
      if (e && isDataUrl(e.imageUrl)) {
        e.imageUrl = await putBlob(id, `emotion-${e.id}`, e.imageUrl)
      }
    }
  }

  const assets = next.interfaceConfig?.assets
  if (Array.isArray(assets)) {
    for (const a of assets as AssetRef[]) {
      if (a && isDataUrl(a.url)) {
        a.url = await putBlob(id, `asset-${a.id}`, a.url)
      }
    }
  }

  return next
}

/** ref:// 를 실제 data URL로 치환한 캐릭터 (메모리용) */
export async function hydrateCharacterBlobs(char: LocalCharacter): Promise<LocalCharacter> {
  const next = JSON.parse(JSON.stringify(char)) as LocalCharacter

  const imgU = next.imageUrl
  if (imgU && isBlobRef(imgU)) {
    const data = await getBlob(imgU)
    if (data) {
      next.imageUrl = data
      next.image_url = data
    }
  } else {
    const imgLegacy = next.image_url
    if (imgLegacy && isBlobRef(imgLegacy)) {
      const data = await getBlob(imgLegacy)
      if (data) {
        next.image_url = data
        next.imageUrl = data
      }
    }
  }

  const emotions = next.emotionImages ?? next.emotion_images
  if (Array.isArray(emotions)) {
    for (const e of emotions as EmotionImageItem[]) {
      if (e && isBlobRef(e.imageUrl)) {
        const data = await getBlob(e.imageUrl)
        if (data) e.imageUrl = data
      }
    }
  }

  const assets = next.interfaceConfig?.assets
  if (Array.isArray(assets)) {
    for (const a of assets as AssetRef[]) {
      if (a && isBlobRef(a.url)) {
        const data = await getBlob(a.url)
        if (data) a.url = data
      }
    }
  }

  return next
}

export function characterHasInlineDataUrls(char: LocalCharacter): boolean {
  if (isDataUrl(char.imageUrl) || isDataUrl(char.image_url)) return true
  for (const e of char.emotionImages ?? char.emotion_images ?? []) {
    if (e && isDataUrl(e.imageUrl)) return true
  }
  for (const a of char.interfaceConfig?.assets ?? []) {
    if (a && isDataUrl(a.url)) return true
  }
  return false
}

export async function removeAllBlobsForCharacter(characterId: string): Promise<void> {
  await kvRemoveByPrefix(`mcc-blob:${characterId}:`)
}
