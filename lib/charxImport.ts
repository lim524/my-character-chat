/**
 * CharX (.charx ZIP): card.json + assets/* → LocalCharacter (+ 에셋 data URL 병합)
 * 에셋 타입: 카드의 interfaceConfig 우선 → 경로 힌트 → 이미지 픽셀 기준.
 * 프로필은 카드 필드 / 경로 힌트 / 가장 작은 캐릭터형 이미지 순으로 결정.
 */

import JSZip from 'jszip'
import { importCardToLocalCharacter, type ImportCardResult } from './characterCardInterop'
import { createInitialInterfaceConfig } from './interfaceEval'
import type { AssetRef, AssetType, InterfaceConfig } from './interfaceConfig'
import { v4 as uuidv4 } from 'uuid'
import {
  classifyAssetTypeByPixels,
  hintFromAssetPath,
  measureImageFromDataUrl,
} from './importAssetClassification'

function uint8ToBase64(u8: Uint8Array): string {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + chunk) as unknown as number[])
  }
  return btoa(bin)
}

function extMime(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'application/octet-stream'
}

function baseName(p: string): string {
  const i = p.lastIndexOf('/')
  return i >= 0 ? p.slice(i + 1) : p
}

type AssetRow = { path: string; dataUrl: string; bn: string }

function collectUniqueAssetRows(assetDataUrls: Map<string, string>): AssetRow[] {
  const rows: AssetRow[] = []
  const seen = new Set<string>()
  for (const [path, dataUrl] of assetDataUrls) {
    if (!path.includes('assets/')) continue
    const bn = baseName(path)
    if (seen.has(bn)) continue
    seen.add(bn)
    rows.push({ path: path.replace(/\\/g, '/'), dataUrl, bn })
  }
  return rows
}

async function resolveProfileImage(
  character: ImportCardResult['character'],
  assetDataUrls: Map<string, string>,
  rows: AssetRow[],
  warnings: string[]
): Promise<void> {
  const prof = character.imageUrl ?? character.image_url
  if (typeof prof === 'string' && prof.trim()) {
    if (prof.startsWith('data:') || prof.startsWith('http://') || prof.startsWith('https://')) {
      character.imageUrl = prof
      character.image_url = prof
      return
    }
    const norm = prof.replace(/\\/g, '/')
    const hit = assetDataUrls.get(norm) ?? assetDataUrls.get(baseName(norm))
    if (hit) {
      character.imageUrl = hit
      character.image_url = hit
      return
    }
  }

  for (const row of rows) {
    if (hintFromAssetPath(row.path) === 'profile') {
      character.imageUrl = row.dataUrl
      character.image_url = row.dataUrl
      warnings.push('CharX: 파일 경로 힌트로 프로필 이미지를 선택했습니다.')
      return
    }
  }

  let best: { url: string; maxSide: number } | null = null
  for (const row of rows) {
    if (hintFromAssetPath(row.path) === 'background') continue
    const dims = await measureImageFromDataUrl(row.dataUrl)
    if (!dims) continue
    const kind = classifyAssetTypeByPixels(dims.w, dims.h)
    if (kind === 'background') continue
    const maxSide = Math.max(dims.w, dims.h)
    if (!best || maxSide < best.maxSide) best = { url: row.dataUrl, maxSide }
  }
  if (best) {
    character.imageUrl = best.url
    character.image_url = best.url
    warnings.push('CharX: 카드에 표지 경로가 없어 가장 작은 캐릭터형 이미지를 프로필로 사용했습니다.')
  }
}

async function buildClassifiedZipAssets(
  rows: AssetRow[],
  profileDataUrl: string | null,
  warnings: string[]
): Promise<AssetRef[]> {
  const out: AssetRef[] = []
  for (const row of rows) {
    if (profileDataUrl && row.dataUrl === profileDataUrl) continue
    if (hintFromAssetPath(row.path) === 'profile') continue

    const h = hintFromAssetPath(row.path)
    let assetType: AssetType
    if (h === 'background') {
      assetType = 'background'
    } else if (h === 'character') {
      assetType = 'character'
    } else {
      const dims = await measureImageFromDataUrl(row.dataUrl)
      if (dims) {
        assetType = classifyAssetTypeByPixels(dims.w, dims.h)
      } else {
        assetType = 'character'
        warnings.push(`CharX: "${row.bn}"의 크기를 읽지 못해 캐릭터 에셋으로 넣었습니다.`)
      }
    }

    out.push({
      id: uuidv4(),
      type: assetType,
      sourceType: 'upload',
      url: row.dataUrl,
      label: row.bn.replace(/\.[^.]+$/, ''),
    })
  }
  return out
}

export async function importCharxArrayBuffer(buffer: ArrayBuffer): Promise<ImportCardResult> {
  const zip = await JSZip.loadAsync(buffer)

  let cardEntry = zip.file('card.json')
  if (!cardEntry) {
    const names = Object.keys(zip.files).filter((n) => /(^|\/)card\.json$/i.test(n))
    if (names[0]) cardEntry = zip.file(names[0])
  }
  if (!cardEntry) {
    throw new Error('ZIP 안에 card.json 이 없습니다.')
  }

  const cardText = await cardEntry.async('string')
  const json = JSON.parse(cardText) as unknown
  const result = importCardToLocalCharacter(json)

  const assetDataUrls = new Map<string, string>()
  const promises: Promise<void>[] = []

  zip.forEach((relPath, entry) => {
    if (entry.dir) return
    const lower = relPath.replace(/\\/g, '/').toLowerCase()
    if (!lower.includes('assets/') && !lower.startsWith('assets/')) return
    promises.push(
      (async () => {
        const u8 = await entry.async('uint8array')
        const mime = extMime(relPath)
        const dataUrl = `data:${mime};base64,${uint8ToBase64(u8)}`
        const norm = relPath.replace(/\\/g, '/')
        assetDataUrls.set(norm, dataUrl)
        assetDataUrls.set(baseName(relPath), dataUrl)
      })()
    )
  })

  await Promise.all(promises)
  const rows = collectUniqueAssetRows(assetDataUrls)

  const ic = result.character.interfaceConfig
  const hadCardAssets = !!(ic?.assets?.length)
  if (hadCardAssets && ic?.assets) {
    const nextAssets: AssetRef[] = ic.assets.map((a) => {
      const url = a.url
      if (typeof url !== 'string' || url.startsWith('data:') || url.startsWith('http')) return a
      const hit = assetDataUrls.get(url.replace(/\\/g, '/')) ?? assetDataUrls.get(baseName(url))
      if (hit) return { ...a, url: hit }
      return a
    })
    result.character.interfaceConfig = { ...ic, assets: nextAssets }
  }

  await resolveProfileImage(result.character, assetDataUrls, rows, result.warnings)
  const profileUrl =
    typeof result.character.imageUrl === 'string' && result.character.imageUrl.startsWith('data:')
      ? result.character.imageUrl
      : null

  if (!hadCardAssets && assetDataUrls.size > 0) {
    const assets = await buildClassifiedZipAssets(rows, profileUrl, result.warnings)
    if (assets.length > 0) {
      const base: InterfaceConfig = result.character.interfaceConfig ?? createInitialInterfaceConfig()
      result.character.interfaceConfig = { ...base, assets }
    }
  } else if (hadCardAssets && profileUrl) {
    const assetsNow = result.character.interfaceConfig?.assets
    if (assetsNow?.length) {
      const next = assetsNow.filter((a) => a.url !== profileUrl)
      if (next.length !== assetsNow.length) {
        result.character.interfaceConfig = { ...result.character.interfaceConfig!, assets: next }
        result.warnings.push('CharX: 프로필과 동일한 이미지는 에셋 목록에서 제외했습니다.')
      }
    }
  }

  if (assetDataUrls.size > 0) {
    result.warnings.push(
      'CharX: card.json과 assets 폴더를 병합했습니다. 경로·크기 기준으로 에셋을 나눴으니 필요 시 이미지 탭에서 조정하세요.'
    )
  }
  return result
}
