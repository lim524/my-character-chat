import Image from 'next/image'
import { CSSProperties, useState, useMemo, useEffect } from 'react'
import type { ScreenConfig, AssetRef, InterfaceConfig, RegexScriptEntry } from '@/lib/interfaceConfig'
import { applyRegexScripts } from '@/lib/interfaceRuntime'
import ExtraInterfaceOverlay from '@/components/ExtraInterfaceOverlay'
import MessageParser from '@/components/MessageParser'
import { DEFAULT_CHARACTER_LIFT_PX } from '@/lib/interfaceRuntime'
import { VN_DIALOGUE_BOX_CLASS } from '@/lib/vnDialogueStyles'
import { paginateAssistantContent, VN_DEFAULT_CHARS_PER_PAGE } from '@/lib/vnDialogPagination'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CustomStyleInjector from '@/components/CustomStyleInjector'

type Props = {
  screen: ScreenConfig | null
  assets: AssetRef[]
  uiTheme?: InterfaceConfig['uiTheme']
  extraInterfaceEntries?: InterfaceConfig['extraInterfaceEntries']
  regexScripts?: RegexScriptEntry[]
  customCSS?: string
  /**
   * 채팅 `ChatVnLayer`와 동일: 스프라이트 영역의 `bottom`(px).
   * `effectiveCharacterLiftPx` 결과를 넘기면 미리보기·채팅 위치가 일치합니다.
   */
  characterSpriteLiftPx?: number
}

function findAssetUrl(assets: AssetRef[], id?: string) {
  if (!id) return ''
  const found = assets.find((a) => a.id === id)
  return found?.url ?? ''
}

function isDataUrl(url: string) {
  return typeof url === 'string' && url.startsWith('data:')
}

export default function DatingSimScreenPreview({
  screen,
  assets,
  uiTheme,
  extraInterfaceEntries,
  regexScripts,
  customCSS,
  characterSpriteLiftPx = DEFAULT_CHARACTER_LIFT_PX,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0)
  const fullText = screen?.dialogue?.text || ''

  const pages = useMemo(() => {
    return paginateAssistantContent(fullText, VN_DEFAULT_CHARS_PER_PAGE)
  }, [fullText])

  useEffect(() => {
    setPageIndex(0)
  }, [fullText])

  // 단축키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pages.length <= 1) return
      // 입력창 등에 포커스가 가 있을 때는 무시 (Preview 페이지는 보통 사이드바 입력창이 있음)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return
      }

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        if (pageIndex < pages.length - 1) {
          e.preventDefault()
          setPageIndex((i) => i + 1)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        if (pageIndex > 0) {
          e.preventDefault()
          setPageIndex((i) => i - 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pageIndex, pages.length])

  const backgroundUrl = findAssetUrl(assets, screen?.background)
  
  const safeTheme = (uiTheme || {}) as Record<string, unknown>
  const {
    nameColor,
    textColor,
    chatBoxStyle,
    senderStyle,
    contentStyle,
    messageStyle,
    ...flatBoxStyles
  } = safeTheme
  
  const boxStyle = {
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    ...(flatBoxStyles as CSSProperties),
    ...((chatBoxStyle as CSSProperties | undefined) || {}),
  }
  const nameLabelStyle = {
    color: (typeof nameColor === 'string' ? nameColor : '#fbcfe8'),
    ...((senderStyle as CSSProperties | undefined) || {}),
  }
  const textBodyStyle = {
    color: (typeof textColor === 'string' ? textColor : '#f3f4f6'),
    ...((contentStyle as CSSProperties | undefined) || {}),
    ...((messageStyle as CSSProperties | undefined) || {}),
  }

  const displayContent = pages[pageIndex] || fullText

  return (
    <div className="relative w-full h-full min-h-[420px] max-h-[640px] bg-black rounded-xl overflow-hidden">
      <CustomStyleInjector css={customCSS} />
      {/* 배경 */}
      {backgroundUrl ? (
        <Image
          src={backgroundUrl}
          alt="배경"
          fill
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* 어둡게 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <ExtraInterfaceOverlay entries={extraInterfaceEntries} />

      {/* 캐릭터들 */}
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center gap-6 px-6 pointer-events-none"
        style={{ bottom: characterSpriteLiftPx }}
      >
        {(screen?.characters ?? []).map((ch) => {
          const url = findAssetUrl(assets, ch.assetId)
          if (!url) return null
          const baseClass =
            'relative w-44 h-[13.5rem] sm:w-52 sm:h-[17rem] md:w-60 md:h-[19rem] drop-shadow-[0_0_22px_rgba(0,0,0,0.85)]'
          const alignClass =
            ch.slot === 'left'
              ? 'self-end translate-x-[-40%]'
              : ch.slot === 'right'
              ? 'self-end translate-x-[40%]'
              : 'self-end'

          return (
            <div key={ch.assetId + ch.slot} className={`${baseClass} ${alignClass}`}>
              <Image
                src={url}
                alt={ch.expression || '캐릭터'}
                fill
                sizes="(max-width: 768px) 50vw, 30vw"
                className="object-contain object-bottom"
                unoptimized={isDataUrl(url)}
              />
            </div>
          )
        })}
      </div>

      {/* 대화 박스 */}
      <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 md:px-6 md:pb-6">
        <div 
          className={`${VN_DIALOGUE_BOX_CLASS} group ${pages.length > 1 ? 'cursor-pointer' : ''}`} 
          style={boxStyle as CSSProperties}
          onClick={() => {
            if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div 
              className="text-xs font-semibold tracking-wide"
              style={nameLabelStyle}
            >
              {screen?.dialogue?.speakerName || '???'}
            </div>
          </div>
          <div
            className={`text-sm md:text-base min-h-[3rem] leading-relaxed ${pages.length > 1 ? 'overflow-hidden' : 'whitespace-pre-wrap'}`}
            style={textBodyStyle}
          >
            <MessageParser
              content={displayContent}
              assets={assets}
              regexScripts={regexScripts}
            />
          </div>

          {pages.length > 1 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={pageIndex <= 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPageIndex((i) => Math.max(0, i - 1))
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-[10px] text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/15"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  이전
                </button>
                <span className="text-[10px] text-gray-400 tabular-nums min-w-[3rem] text-center">
                  {pageIndex + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPageIndex((i) => Math.min(pages.length - 1, i + 1))
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] text-white disabled:opacity-30 disabled:pointer-events-none transition-all ${
                    pageIndex < pages.length - 1 ? 'bg-[#e45463] animate-pulse-subtle' : 'bg-white/10'
                  }`}
                >
                  {pageIndex < pages.length - 1 ? '다음 (Space)' : '끝'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {screen?.choices && screen.choices.length > 0 && (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {screen.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="text-left text-xs md:text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 transition"
                >
                  {applyRegexScripts(choice.label, regexScripts, 'modify_display')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

