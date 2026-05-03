'use client'

import { useEffect, useState } from 'react'

const GUIDE_URL = '/ai-configuration-prompt-pack.md'

export default function CreateAiGuideModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
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
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-[#333] bg-[#0a0a0c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#222] px-4 py-3">
          <h2 id="ai-guide-title" className="text-sm font-semibold text-gray-100">
            AI 가이드 (설정·Regex·전역 UI 복붙용)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#444] px-3 py-1 text-xs text-gray-300 hover:bg-[#222]"
          >
            닫기
          </button>
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
