/**
 * VN 대화창용: 긴 assistant 메시지를 여러 "페이지"로 나눔.
 * `<img=...>` 태그 중간에서 잘리지 않도록 안전한 경계만 사용.
 */

const DEFAULT_MAX_CHARS = 160
const DEFAULT_MAX_LINES = 3

/** 인덱스 i 앞에서 자를 수 있는지 (`<` … `>` 안이 아님) */
function isSafeCutBefore(text: string, i: number): boolean {
  if (i <= 0 || i > text.length) return false
  const before = text.slice(0, i)
  const lastOpen = before.lastIndexOf('<')
  const lastClose = before.lastIndexOf('>')
  if (lastOpen > lastClose) return false
  return true
}

/** [start, end) 구간에서 역방향으로 안전한 자르기 위치 탐색 */
function findBackwardSafeCut(text: string, start: number, preferredEnd: number): number {
  const max = Math.min(preferredEnd, text.length)
  const min = start + Math.floor((max - start) * 0.35)
  
  // 1. Newlines
  for (let i = max; i >= min; i--) {
    if (!isSafeCutBefore(text, i)) continue
    if (text[i - 1] === '\n') return i
  }
  // 2. Sentence terminators
  for (let i = max; i >= min; i--) {
    if (!isSafeCutBefore(text, i)) continue
    const prev = text[i - 1]
    if (['.', '!', '?', '~', '”', '"'].includes(prev) && (i === text.length || /\s/.test(text[i]))) {
      return i
    }
  }
  // 3. Spaces
  for (let i = max; i >= min; i--) {
    if (!isSafeCutBefore(text, i)) continue
    if (text[i - 1] === ' ') return i
  }
  // 4. Any safe index
  for (let i = max; i >= min; i--) {
    if (isSafeCutBefore(text, i)) return i
  }
  return max
}

/**
 * assistant 원문 → 페이지 배열 (빈 문자열 제외)
 */
export function paginateAssistantContent(
  content: string,
  maxCharsPerPage: number = DEFAULT_MAX_CHARS,
  maxLinesPerPage: number = DEFAULT_MAX_LINES
): string[] {
  const trimmed = content ?? ''
  if (!trimmed) return ['']

  const pages: string[] = []
  let start = 0
  
  while (start < trimmed.length) {
    let hardEnd = Math.min(start + maxCharsPerPage, trimmed.length)
    
    // Constrain by max line count
    let lineCount = 0
    let lineEnd = start
    while (lineEnd < trimmed.length && lineEnd < hardEnd) {
      if (trimmed[lineEnd] === '\n') {
        lineCount++
        if (lineCount >= maxLinesPerPage) {
          lineEnd++
          break
        }
      }
      lineEnd++
    }
    
    if (lineCount >= maxLinesPerPage) {
      hardEnd = Math.min(hardEnd, lineEnd)
    }

    if (hardEnd >= trimmed.length) {
      pages.push(trimmed.slice(start))
      break
    }

    let cut = findBackwardSafeCut(trimmed, start, hardEnd)
    if (cut <= start) cut = hardEnd
    
    // Perfect cut if triggered by max lines
    if (lineCount >= maxLinesPerPage && hardEnd === lineEnd) {
      cut = hardEnd
    }

    const pageText = trimmed.slice(start, cut).trimStart()
    pages.push(pageText)
    start = cut
  }
  
  return pages.map(p => p.trimEnd()).filter((p) => p.length > 0 || p.includes('<img='))
}

export { DEFAULT_MAX_CHARS as VN_DEFAULT_CHARS_PER_PAGE }
