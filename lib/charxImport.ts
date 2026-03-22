/**
 * CharX (.charx ZIP): card.json + assets/* → LocalCharacter (+ 에셋 data URL 병합)
 */

import JSZip from 'jszip'
import { importCardToLocalCharacter, type ImportCardResult } from './characterCardInterop'
import { createInitialInterfaceConfig } from './interfaceEval'
import type { AssetRef, InterfaceConfig } from './interfaceConfig'
import { v4 as uuidv4 } from 'uuid'

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
        assetDataUrls.set(relPath.replace(/\\/g, '/'), dataUrl)
        assetDataUrls.set(baseName(relPath), dataUrl)
      })()
    )
  })

  await Promise.all(promises)

  const ic = result.character.interfaceConfig
  if (ic?.assets?.length) {
    const nextAssets: AssetRef[] = ic.assets.map((a) => {
      const url = a.url
      if (typeof url !== 'string' || url.startsWith('data:') || url.startsWith('http')) return a
      const hit = assetDataUrls.get(url) ?? assetDataUrls.get(baseName(url))
      if (hit) return { ...a, url: hit }
      return a
    })
    result.character.interfaceConfig = { ...ic, assets: nextAssets }
  } else if (assetDataUrls.size > 0) {
    const assets: AssetRef[] = []
    const seen = new Set<string>()
    for (const [path, dataUrl] of assetDataUrls) {
      if (!path.includes('assets/')) continue
      const bn = baseName(path)
      if (seen.has(bn)) continue
      seen.add(bn)
      assets.push({
        id: uuidv4(),
        type: 'character',
        sourceType: 'upload',
        url: dataUrl,
        label: bn.replace(/\.[^.]+$/, ''),
      })
    }
    if (assets.length > 0) {
      const base: InterfaceConfig =
        result.character.interfaceConfig ?? createInitialInterfaceConfig()
      result.character.interfaceConfig = { ...base, assets }
    }
  }

  const prof = result.character.imageUrl
  if (typeof prof === 'string' && !prof.startsWith('data:') && !prof.startsWith('http')) {
    const hit = assetDataUrls.get(prof) ?? assetDataUrls.get(baseName(prof))
    if (hit) {
      result.character.imageUrl = hit
      result.character.image_url = hit
    }
  }

  if (assetDataUrls.size > 0) {
    result.warnings.push(
      'CharX: card.json과 assets 폴더를 병합했습니다. 경로 불일치 시 이미지를 수동으로 확인하세요.'
    )
  }
  return result
}
