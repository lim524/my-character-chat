import React, { useState, useRef } from 'react'
import { Plus, Upload, Download, X, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { ModuleBundle } from '@/lib/appSettings'
import { DEFAULT_MODULES_CONFIG } from '@/lib/appSettings'
import { parseModuleToggleControls } from '@/lib/moduleToggleParser'
import { 
  parseExternalModuleBundle, 
  parseRisuModuleFile,
  parseZipToBundles
} from '@/lib/externalImportUtils'

interface Props {
  moduleBundles: ModuleBundle[]
  setModuleBundlesState: React.Dispatch<React.SetStateAction<ModuleBundle[]>>
  isChatMode?: boolean
}

export function ModuleSettingsTab({ moduleBundles, setModuleBundlesState, isChatMode }: Props) {
  const moduleImportRef = useRef<HTMLInputElement | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [moduleDraft, setModuleDraft] = useState<ModuleBundle | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'lorebook' | 'regex' | 'assets'>('basic')

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">모듈 번들</h2>
        <p className="text-sm text-gray-400 mt-2">
          번들을 생성/관리하고 활성화(복수)할 수 있습니다.
        </p>
      </div>

      {!isChatMode && (
        <div className="flex items-center justify-center gap-2">
          <button
          onClick={() => {
            const id = uuidv4()
            setEditingModuleId(id)
            setActiveTab('basic')
            setModuleDraft({
              id,
              name: '',
              description: '',
              enabled: true,
              lorebook: { ...DEFAULT_MODULES_CONFIG.lorebook },
              regex: { ...DEFAULT_MODULES_CONFIG.regex },
              assets: { ...DEFAULT_MODULES_CONFIG.assets },
            })
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Plus className="w-4 h-4" />
          생성
        </button>
        <button
          onClick={() => moduleImportRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => downloadJson('modules-bundles.json', moduleBundles)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <input
          ref={moduleImportRef}
          type="file"
          accept="*/*,.json,.zip,.charx,.risum"
          className="hidden"
          multiple
          onChange={async (e) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            const newBundles: ModuleBundle[] = []
            for (let i = 0; i < files.length; i++) {
              const file = files[i]
              const fileName = file.name.toLowerCase()

              if (fileName.endsWith('.risum')) {
                try {
                  const m = await parseRisuModuleFile(file)
                  if (m) {
                    newBundles.push(m)
                    continue
                  }
                  console.warn(`Failed to parse ${file.name} as native risum, trying as ZIP.`)
                } catch (err) {
                  console.warn(`Failed to parse ${file.name} as native risum, trying as ZIP. Error:`, err)
                }
              }

              if (fileName.endsWith('.json') || fileName.endsWith('.charx')) {
                let parsedAsJson = false
                try {
                  const rawText = await file.text()
                  const text = rawText.replace(/^\uFEFF/, '') // BOM 제거
                  const json = JSON.parse(text)
                  parsedAsJson = true
                  const arr = Array.isArray(json) ? json : [json]
                  arr.forEach((x: unknown) => {
                    const m = parseExternalModuleBundle(x, file.name)
                    if (m) newBundles.push(m)
                  })
                } catch (err) {
                  console.warn(`Failed to parse ${file.name} as JSON, trying as ZIP. Error:`, err)
                }
                
                if (parsedAsJson) continue
              }

              if (fileName.endsWith('.zip') || fileName.endsWith('.charx') || fileName.endsWith('.risum')) {
                try {
                  const { modules } = await parseZipToBundles(file)
                  newBundles.push(...modules)
                } catch (err) {
                  console.error(`Failed to parse ${file.name} as zip/charx/risum:`, err)
                }
              }
            }
            if (newBundles.length > 0) {
              setModuleBundlesState(prev => [...prev, ...newBundles])
            }
            e.target.value = ''
          }}
        />
      </div>
      )}

      {editingModuleId && moduleDraft ? (
        <div className="bg-[#202020] border border-[#333] rounded-lg p-4 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="font-semibold">번들 편집</div>
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => {
                setEditingModuleId(null)
                setModuleDraft(null)
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-[#333] mb-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'basic', label: '기본 정보' },
              { id: 'lorebook', label: '로어북' },
              { id: 'regex', label: '정규식 스크립트' },
              { id: 'assets', label: '추가 에셋' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#e45463] text-[#e45463]'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-[#555]'
                }`}
                onClick={() => setActiveTab(tab.id as 'basic' | 'lorebook' | 'regex' | 'assets')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">모듈 이름</label>
                    <input
                      value={moduleDraft.name}
                      onChange={(e) => setModuleDraft({ ...moduleDraft, name: e.target.value })}
                      placeholder="모듈의 이름을 입력하세요"
                      className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={moduleDraft.enabled}
                        onChange={() => setModuleDraft({ ...moduleDraft, enabled: !moduleDraft.enabled })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                      />
                      채팅방 활성화 기본값
                    </label>
                    <button
                      onClick={() => downloadJson(`module-bundle-${moduleDraft.id}.json`, moduleDraft)}
                      className="text-sm px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                      title="단일 모듈 Export"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">설명</label>
                  <textarea
                    value={moduleDraft.description}
                    onChange={(e) => setModuleDraft({ ...moduleDraft, description: e.target.value })}
                    placeholder="이 모듈이 어떤 역할을 하는지 설명해 주세요"
                    rows={3}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white resize-none placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Risu Toggle Spec (customModuleToggle)</label>
                  <textarea
                    value={moduleDraft.customModuleToggle || ''}
                    onChange={(e) => setModuleDraft({ ...moduleDraft, customModuleToggle: e.target.value })}
                    placeholder="key=label 또는 key=label=select=opt1,opt2"
                    rows={4}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white resize-y font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {activeTab === 'lorebook' && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-gray-200">로어북 데이터 (JSON)</div>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={moduleDraft.lorebook.enabled}
                      onChange={() =>
                        setModuleDraft({
                          ...moduleDraft,
                          lorebook: { ...moduleDraft.lorebook, enabled: !moduleDraft.lorebook.enabled },
                        })
                      }
                      className="w-4 h-4"
                    />
                    모듈 로어북 사용
                  </label>
                </div>
                <textarea
                  value={JSON.stringify(moduleDraft.lorebook.entries ?? [], null, 2)}
                  onChange={(e) => {
                    try {
                      const entries = JSON.parse(e.target.value)
                      if (Array.isArray(entries)) {
                        setModuleDraft({
                          ...moduleDraft,
                          lorebook: { ...moduleDraft.lorebook, entries },
                        })
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  rows={14}
                  className="w-full px-3 py-2 bg-[#222] border border-[#444] rounded text-white text-xs font-mono resize-y min-h-[200px]"
                />
              </div>
            )}

            {activeTab === 'regex' && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-gray-200">정규식 스크립트 데이터 (JSON)</div>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={moduleDraft.regex.enabled}
                      onChange={() =>
                        setModuleDraft({
                          ...moduleDraft,
                          regex: { ...moduleDraft.regex, enabled: !moduleDraft.regex.enabled },
                        })
                      }
                      className="w-4 h-4"
                    />
                    모듈 정규식 사용
                  </label>
                </div>
                <textarea
                  value={JSON.stringify(moduleDraft.regex.rules ?? [], null, 2)}
                  onChange={(e) => {
                    try {
                      const rules = JSON.parse(e.target.value)
                      if (Array.isArray(rules)) {
                        setModuleDraft({
                          ...moduleDraft,
                          regex: { ...moduleDraft.regex, rules },
                        })
                      }
                    } catch {}
                  }}
                  rows={14}
                  className="w-full px-3 py-2 bg-[#222] border border-[#444] rounded text-white text-xs font-mono resize-y min-h-[200px]"
                />
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-gray-200">추가 에셋 데이터 (JSON)</div>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={moduleDraft.assets.enabled}
                      onChange={() =>
                        setModuleDraft({
                          ...moduleDraft,
                          assets: { ...moduleDraft.assets, enabled: !moduleDraft.assets.enabled },
                        })
                      }
                      className="w-4 h-4"
                    />
                    모듈 에셋 사용
                  </label>
                </div>
                <textarea
                  value={JSON.stringify(moduleDraft.assets.items ?? [], null, 2)}
                  onChange={(e) => {
                    try {
                      const items = JSON.parse(e.target.value)
                      if (Array.isArray(items)) {
                        setModuleDraft({
                          ...moduleDraft,
                          assets: { ...moduleDraft.assets, items },
                        })
                      }
                    } catch {}
                  }}
                  rows={14}
                  className="w-full px-3 py-2 bg-[#222] border border-[#444] rounded text-white text-xs font-mono resize-y min-h-[200px]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setModuleBundlesState((prev) => {
                  const exists = prev.some((b) => b.id === moduleDraft.id)
                  return exists
                    ? prev.map((b) => (b.id === moduleDraft.id ? moduleDraft : b))
                    : [moduleDraft, ...prev]
                })
                setEditingModuleId(null)
                setModuleDraft(null)
              }}
              className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {moduleBundles.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10 bg-[#222] rounded-xl border border-dashed border-[#444]">
              아직 번들이 없습니다. “생성”을 눌러 추가하세요.
            </div>
          ) : (
            moduleBundles.map((b) => (
              <div key={b.id} className="bg-[#202020] border border-[#333] rounded-xl p-4 hover:border-[#444] transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-white transition-colors">
                      {b.name || '이름 없음'}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{b.description || '설명 없음'}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        setModuleBundlesState((prev) =>
                          prev.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x))
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title={b.enabled ? '전체 비활성화' : '전체 활성화'}
                    >
                      {b.enabled ? <ToggleRight className="w-6 h-6 text-[#e45463]" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    {!isChatMode && (
                      <>
                        <button
                          onClick={() => {
                            setEditingModuleId(b.id)
                            setActiveTab('basic')
                            setModuleDraft(b)
                          }}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          title="편집"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => downloadJson(`module-bundle-${b.id}.json`, b)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          title="단일 Export"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('이 번들을 삭제할까요?')) return
                            setModuleBundlesState((prev) => prev.filter((x) => x.id !== b.id))
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 채팅방 모드일 때는 해당 모듈 내부의 세계관/정규식/에셋 토글을 상세히 보여줌 */}
                {isChatMode && b.enabled && (
                  <div className="mt-4 pt-3 border-t border-[#333] flex flex-col gap-2">
                    <div className="text-xs font-semibold text-gray-400 mb-1">모듈 세부 활성화 (Toggle Features)</div>
                    
                    {b.lorebook.entries && b.lorebook.entries.length > 0 && (
                      <label className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer bg-[#2a2a2a] px-3 py-2.5 rounded border border-[#444] transition-colors hover:border-[#666]">
                        <span className="flex items-center gap-2">🌍 <span>세계관 (로어북) 적용</span></span>
                        <input
                          type="checkbox"
                          checked={b.lorebook.enabled}
                          onChange={() => setModuleBundlesState(prev => prev.map(x => x.id === b.id ? { ...x, lorebook: { ...x.lorebook, enabled: !x.lorebook.enabled } } : x))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                        />
                      </label>
                    )}

                    {b.regex.rules && b.regex.rules.length > 0 && (
                      <label className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer bg-[#2a2a2a] px-3 py-2.5 rounded border border-[#444] transition-colors hover:border-[#666]">
                        <span className="flex items-center gap-2">⚡ <span>정규식 스크립트 적용</span></span>
                        <input
                          type="checkbox"
                          checked={b.regex.enabled}
                          onChange={() => setModuleBundlesState(prev => prev.map(x => x.id === b.id ? { ...x, regex: { ...x.regex, enabled: !x.regex.enabled } } : x))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                        />
                      </label>
                    )}

                    {b.assets.items && b.assets.items.length > 0 && (
                      <label className="flex items-center justify-between text-sm text-gray-300 hover:text-white cursor-pointer bg-[#2a2a2a] px-3 py-2.5 rounded border border-[#444] transition-colors hover:border-[#666]">
                        <span className="flex items-center gap-2">🎨 <span>추가 에셋 적용</span></span>
                        <input
                          type="checkbox"
                          checked={b.assets.enabled}
                          onChange={() => setModuleBundlesState(prev => prev.map(x => x.id === b.id ? { ...x, assets: { ...x.assets, enabled: !x.assets.enabled } } : x))}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                        />
                      </label>
                    )}

                    {(() => {
                      const controls = parseModuleToggleControls(b.customModuleToggle || '')
                      if (controls.length === 0) return null
                      const state = b.toggleState || {}
                      return (
                        <div className="mt-2 pt-2 border-t border-[#2c2c2c] space-y-2">
                          <div className="text-xs font-semibold text-gray-300">Risu Toggle / Button</div>
                          {controls.map((c, idx) => {
                            if (c.type === 'group') {
                              return (
                                <div key={`group-${idx}`} className="text-xs text-gray-400 pt-1">
                                  [{c.label}]
                                </div>
                              )
                            }
                            if (c.type === 'groupEnd') {
                              return <div key={`group-end-${idx}`} className="border-t border-[#333] my-1" />
                            }
                            if (c.type === 'divider') {
                              return <div key={`divider-${idx}`} className="border-t border-dashed border-[#444] my-1" />
                            }
                            if (!c.key) return null

                            if (c.type === 'select') {
                              const current = state[c.key] ?? '0'
                              return (
                                <label key={c.key} className="flex items-center justify-between gap-2 text-sm text-gray-300 bg-[#2a2a2a] px-3 py-2 rounded border border-[#444]">
                                  <span>{c.label}</span>
                                  <select
                                    value={current}
                                    onChange={(ev) =>
                                      setModuleBundlesState((prev) =>
                                        prev.map((x) =>
                                          x.id === b.id
                                            ? {
                                                ...x,
                                                toggleState: { ...(x.toggleState || {}), [c.key]: ev.target.value },
                                              }
                                            : x
                                        )
                                      )
                                    }
                                    className="bg-[#1f1f1f] border border-[#555] rounded px-2 py-1 text-xs"
                                  >
                                    {(c.options || []).map((opt, optIdx) => (
                                      <option key={`${c.key}-${optIdx}`} value={String(optIdx)}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )
                            }

                            if (c.type === 'text') {
                              return (
                                <label key={c.key} className="flex items-center justify-between gap-2 text-sm text-gray-300 bg-[#2a2a2a] px-3 py-2 rounded border border-[#444]">
                                  <span>{c.label}</span>
                                  <input
                                    value={state[c.key] ?? ''}
                                    onChange={(ev) =>
                                      setModuleBundlesState((prev) =>
                                        prev.map((x) =>
                                          x.id === b.id
                                            ? {
                                                ...x,
                                                toggleState: { ...(x.toggleState || {}), [c.key]: ev.target.value },
                                              }
                                            : x
                                        )
                                      )
                                    }
                                    className="bg-[#1f1f1f] border border-[#555] rounded px-2 py-1 text-xs w-44"
                                  />
                                </label>
                              )
                            }

                            const checked = state[c.key] === '1'
                            return (
                              <label key={c.key} className="flex items-center justify-between text-sm text-gray-300 bg-[#2a2a2a] px-3 py-2 rounded border border-[#444]">
                                <span>{c.label}</span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(ev) =>
                                    setModuleBundlesState((prev) =>
                                      prev.map((x) =>
                                        x.id === b.id
                                          ? {
                                              ...x,
                                              toggleState: {
                                                ...(x.toggleState || {}),
                                                [c.key]: ev.target.checked ? '1' : '0',
                                              },
                                            }
                                          : x
                                      )
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                                />
                              </label>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
