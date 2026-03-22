import React, { useEffect } from 'react'
import type { AssetRef, RegexScriptEntry } from '@/lib/interfaceConfig'
import { applyRegexScripts } from '@/lib/interfaceRuntime'

interface MessageParserProps {
  content: string
  assets: AssetRef[]
  regexScripts?: RegexScriptEntry[]
  onBackgroundChange?: (url: string) => void
  onStatsChange?: (stats: Record<string, number>) => void
  onCharacterChange?: (url: string) => void
}

export default function MessageParser({
  content,
  assets,
  regexScripts,
  onBackgroundChange,
  onStatsChange,
  onCharacterChange,
}: MessageParserProps) {
  // Regex to match <img=assetId> or <img=assetId:type>
  const tagRegex = /<img=([^>]+)>/g

  // Regex to match trailing JSON payload `{ "key": 100 }`
  const jsonRegex = /({[\s\S]*?})$/

  let displayContent = applyRegexScripts(content, regexScripts, 'modify_display')
  let parsedStats: Record<string, number> | null = null

  // Extract JSON if it exists at the end
  const jsonMatch = content.match(jsonRegex)
  if (jsonMatch) {
    try {
      const maybeJson = JSON.parse(jsonMatch[1])
      if (typeof maybeJson === 'object' && maybeJson !== null) {
        parsedStats = maybeJson as Record<string, number>
        // Strip out the JSON from the display text
        displayContent = content.replace(jsonRegex, '').trim()
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  const segments: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  let detectedBgUrl: string | null = null
  let detectedCharUrl: string | null = null

  while ((match = tagRegex.exec(displayContent)) !== null) {
    if (match.index > lastIndex) {
      segments.push(<span key={`text-${lastIndex}`}>{displayContent.slice(lastIndex, match.index)}</span>)
    }

    const tagContent = match[1]
    const [assetId, typeHint] = tagContent.split(':')
    const asset = assets.find((a) => a.id === assetId)

    if (asset && asset.url) {
      if (asset.type === 'background' || typeHint === 'background') {
        detectedBgUrl = asset.url
        // Don't render anything inline for background tags
      } else {
        const isCharacter = asset.type === 'character' || typeHint === 'character'
        if (isCharacter) {
          detectedCharUrl = asset.url
          // Don't render inline for character tags either!
        } else {
          // Render etc inline
          segments.push(
            <div key={`img-${match.index}`} className="inline-block my-2 mx-1 align-bottom max-w-xs">
              <img 
                src={asset.url} 
                alt={asset.label || assetId} 
                className="rounded-lg object-contain w-full h-auto shadow-md"
              />
            </div>
          )
        }
      }
    } else {
      // If asset not found, render the raw tag to debug or hide it. Let's hide it or show broken text
      segments.push(<span key={`broken-${match.index}`} className="opacity-50 text-xs text-red-400">[이미지 없음: {assetId}]</span>)
    }

  lastIndex = tagRegex.lastIndex
  }

  if (lastIndex < displayContent.length) {
    segments.push(<span key={`text-${lastIndex}`}>{displayContent.slice(lastIndex)}</span>)
  }

  useEffect(() => {
    if (detectedBgUrl && onBackgroundChange) {
      onBackgroundChange(detectedBgUrl)
    }
    if (detectedCharUrl && onCharacterChange) {
      onCharacterChange(detectedCharUrl)
    }
    if (parsedStats && onStatsChange) {
      onStatsChange(parsedStats)
    }
  }, [detectedBgUrl, detectedCharUrl, parsedStats, onBackgroundChange, onCharacterChange, onStatsChange])

  return <>{segments.length > 0 ? segments : displayContent}</>
}
