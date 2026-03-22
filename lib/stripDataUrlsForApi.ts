/**
 * Vercel Serverless Functions 요청/응답 본문 제한(약 4.5MB) 대응.
 * 로컬에만 있는 base64(data:) 이미지가 characterInfo·번들 등에 들어 있으면
 * /api/chat POST 한 번에 수 MB가 쉽게 넘어갑니다. (로어북 여부와 무관)
 *
 * 서버(/api/chat)는 에셋의 url 바이트가 아니라 id·label·type만 쓰므로 data: URL은 제거해도 됩니다.
 */
export function stripDataUrlsFromJsonValue(value: unknown, depth = 24): unknown {
  if (depth <= 0) return value
  if (typeof value === 'string') {
    if (value.startsWith('data:')) return ''
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripDataUrlsFromJsonValue(v, depth - 1))
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = stripDataUrlsFromJsonValue(v, depth - 1)
    }
    return out
  }
  return value
}
