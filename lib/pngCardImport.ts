/**
 * PNG 캐릭터 카드의 tEXt/zTXt `chara` / `ccv3` 등에서 JSON 추출.
 */

import { inflateSync, unzlibSync } from 'fflate'
import { importCardToLocalCharacter, type ImportCardResult } from './characterCardInterop'

function readPngChunks(buffer: ArrayBuffer): { type: string; data: Uint8Array }[] {
  const u = new Uint8Array(buffer)
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (u[i] !== sig[i]) throw new Error('PNG 시그니처가 아닙니다.')
  }
  const chunks: { type: string; data: Uint8Array }[] = []
  let o = 8
  while (o + 12 <= u.length) {
    const len =
      (u[o] << 24) | (u[o + 1] << 16) | (u[o + 2] << 8) | u[o + 3]
    o += 4
    const type = String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3])
    o += 4
    const data = u.subarray(o, o + len)
    o += len + 4
    chunks.push({ type, data })
    if (type === 'IEND') break
  }
  return chunks
}

function decodeLatin1(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return s
}

/** tEXt: keyword\\0 text */
function parseTextChunk(data: Uint8Array): { keyword: string; text: string } | null {
  const z = data.indexOf(0)
  if (z < 0) return null
  const keyword = decodeLatin1(data.subarray(0, z))
  const text = decodeLatin1(data.subarray(z + 1))
  return { keyword, text }
}

/** zTXt: keyword\\0 compression(0)\\0 compressed */
function parseZtxtChunk(data: Uint8Array): { keyword: string; text: string } | null {
  const z = data.indexOf(0)
  if (z < 0) return null
  const keyword = decodeLatin1(data.subarray(0, z))
  if (data[z + 1] !== 0) return null
  const compressed = data.subarray(z + 2)
  try {
    const inflated = inflateSync(compressed)
    return { keyword, text: new TextDecoder('utf-8').decode(inflated) }
  } catch {
    try {
      const inflated = unzlibSync(compressed)
      return { keyword, text: new TextDecoder('utf-8').decode(inflated) }
    } catch {
      return null
    }
  }
}

function decodeCharaBase64Payload(b64: string): unknown {
  const clean = b64.replace(/\s/g, '')
  let bin: Uint8Array
  try {
    bin = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0))
  } catch {
    throw new Error('chara/ccv3 Base64가 올바르지 않습니다.')
  }
  const tryJson = (u: Uint8Array) => JSON.parse(new TextDecoder('utf-8').decode(u))
  try {
    return tryJson(bin)
  } catch {
    try {
      return tryJson(unzlibSync(bin))
    } catch {
      try {
        return tryJson(inflateSync(bin))
      } catch {
        throw new Error('chara/ccv3 압축·JSON 파싱에 실패했습니다.')
      }
    }
  }
}

function extractCardJsonFromChunks(chunks: { type: string; data: Uint8Array }[]): unknown {
  for (const ch of chunks) {
    if (ch.type === 'tEXt') {
      const p = parseTextChunk(ch.data)
      if (!p) continue
      if (p.keyword === 'chara' || p.keyword === 'ccv3' || p.keyword === 'Chara') {
        return decodeCharaBase64Payload(p.text)
      }
    }
    if (ch.type === 'zTXt') {
      const p = parseZtxtChunk(ch.data)
      if (p && (p.keyword === 'chara' || p.keyword === 'ccv3' || p.keyword === 'Chara')) {
        return JSON.parse(p.text)
      }
    }
  }
  throw new Error('PNG에 chara/ccv3 텍스트 청크가 없습니다.')
}

export function importPngCharacterCard(buffer: ArrayBuffer): ImportCardResult {
  const chunks = readPngChunks(buffer)
  const json = extractCardJsonFromChunks(chunks)
  return importCardToLocalCharacter(json)
}
