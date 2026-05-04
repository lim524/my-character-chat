'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  createEmptyGlobalUiLayer,
  dispatchGlobalUiLayersUpdated,
  type GlobalUiLayer,
  getGlobalUiLayers,
  setGlobalUiLayers,
} from '@/lib/globalUiLayers'

type Props = {
  /** `create`: 캐릭터 생성 사이드바용 문구·간격 */
  variant?: 'settings' | 'create'
  /** 제어 모드: 부모가 상태 소유 (캐릭터 저장·카드 연동) */
  layers?: GlobalUiLayer[]
  onLayersChange?: (layers: GlobalUiLayer[]) => void
  /** false면 하단 「전역 인터페이스 저장」 숨김 (캐릭터 저장과 통합 시) */
  showSaveButton?: boolean
}

export default function GlobalUiLayersEditor({
  variant = 'settings',
  layers: controlledLayers,
  onLayersChange,
  showSaveButton = true,
}: Props) {
  const [internalLayers, setInternalLayers] = useState<GlobalUiLayer[]>([])
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)

  const isControlled = controlledLayers !== undefined && onLayersChange !== undefined
  const uiLayers = isControlled ? controlledLayers : internalLayers

  const updateLayers = useCallback(
    (next: GlobalUiLayer[] | ((prev: GlobalUiLayer[]) => GlobalUiLayer[])) => {
      if (isControlled) {
        const resolved =
          typeof next === 'function' ? next(controlledLayers!) : next
        onLayersChange!(resolved)
      } else {
        setInternalLayers((prev) => (typeof next === 'function' ? next(prev) : next))
      }
    },
    [isControlled, controlledLayers, onLayersChange]
  )

  useEffect(() => {
    if (!isControlled) {
      void getGlobalUiLayers().then(setInternalLayers)
    }
  }, [isControlled])

  const saveUiLayers = async () => {
    try {
      await setGlobalUiLayers(uiLayers)
      dispatchGlobalUiLayersUpdated()
      alert(variant === 'create' ? '전역 인터페이스가 저장되었습니다.' : '전역 인터페이스 설정이 저장되었습니다.')
    } catch (e) {
      console.error(e)
      alert('전역 인터페이스 설정을 저장하지 못했습니다.')
    }
  }

  const addUiLayer = () => {
    const row = createEmptyGlobalUiLayer()
    row.name = `레이어 ${uiLayers.length + 1}`
    updateLayers((prev) => [...prev, row])
    setExpandedLayerId(row.id)
  }

  const removeUiLayer = (id: string) => {
    if (!confirm('이 항목을 삭제할까요?')) return
    updateLayers((prev) => prev.filter((l) => l.id !== id))
    if (expandedLayerId === id) setExpandedLayerId(null)
  }

  const patchUiLayer = (id: string, patch: Partial<GlobalUiLayer>) => {
    updateLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const moveUiLayer = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= uiLayers.length) return
    updateLayers((prev) => {
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const compact = variant === 'create'

  const borderWrap = compact ? 'border-[#333]' : 'border-gray-600'
  const theadBg = compact ? 'bg-[#111]' : 'bg-[#2a2a2a]'
  const rowHover = compact ? 'hover:bg-[#111]' : 'hover:bg-[#333]/60'
  const openBg = compact ? 'bg-[#0f0f12]' : 'bg-[#2f2f2f]'
  const detailBg = compact ? 'bg-[#0b0b0f]' : 'bg-[#252525]'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-lg'}`}>
          전역 인터페이스 (HTML / CSS / JS)
        </h2>
        <button
          type="button"
          onClick={addUiLayer}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs ${
            compact
              ? 'border-[#444] hover:border-white text-gray-200'
              : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          <Plus size={14} /> 항목 추가
        </button>
      </div>
      <p className={`text-gray-400 ${compact ? 'text-[11px] leading-relaxed' : 'text-sm'}`}>
        {compact ? (
          <>
            왼쪽 미리보기와 저장한 캐릭터 채팅에 적용됩니다. 설정은 이 캐릭터 드래프트에만 저장되어, 새로 만들 작업과 이전
            캐릭터의 전역 UI가 섞이지 않습니다. 위에서부터 순서대로 CSS → HTML → JavaScript입니다.
          </>
        ) : (
          <>앱 전역 설정(설정 페이지·레거시 캐릭터)에 적용됩니다.</>
        )}{' '}
        행을 눌러 펼치고, HTML 안의{' '}
        <code className={compact ? 'text-[10px] bg-[#222] px-1 rounded' : 'bg-[#333] px-1 rounded'}>
          &lt;script&gt;
        </code>
        는 제거되니 스크립트는 JavaScript 칸에 넣어 주세요.
        {isControlled && !showSaveButton ? (
          <>
            {' '}
            <span className="text-gray-300">
              캐릭터 저장(Ctrl+S) 시 캐릭터 데이터에 포함되며, 카드 JSON 내보내기·가져오기에도 함께 실립니다.
            </span>
          </>
        ) : null}
      </p>

      <div className={`border ${borderWrap} rounded-lg overflow-hidden`}>
        <table className="w-full text-xs">
          <thead className={`${theadBg} text-gray-400`}>
            <tr>
              <th className="w-8 px-2 py-2 text-left" />
              <th className="px-2 py-2 text-left min-w-[100px]">이름</th>
              <th className="w-16 px-2 py-2 text-center">사용</th>
              <th className="w-10 px-2 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {uiLayers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  항목이 없습니다. &quot;항목 추가&quot;로 레이어를 만드세요.
                </td>
              </tr>
            ) : (
              uiLayers.map((layer, idx) => {
                const open = expandedLayerId === layer.id
                return (
                  <Fragment key={layer.id}>
                    <tr
                      onClick={() => setExpandedLayerId((p) => (p === layer.id ? null : layer.id))}
                      className={`border-t border-[#222] cursor-pointer ${rowHover} ${open ? openBg : ''}`}
                    >
                      <td className="px-2 py-2 align-middle text-gray-500">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          value={layer.name}
                          onChange={(e) => patchUiLayer(layer.id, { name: e.target.value })}
                          className={`w-full rounded px-2 py-1 border ${
                            compact ? 'bg-[#111] border-[#333]' : 'bg-[#333] border-gray-600 text-white'
                          }`}
                          placeholder="레이어 이름"
                        />
                      </td>
                      <td
                        className="px-2 py-2 text-center"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <label className="inline-flex items-center gap-1 text-[11px] text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={layer.enabled}
                            onChange={(e) => patchUiLayer(layer.id, { enabled: e.target.checked })}
                          />
                        </label>
                      </td>
                      <td className="px-2 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => removeUiLayer(layer.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className={`border-t border-[#222] ${detailBg}`}>
                        <td colSpan={4} className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[10px] text-gray-500">순서</span>
                            <button
                              type="button"
                              title="위로"
                              disabled={idx === 0}
                              onClick={() => moveUiLayer(idx, -1)}
                              className="px-2 py-0.5 text-[10px] rounded bg-[#333] border border-[#444] disabled:opacity-40 hover:border-gray-500"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              title="아래로"
                              disabled={idx === uiLayers.length - 1}
                              onClick={() => moveUiLayer(idx, 1)}
                              className="px-2 py-0.5 text-[10px] rounded bg-[#333] border border-[#444] disabled:opacity-40 hover:border-gray-500"
                            >
                              ↓
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1">CSS</label>
                              <textarea
                                value={layer.css}
                                onChange={(e) => patchUiLayer(layer.id, { css: e.target.value })}
                                spellCheck={false}
                                rows={compact ? 5 : 6}
                                className={`w-full px-2 py-1.5 rounded text-[11px] font-mono text-gray-200 outline-none border ${
                                  compact
                                    ? 'bg-[#090909] border-[#333]'
                                    : 'bg-[#111] border-gray-600'
                                }`}
                                placeholder="/* 전역 CSS */"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1">HTML</label>
                              <textarea
                                value={layer.html}
                                onChange={(e) => patchUiLayer(layer.id, { html: e.target.value })}
                                spellCheck={false}
                                rows={compact ? 4 : 5}
                                className={`w-full px-2 py-1.5 rounded text-[11px] font-mono text-gray-200 outline-none border ${
                                  compact
                                    ? 'bg-[#090909] border-[#333]'
                                    : 'bg-[#111] border-gray-600'
                                }`}
                                placeholder="<!-- 오버레이 마크업 -->"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1">JavaScript</label>
                              <textarea
                                value={layer.javascript}
                                onChange={(e) =>
                                  patchUiLayer(layer.id, { javascript: e.target.value })
                                }
                                spellCheck={false}
                                rows={compact ? 4 : 5}
                                className={`w-full px-2 py-1.5 rounded text-[11px] font-mono text-gray-200 outline-none border ${
                                  compact
                                    ? 'bg-[#090909] border-[#333]'
                                    : 'bg-[#111] border-gray-600'
                                }`}
                                placeholder="// 전역 스크립트"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showSaveButton ? (
        <button
          type="button"
          onClick={() => void saveUiLayers()}
          className="w-full bg-white/90 text-black font-semibold py-2 rounded text-sm hover:bg-white transition"
        >
          전역 인터페이스 저장
        </button>
      ) : null}
    </div>
  )
}
