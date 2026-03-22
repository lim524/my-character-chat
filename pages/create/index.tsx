import { Fragment, useEffect, useRef, useState } from 'react'
import TopNav from '@/components/TopNav'
import DatingSimScreenPreview from '@/components/DatingSimScreenPreview'
import {
  loadCharacterDraft,
  saveCharacterDraft,
  type AssetRef,
  type AssetType,
  type CharacterDraft,
  type InterfaceConfig,
  type LoreEntry,
} from '@/lib/interfaceConfig'
import { createInitialInterfaceConfig } from '@/lib/interfaceEval'
import type { ScreenConfig } from '@/lib/interfaceConfig'
import { v4 as uuidv4 } from 'uuid'
import {
  Plus,
  Trash2,
  Upload,
  Download,
  User,
  BookOpen,
  Image as ImageIcon,
  Monitor,
  MessageCircle,
  Activity,
} from 'lucide-react'
import { Code2 } from 'lucide-react'
import { saveLocalCharacter } from '@/lib/localStorage'

type SidebarTabId = 'profile' | 'lorebook' | 'images' | 'screen' | 'dialogue' | 'stats'

export default function CreatePage() {
  const [draft, setDraft] = useState<CharacterDraft>({})
  const [iface, setIface] = useState<InterfaceConfig | null>(null)
  const [activeTab, setActiveTab] = useState<SidebarTabId>('profile')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saved'>('idle')
  const [expandedLoreId, setExpandedLoreId] = useState<string | null>(null)
  const lorebookGlobalImportRef = useRef<HTMLInputElement>(null)
  const lorebookSingleImportRef = useRef<HTMLInputElement>(null)
  const [lorebookImportTargetId, setLorebookImportTargetId] = useState<string | null>(null)
  const imagesFileInputRef = useRef<HTMLInputElement>(null)
  const imagesFolderInputRef = useRef<HTMLInputElement>(null)
  const imageReplaceInputRef = useRef<HTMLInputElement>(null)
  const [imageReplaceTargetId, setImageReplaceTargetId] = useState<string | null>(null)
  const [addAssetType, setAddAssetType] = useState<AssetType>('character')
  const [uiThemeMode, setUiThemeMode] = useState<'basic'|'json'>('basic')
  const [uiThemeJsonText, setUiThemeJsonText] = useState('')

  useEffect(() => {
    const loaded = loadCharacterDraft()
    const baseIface = (loaded.interfaceConfig as InterfaceConfig | undefined) ?? createInitialInterfaceConfig()
    setDraft(loaded)
    setIface(baseIface)
  }, [])

  const patchDraft = (patch: Partial<CharacterDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      saveCharacterDraft(patch)
      return next
    })
  }

  const patchInterface = (patch: Partial<InterfaceConfig>) => {
    setIface((prev) => {
      const base = prev ?? createInitialInterfaceConfig()
      const next: InterfaceConfig = { ...base, ...patch }
      patchDraft({ interfaceConfig: next })
      return next
    })
  }

  const handleSave = () => {
    if (!iface) return
    const id = ((draft as any).id as string | undefined) || uuidv4()
    const character = { ...draft, id, interfaceConfig: iface } as any
    saveLocalCharacter(character)
    if (!(draft as any).id) patchDraft({ id } as any)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleCodeChange = (value: string) => {
    patchInterface({ code: value })
  }

  const addAssetsFromFiles = (files: FileList | null) => {
    if (!files?.length || !iface) return
    const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    const fileArray = Array.from(files).filter((f) => imageTypes.includes(f.type))
    if (fileArray.length === 0) {
      alert('선택한 파일 중 지원하는 이미지가 없습니다. (PNG, JPEG, GIF, WebP, SVG)')
      return
    }
    const promises = fileArray.map(
      (file) =>
        new Promise<{ file: File; url: string }>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res({ file, url: reader.result as string })
          reader.onerror = rej
          reader.readAsDataURL(file)
        })
    )
    Promise.all(promises).then((results) => {
      const newRefs: AssetRef[] = results.map(({ file, url }) => ({
        id: uuidv4(),
        type: addAssetType,
        sourceType: 'upload',
        url,
        label: file.name.replace(/\.[^/.]+$/, '') || file.name,
      }))
      patchInterface({ assets: [...iface.assets, ...newRefs] })
    }).catch(() => alert('파일을 읽는 중 오류가 발생했습니다.'))
  }

  const startReplaceAssetImage = (assetId: string) => {
    setImageReplaceTargetId(assetId)
    setTimeout(() => imageReplaceInputRef.current?.click(), 0)
  }

  const onReplaceAssetImage = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    const targetId = imageReplaceTargetId
    if (!file || !targetId || !iface) return
    setImageReplaceTargetId(null)
    const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!imageTypes.includes(file.type)) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const next = iface.assets.map((a) =>
        a.id === targetId ? { ...a, url, sourceType: 'upload' as const } : a
      )
      patchInterface({ assets: next })
    }
    reader.readAsDataURL(file)
    ev.target.value = ''
  }

  if (!iface) {
    return null
  }

  return (
    <div className="bg-[#050505] min-h-screen text-white">
      <TopNav />
      <div
        className="relative"
        style={{ marginTop: '56px', height: 'calc(100vh - 56px)' }}
      >
        {/* 프리뷰: 화면 전체를 거의 채움 */}
        <div className="absolute inset-0 flex items-center justify-center px-3 md:px-8 py-6">
          <div className="w-full max-w-4xl h-full">
            {(() => {
              const initialBg = draft.details?.initialBackground as string | undefined
              const initialChar = draft.details?.initialCharacter as string | undefined
              const previewConfig: ScreenConfig = {
                background: initialBg,
                characters: initialChar ? [{ slot: 'center', assetId: initialChar }] : [],
                dialogue: {
                  speakerName: draft.name || '알 수 없음',
                  text: draft.firstLine || '이곳에 첫 대사가 표시됩니다...'
                }
              }
              return <DatingSimScreenPreview screen={previewConfig} assets={iface.assets} uiTheme={iface.uiTheme} />
            })()}
          </div>
        </div>

        {/* 사이드바 토글 버튼 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`absolute left-3 top-4 z-30 px-3 py-1 rounded-full text-xs border border-[#444] bg-black/60 hover:bg-black/80 ${
            sidebarOpen ? 'hidden md:inline-flex' : 'inline-flex'
          } items-center gap-1`}
        >
          설정
        </button>

        {/* 사이드바 오버레이 */}
        {sidebarOpen && (
          <div className="absolute inset-y-0 left-0 w-[420px] max-w-[90vw] z-40 bg-[#050508]/95 border-r border-[#222] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#222]">
              <span className="text-sm font-semibold text-gray-200 tracking-wide">생성 설정</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-[#111] border border-[#333] text-sm flex items-center justify-center hover:bg-[#1a1a1a]"
              >
                ✕
              </button>
            </div>

            <div className="flex px-4 pt-4 pb-3 gap-2 flex-wrap">
              {(
                [
                  ['profile', '프로필', User],
                  ['lorebook', '로어북', BookOpen],
                  ['images', '이미지', ImageIcon],
                  ['screen', '초기 화면 설정', Monitor],
                  ['dialogue', '시나리오 및 규칙', MessageCircle],
                  ['stats', '스탯 및 변수', Activity],
                ] as [SidebarTabId, string, typeof User][]
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={label}
                  className={`p-2.5 rounded-md border transition-colors ${
                    activeTab === id
                      ? 'bg-white text-black border-white'
                      : 'border-[#444] text-gray-300 hover:border-white'
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 text-xs tracking-wide">
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <div>
                    <label className="block mb-2 font-semibold">제목</label>
                    <input
                      value={draft.name ?? ''}
                      onChange={(e) => patchDraft({ name: e.target.value })}
                      className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
                      placeholder="작품 제목"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">프로필</label>
                    <textarea
                      value={draft.description ?? ''}
                      onChange={(e) => patchDraft({ description: e.target.value })}
                      className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 min-h-[80px]"
                      placeholder="작품 소개"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">첫 대사</label>
                    <textarea
                      value={draft.firstLine ?? ''}
                      onChange={(e) => patchDraft({ firstLine: e.target.value })}
                      className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 min-h-[60px]"
                      placeholder="게임 시작 시 첫 대사"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'lorebook' && (() => {
                const entries = (draft.loreEntries as LoreEntry[] | undefined) ?? []

                const setEntries = (next: LoreEntry[]) => {
                  patchDraft({ loreEntries: next })
                }

                const addEntry = () => {
                  const next: LoreEntry = {
                    id: uuidv4(),
                    name: 'New Lore',
                    keys: '',
                    order: 100,
                    prompt: '',
                    alwaysActive: false,
                    multipleKeys: false,
                    useRegex: false,
                  }
                  setEntries([...(entries || []), next])
                }

                const updateEntry = (id: string, patch: Partial<LoreEntry>) => {
                  setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)))
                }

                const removeEntry = (id: string, ev: React.MouseEvent) => {
                  ev.stopPropagation()
                  setEntries(entries.filter((e) => e.id !== id))
                  if (expandedLoreId === id) setExpandedLoreId(null)
                }

                const toggleExpanded = (id: string) => {
                  setExpandedLoreId((prev) => (prev === id ? null : id))
                }

                const numberInputClass =
                  'w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

                const exportEntries = () => {
                  const blob = new Blob([JSON.stringify(entries, null, 2)], {
                    type: 'application/json',
                  })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = 'lorebook.json'
                  a.click()
                  URL.revokeObjectURL(a.href)
                }

                const onGlobalImportFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
                  const file = ev.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const parsed = JSON.parse(reader.result as string) as LoreEntry[] | LoreEntry
                      const list = Array.isArray(parsed) ? parsed : [parsed]
                      setEntries(list.map((e) => ({ ...e, id: e.id || uuidv4() })))
                    } catch {
                      alert('JSON 파싱에 실패했습니다.')
                    }
                  }
                  reader.readAsText(file)
                  ev.target.value = ''
                }

                const exportEntry = (entry: LoreEntry) => {
                  const blob = new Blob([JSON.stringify(entry, null, 2)], {
                    type: 'application/json',
                  })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `${(entry.name || 'lore').replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}.json`
                  a.click()
                  URL.revokeObjectURL(a.href)
                }

                const startSingleImport = (id: string) => {
                  setLorebookImportTargetId(id)
                  setTimeout(() => lorebookSingleImportRef.current?.click(), 0)
                }

                const onSingleImportFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
                  const file = ev.target.files?.[0]
                  const targetId = lorebookImportTargetId
                  if (!file || !targetId) return
                  setLorebookImportTargetId(null)
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const parsed = JSON.parse(reader.result as string) as LoreEntry | LoreEntry[]
                      const one = Array.isArray(parsed) ? parsed[0] : parsed
                      if (one) updateEntry(targetId, { ...one, id: targetId })
                    } catch {
                      alert('JSON 파싱에 실패했습니다.')
                    }
                  }
                  reader.readAsText(file)
                  ev.target.value = ''
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">로어북</span>
                      <div className="flex items-center gap-2">
                        <input
                          ref={lorebookGlobalImportRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={onGlobalImportFile}
                        />
                        <input
                          ref={lorebookSingleImportRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={onSingleImportFile}
                        />
                        <button
                          type="button"
                          onClick={() => lorebookGlobalImportRef.current?.click()}
                          className="p-2 rounded-md border border-[#333] hover:border-white text-gray-300"
                          title="전체 가져오기 (파일)"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={exportEntries}
                          className="p-2 rounded-md border border-[#333] hover:border-white text-gray-300"
                          title="전체 내보내기"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={addEntry}
                          className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#444] text-xs hover:border-white"
                        >
                          <Plus size={12} /> 새 로어북
                        </button>
                      </div>
                    </div>

                    <div className="border border-[#333] rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-[#111] text-gray-300">
                          <tr>
                            <th className="px-3 py-2 text-left">이름</th>
                            <th className="px-3 py-2 text-right w-28"> </th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((e) => (
                            <Fragment key={e.id}>
                              <tr
                                key={e.id}
                                onClick={() => toggleExpanded(e.id)}
                                className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${expandedLoreId === e.id ? 'bg-[#0f0f12]' : ''}`}
                              >
                                <td className="px-3 py-2 font-medium">{e.name || '(이름 없음)'}</td>
                                <td className="px-3 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                                  <span className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(ev) => { ev.stopPropagation(); startSingleImport(e.id) }}
                                      className="p-1 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                                      title="가져오기"
                                    >
                                      <Upload size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(ev) => { ev.stopPropagation(); exportEntry(e) }}
                                      className="p-1 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                                      title="내보내기"
                                    >
                                      <Download size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(ev) => removeEntry(e.id, ev)}
                                      className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                      title="삭제"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </span>
                                </td>
                              </tr>
                              {expandedLoreId === e.id && (
                                <tr className="border-t border-[#222] bg-[#0b0b0f]">
                                  <td colSpan={2} className="px-4 py-4 align-top">
                                    <div className="space-y-4" onClick={(ev) => ev.stopPropagation()}>
                                      <div>
                                        <label className="block mb-2 text-xs font-semibold">이름</label>
                                        <input
                                          value={e.name}
                                          onChange={(ev) => updateEntry(e.id, { name: ev.target.value })}
                                          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block mb-2 text-xs font-semibold">
                                          활성화 키
                                        </label>
                                        <input
                                          value={e.keys}
                                          onChange={(ev) => updateEntry(e.id, { keys: ev.target.value })}
                                          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs"
                                          placeholder="쉼표로 구분된 키"
                                        />
                                      </div>
                                      <div>
                                        <label className="block mb-2 text-xs font-semibold">
                                          배치 순서
                                        </label>
                                        <input
                                          type="number"
                                          value={e.order}
                                          onChange={(ev) =>
                                            updateEntry(e.id, { order: Number(ev.target.value) || 0 })
                                          }
                                          className={numberInputClass}
                                        />
                                      </div>
                                      <div>
                                        <label className="block mb-2 text-xs font-semibold">프롬프트</label>
                                        <textarea
                                          value={e.prompt}
                                          onChange={(ev) => updateEntry(e.id, { prompt: ev.target.value })}
                                          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs min-h-[80px]"
                                          placeholder="실제 캐릭터 프롬프트"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-2 text-xs text-gray-200">
                                        <label className="inline-flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={e.alwaysActive}
                                            onChange={(ev) =>
                                              updateEntry(e.id, { alwaysActive: ev.target.checked })
                                            }
                                          />
                                          언제나 활성화
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={e.multipleKeys}
                                            onChange={(ev) =>
                                              updateEntry(e.id, { multipleKeys: ev.target.checked })
                                            }
                                          />
                                          멀티플 키
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={e.useRegex}
                                            onChange={(ev) =>
                                              updateEntry(e.id, { useRegex: ev.target.checked })
                                            }
                                          />
                                          정규식 사용
                                        </label>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                          {entries.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-3 py-4 text-center text-gray-500">
                                로어가 없습니다. &quot;새 로어북&quot; 버튼으로 추가하세요.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {activeTab === 'images' && (() => {
                const backgroundAssets = iface.assets.filter((a) => a.type === 'background')
                const characterAssets = iface.assets.filter((a) => a.type === 'character')
                const otherAssets = iface.assets.filter((a) => a.type === 'ui')

                const AssetCard = ({ asset }: { asset: AssetRef }) => {
                  const globalIndex = iface!.assets.findIndex((a) => a.id === asset.id)
                  return (
                    <div
                      key={asset.id}
                      className="flex items-start gap-3 border border-[#333] rounded-lg p-2 bg-[#0c0c0f]"
                    >
                      <div className="shrink-0 w-20 space-y-1.5">
                        <div className="aspect-square w-20 rounded-md overflow-hidden bg-[#111] border border-[#333]">
                          {asset.url ? (
                            <img
                              src={asset.url}
                              alt={asset.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <input
                          value={asset.label}
                          onChange={(e) => {
                            const next = [...iface!.assets]
                            next[globalIndex] = { ...asset, label: e.target.value }
                            patchInterface({ assets: next })
                          }}
                          placeholder="이름"
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-[11px]"
                        />
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = iface!.assets.filter((_, i) => i !== globalIndex)
                            patchInterface({ assets: next })
                          }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startReplaceAssetImage(asset.id)}
                          className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                          title="이미지 변경"
                        >
                          <ImageIcon size={14} />
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={imagesFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addAssetsFromFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <input
                        ref={imagesFolderInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addAssetsFromFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <input
                        ref={imageReplaceInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={onReplaceAssetImage}
                      />
                      <select
                        value={addAssetType}
                        onChange={(e) => setAddAssetType(e.target.value as AssetType)}
                        className="bg-[#111] border border-[#333] rounded-md px-2 py-1.5 text-xs"
                      >
                        <option value="background">배경</option>
                        <option value="character">캐릭터</option>
                        <option value="ui">기타</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => imagesFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#444] text-xs hover:border-white"
                      >
                        <Plus size={12} /> 파일 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => imagesFolderInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#444] text-xs hover:border-white"
                      >
                        <Plus size={12} /> 폴더 추가
                      </button>
                    </div>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-300">배경 이미지</h3>
                      <div className="space-y-2">
                        {backgroundAssets.length === 0 ? (
                          <p className="text-[11px] text-gray-500 py-2">없음</p>
                        ) : (
                          backgroundAssets.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} />
                          ))
                        )}
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-300">캐릭터 이미지</h3>
                      <div className="space-y-2">
                        {characterAssets.length === 0 ? (
                          <p className="text-[11px] text-gray-500 py-2">없음</p>
                        ) : (
                          characterAssets.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} />
                          ))
                        )}
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-300">기타 이미지</h3>
                      <div className="space-y-2">
                        {otherAssets.length === 0 ? (
                          <p className="text-[11px] text-gray-500 py-2">없음</p>
                        ) : (
                          otherAssets.map((asset) => (
                            <AssetCard key={asset.id} asset={asset} />
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                )
              })()}

              {activeTab === 'screen' && (() => {
                const bgAssets = iface.assets.filter((a) => a.type === 'background')
                const charAssets = iface.assets.filter((a) => a.type === 'character')

                return (
                  <div className="space-y-4">
                    <label className="block font-semibold">초기 화면 설정</label>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                      채팅 화면에 처음 진입했을 때 보여줄 배경 이미지와 캐릭터 스탠딩을 설정합니다.
                      이 설정은 AI와의 대화 시작 전에 자동으로 적용됩니다.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">시작 배경</label>
                        <select 
                          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e45463]"
                          value={draft.details?.initialBackground || ''}
                          onChange={(e) => patchDraft({ details: { ...draft.details, initialBackground: e.target.value } })}
                        >
                          <option value="">(기본 배경)</option>
                          {bgAssets.map((a) => (
                            <option key={a.id} value={a.id}>{a.label || a.id}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold">시작 캐릭터 (가운데)</label>
                        <select 
                          className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e45463]"
                          value={draft.details?.initialCharacter || ''}
                          onChange={(e) => patchDraft({ details: { ...draft.details, initialCharacter: e.target.value } })}
                        >
                          <option value="">(표시 안 함)</option>
                          {charAssets.map((a) => (
                            <option key={a.id} value={a.id}>{a.label || a.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-[#0d0d10] border border-[#333] p-3 text-[11px] text-gray-300 mt-4">
                      <p className="font-medium text-blue-300 mb-1">💡 작동 원리</p>
                      <p>
                        채팅방에 접속하면, 선택된 에셋의 태그(<code className="bg-[#111] px-1 rounded">&lt;img=에셋:background&gt;</code> 등)가
                        채팅 로그에 자동 주입되어 처음부터 해당 화면 연출이 렌더링되도록 작동합니다.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-[#222]">
                      <label className="block font-semibold mb-1">대화창 UI 테마 커스텀</label>
                      <p className="text-[11px] text-gray-400 mb-2">
                        JSON 형식으로 원하는 CSS 스타일을 자유롭게 입력하세요. (예: <code className="text-[#e45463]">"borderRadius": "16px"</code>, <code className="text-[#e45463]">"boxShadow": "0 0 20px pink"</code>)
                      </p>
                      <textarea
                        value={uiThemeJsonText || JSON.stringify(iface.uiTheme || { backgroundColor: 'rgba(0,0,0,0.75)', nameColor: '#fbcfe8', textColor: '#f3f4f6' }, null, 2)}
                        onChange={(e) => {
                          const raw = e.target.value
                          setUiThemeJsonText(raw)
                          try {
                            // 1. Strip block comments (/* ... */) and line comments (// ...)
                            const stripped = raw
                              .replace(/\/\*[\s\S]*?\*\//g, '')
                              .replace(/\/\/.*/g, '')
                            // 2. Parse
                            const parsed = JSON.parse(stripped)
                            // 3. Flatten nested objects one level deep
                            //    e.g. { chatBoxStyle: { color: 'red' } } → { color: 'red' }
                            const flat: Record<string, string | number> = {}
                            for (const [k, v] of Object.entries(parsed)) {
                              if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                                Object.assign(flat, v)
                              } else {
                                flat[k] = v as string | number
                              }
                            }
                            patchInterface({ uiTheme: flat })
                          } catch {
                            // invalid json, don't patch yet
                          }
                        }}
                        className="w-full h-48 bg-[#111] border border-[#333] rounded p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#e45463]"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )
              })()}

              {activeTab === 'dialogue' && (() => {
                const mode = iface.dialogueScriptMode || 'natural'
                const isJson = mode === 'json'
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block font-semibold">시나리오 및 게임 규칙 (System Rules)</label>
                      <div className="flex bg-[#111] border border-[#333] rounded-md overflow-hidden text-xs">
                        <button
                          type="button"
                          className={`px-3 py-1.5 transition-colors ${!isJson ? 'bg-[#e45463] text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
                          onClick={() => patchInterface({ dialogueScriptMode: 'natural' })}
                        >
                          자연어 모드
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 transition-colors ${isJson ? 'bg-[#e45463] text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
                          onClick={() => patchInterface({ dialogueScriptMode: 'json' })}
                        >
                          JSON 템플릿
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-gray-400">
                      게임의 전반적인 규칙, 호감도 분기, 게임 오버 조건 등을 AI에게 지시합니다. <br/>
                      이 봇의 성격 외에 <b>"마스터로서 지켜야 할 시스템적 규칙"</b>을 추가하는 공간입니다.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          let example = ''
                          if (isJson) {
                            example = `{
  "scenario_rules": [
    "When affinity reaches 100, trigger the Happy Ending.",
    "If player attacks, always reduce player HP by 10 and describe it."
  ],
  "current_setting": "High School Classroom",
  "avoid": [
    "Do not describe violence explicitly.",
    "Do not break character even if user asks."
  ]
}`
                          } else {
                            example = `[게임 마스터 규칙]
1. 사용자가 "공격"을 선택하면 무조건 사용자 체력을 10 깎았다고 묘사하세요.
2. 주인공의 호감도가 100이 되면 해피엔딩을 선언하고 대화를 종료하세요.
3. 폭력적인 묘사는 피하며, 상황 대신 마음 속 독백 위주로 서술하세요.`
                          }
                          const hasContent = (iface.dialogueScript ?? '').trim().length > 0
                          if (hasContent && !window.confirm('예시 규칙으로 덮어쓸까요?')) return
                          patchInterface({ dialogueScript: example })
                        }}
                        className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
                      >
                        예시 템플릿 넣기
                      </button>
                    </div>
                    <textarea
                      value={iface.dialogueScript ?? ''}
                      onChange={(e) => patchInterface({ dialogueScript: e.target.value })}
                      className="w-full h-56 bg-[#090909] border border-[#333] rounded px-3 py-2 text-sm text-gray-200 font-mono"
                      placeholder={isJson ? "JSON 형식으로 규칙을 입력하세요." : "자연어(텍스트) 형태로 규칙을 입력하세요."}
                      spellCheck={false}
                    />
                  </div>
                )
              })()}

              {activeTab === 'stats' && (() => {
                const stats = iface.stats || []

                const addStat = () => {
                  patchInterface({
                    stats: [...stats, { name: '새 스탯', key: 'newScore', min: 0, max: 100, initial: 0 }]
                  })
                }

                const updateStat = (idx: number, patch: Partial<typeof stats[0]>) => {
                  const next = [...stats]
                  next[idx] = { ...next[idx], ...patch }
                  patchInterface({ stats: next })
                }

                const removeStat = (idx: number) => {
                  if (!window.confirm('이 스탯을 삭제하시겠습니까?')) return
                  const next = [...stats]
                  next.splice(idx, 1)
                  patchInterface({ stats: next })
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold">스탯 및 변수 (Status Variables)</label>
                      <button
                        type="button"
                        onClick={addStat}
                        className="px-2 py-1 text-xs bg-[#e45463] text-white rounded hover:bg-[#d04352] transition flex items-center gap-1"
                      >
                        <Plus size={14} /> 스탯 추가
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      호감도, 체력, 스트레스 등 <b>게임 내에서 계속 추적해야 할 변수</b>들을 정의합니다.
                      AI는 이 변수들을 기억하고, 채팅 상황에 맞게 자동으로 변화시켜 보고합니다.
                    </p>

                    {stats.length === 0 ? (
                      <div className="text-center py-10 bg-[#0a0a0c] border border-[#222] rounded-lg text-gray-500 text-xs">
                        정의된 스탯이 없습니다. 우측 상단의 추가 버튼을 눌러보세요.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.map((st, idx) => (
                          <div key={idx} className="bg-[#0a0a0c] border border-[#333] rounded-lg p-3 space-y-3 relative group">
                            <button
                              type="button"
                              onClick={() => removeStat(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-[#222] text-gray-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 hover:text-red-200"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3 pr-8">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">표시 이름</label>
                                <input
                                  value={st.name}
                                  onChange={(e) => updateStat(idx, { name: e.target.value })}
                                  className="w-full bg-[#111] border border-[#444] rounded px-2 py-1 text-xs focus:border-[#e45463] outline-none"
                                  placeholder="호감도, HP..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">변수 키</label>
                                <input
                                  value={st.key}
                                  onChange={(e) => updateStat(idx, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                                  className="w-full bg-[#111] border border-[#444] rounded px-2 py-1 text-xs font-mono focus:border-[#e45463] outline-none"
                                  placeholder="affinity, hp..."
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">최소값</label>
                                <input
                                  type="number"
                                  value={st.min}
                                  onChange={(e) => updateStat(idx, { min: Number(e.target.value) })}
                                  className="w-full bg-[#111] border border-[#444] rounded px-2 py-1 text-xs text-center focus:border-[#e45463] outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">최대값</label>
                                <input
                                  type="number"
                                  value={st.max}
                                  onChange={(e) => updateStat(idx, { max: Number(e.target.value) })}
                                  className="w-full bg-[#111] border border-[#444] rounded px-2 py-1 text-xs text-center focus:border-[#e45463] outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">시작값</label>
                                <input
                                  type="number"
                                  value={st.initial}
                                  onChange={(e) => updateStat(idx, { initial: Number(e.target.value) })}
                                  className="w-full bg-[#111] border border-[#444] rounded px-2 py-1 text-xs text-center focus:border-[#e45463] outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 px-5 py-4 bg-[#050508]/95 border-t border-[#222]">
              <button
                onClick={handleSave}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#e45463] hover:bg-[#d04352] text-white'
                }`}
              >
                {saveStatus === 'saved' ? '✓ 저장되었습니다!' : '캐릭터 저장'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

