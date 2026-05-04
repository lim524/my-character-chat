'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'

const GUIDE_URL = '/ai-configuration-prompt-pack.md'

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fall through to execCommand */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function CreateAiGuideModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyFullDocument = async () => {
    if (!text?.length) return
    const ok = await copyTextToClipboard(text)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    if (ok) {
      setCopied(true)
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false)
        copiedTimerRef.current = null
      }, 3500)
    } else {
      alert('클립보드에 복사하지 못했습니다. 주소가 https 또는 localhost인지 확인하거나, 텍스트를 직접 선택해 복사해 주세요.')
    }
  }

  useEffect(() => {
    if (!open) return
    setCopied(false)
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = null
    }
    setError(null)
    setText(null)
    void fetch(GUIDE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(setText)
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex h-[min(88vh,calc(100dvh-2rem))] max-h-[88vh] w-full min-h-0 max-w-3xl flex-col overflow-hidden rounded-xl border border-[#333] bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#222] bg-[#0a0a0c] px-4 py-3">
          <h2 id="ai-guide-title" className="min-w-0 flex-1 text-sm font-semibold text-gray-100">
            AI 가이드 (설정·Regex·전역 UI 복붙용)
          </h2>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {copied ? (
              <span role="status" aria-live="polite" className="text-xs font-medium text-emerald-400">
                클립보드에 복사했습니다
              </span>
            ) : null}
            <button
              type="button"
              disabled={text === null || !!error}
              onClick={() => void copyFullDocument()}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                copied
                  ? 'border-emerald-600/80 bg-emerald-950/50 text-emerald-300'
                  : 'border-[#555] bg-[#151518] text-gray-100 hover:border-[#777] hover:bg-[#1e1e24]'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {copied ? <Check size={15} strokeWidth={2.5} className="text-emerald-400" /> : <Copy size={15} />}
              {copied ? '복사됨' : text === null ? '불러오는 중…' : '복사하기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#555] bg-[#151518] px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-[#1e1e24]"
            >
              닫기
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {!error && text === null ? (
            <p className="text-sm text-gray-500">불러오는 중…</p>
          ) : null}
          {text !== null ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-300">
              {text}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  )
}
