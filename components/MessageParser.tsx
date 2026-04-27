import React from 'react'
import type { AssetRef, RegexScriptEntry } from '@/lib/interfaceConfig'
import {
  normalizeImageControlTags,
  parseImageTags,
  resolveAssetByRef,
  splitRefAndType,
} from '@/lib/chatImageTags'

interface MessageParserProps {
  content: string
  assets: AssetRef[]
  regexScripts?: RegexScriptEntry[]
  showControlTags?: boolean
}

export default function MessageParser({
  content,
  assets,
  regexScripts,
  showControlTags = false,
}: MessageParserProps) {
  const renderStyledText = (text: string, keyPrefix: string): React.ReactNode[] => {
    const out: React.ReactNode[] = []
    const tokenRegex = /(\*\*[\s\S]+?\*\*|\*[\s\S]+?\*)/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = tokenRegex.exec(text)) !== null) {
      if (m.index > last) {
        out.push(
          <span key={`${keyPrefix}-plain-${last}`} className="text-inherit">
            {text.slice(last, m.index)}
          </span>
        )
      }
      const token = m[0]
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        out.push(
          <strong key={`${keyPrefix}-bold-${m.index}`} className="font-bold text-blue-400">
            {token.slice(2, -2)}
          </strong>
        )
      } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        out.push(
          <em key={`${keyPrefix}-narr-${m.index}`} className="opacity-65 not-italic">
            {token.slice(1, -1)}
          </em>
        )
      } else {
        out.push(<span key={`${keyPrefix}-raw-${m.index}`}>{token}</span>)
      }
      last = tokenRegex.lastIndex
    }
    if (last < text.length) {
      out.push(
        <span key={`${keyPrefix}-plain-tail`} className="text-inherit">
          {text.slice(last)}
        </span>
      )
    }
    return out
  }

  // Regex to match trailing JSON payload `{ "key": 100 }`
  const jsonRegex = /({[\s\S]*?})$/

  let displayContent = normalizeImageControlTags(content, regexScripts)

  // Extract JSON if it exists at the end (for UI display purposes, if needed)
  const jsonMatch = displayContent.match(jsonRegex)
  if (jsonMatch) {
    try {
      const maybeJson = JSON.parse(jsonMatch[1])
      if (typeof maybeJson === 'object' && maybeJson !== null) {
        // Strip out the JSON from the display text
        displayContent = displayContent.replace(jsonRegex, '').trim()
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  const segments: React.ReactNode[] = []
  let lastIndex = 0
  const tags = parseImageTags(displayContent)
  const rawTagRegex = /<img\s*=\s*([^>]+?)\s*>/gi
  let match: RegExpExecArray | null

  while ((match = rawTagRegex.exec(displayContent)) !== null) {
    if (match.index > lastIndex) {
      const plain = displayContent.slice(lastIndex, match.index)
      segments.push(...renderStyledText(plain, `text-${lastIndex}`))
    }

    const tagContent = tags.shift()?.rawRef ?? match[1]
    const { ref: assetRef, typeHint } = splitRefAndType(tagContent)
    const asset = resolveAssetByRef(assets, assetRef)

    if (asset && asset.url) {
      if (asset.type === 'background' || typeHint === 'background') {
        if (showControlTags) {
          segments.push(<span key={`ctrl-${match.index}`} className="text-xs text-cyan-300">&lt;img-src={assetRef}:background&gt;</span>)
        }
      } else if (asset.type === 'character' || typeHint === 'character') {
        if (showControlTags) {
          segments.push(<span key={`ctrl-${match.index}`} className="text-xs text-pink-300">&lt;img-src={assetRef}:character&gt;</span>)
        }
      } else if (asset.type === 'ui' || typeHint === 'etc' || typeHint === 'overlay' || typeHint === 'ui') {
        if (showControlTags) {
          segments.push(<span key={`ctrl-${match.index}`} className="text-xs text-yellow-300">&lt;img-src={assetRef}:etc&gt;</span>)
        }
      } else {
        // 그 외엔 인라인 이미지로 렌더링
        segments.push(
          <div key={`img-${match.index}`} className="inline-block my-2 mx-1 align-bottom max-w-md sm:max-w-lg">
            <img 
              src={asset.url} 
              alt={asset.label || assetRef}
              className="rounded-lg object-contain w-full h-auto shadow-md"
            />
          </div>
        )
      }
    } else {
      // 에셋을 찾을 수 없는 경우
      if (showControlTags) {
        segments.push(
          <span key={`broken-${match.index}`} className="text-xs text-red-300">
            &lt;img-src={assetRef}{typeHint ? `:${typeHint}` : ''}&gt;
          </span>
        )
      } else {
        segments.push(<span key={`broken-${match.index}`} className="opacity-50 text-xs text-red-400">[이미지 없음: {assetRef}]</span>)
      }
    }

    lastIndex = rawTagRegex.lastIndex
  }

  if (lastIndex < displayContent.length) {
    segments.push(...renderStyledText(displayContent.slice(lastIndex), `text-${lastIndex}`))
  }

  return <>{segments.length > 0 ? segments : displayContent}</>
}
