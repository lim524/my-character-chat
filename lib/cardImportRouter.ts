import { importCardToLocalCharacter, type ImportCardResult } from './characterCardInterop'
import { importCharxArrayBuffer } from './charxImport'
import { importPngCharacterCard } from './pngCardImport'

function isPngMagic(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf)
  return u.length >= 8 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47
}

function isZipMagic(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf)
  return u.length >= 4 && u[0] === 0x50 && u[1] === 0x4b
}

/** 파일 확장자·시그니처로 CharX / PNG / JSON 카드 가져오기 */
export async function importCharacterFromFile(file: File): Promise<ImportCardResult> {
  const name = file.name.toLowerCase()
  const buf = await file.arrayBuffer()

  if (name.endsWith('.charx') || (isZipMagic(buf) && (name.endsWith('.zip') || name.endsWith('.charx')))) {
    return importCharxArrayBuffer(buf)
  }

  if (name.endsWith('.png') || isPngMagic(buf)) {
    return importPngCharacterCard(buf)
  }

  const text = new TextDecoder('utf-8').decode(buf)
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('JSON 카드를 파싱할 수 없습니다.')
  }
  return importCardToLocalCharacter(json)
}
