import { Fragment, useEffect, useRef, useState } from 'react'
import TopNav from '@/components/TopNav'
import DatingSimScreenPreview from '@/components/DatingSimScreenPreview'
import {
  loadCharacterDraft,
  persistCharacterDraft,
  saveCharacterDraft,
  type AssetRef,
  type AssetType,
  type CharacterDraft,
  type InterfaceConfig,
  type LoreEntry,
  type RegexScriptEntry,
  type RegexScriptType,
  type ScenarioRuleEntry,
  type ExtraInterfaceEntry,
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
  Layers,
  FolderOpen,
  FileCode2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Code2 } from 'lucide-react'
import { saveLocalCharacter, type LocalCharacter } from '@/lib/localStorage'

type SidebarTabId =
  | 'profile'
  | 'lorebook'
  | 'images'
  | 'screen'
  | 'dialogue'
  | 'script'
  | 'extraInterface'

/** 렌더 안에서 정의하면 매번 새 컴포넌트 타입이 되어 입력란이 리마운트되고(한 글자만 입력됨) — 반드시 모듈 스코프에 둠 */
function ImageAssetCard({
  asset,
  onLabelChange,
  onRemove,
  onReplaceImage,
}: {
  asset: AssetRef
  onLabelChange: (assetId: string, label: string) => void
  onRemove: (assetId: string) => void
  onReplaceImage: (assetId: string) => void
}) {
  return (
    <div className="flex items-start gap-3 border border-[#333] rounded-lg p-2 bg-[#0c0c0f]">
      <div className="shrink-0 w-[7.5rem] space-y-1.5">
        <div className="aspect-square w-[7.5rem] rounded-md overflow-hidden bg-[#111] border border-[#333]">
          {asset.url ? (
            <img
              src={asset.url}
              alt={asset.label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <ImageIcon size={28} />
            </div>
          )}
        </div>
        <input
          value={asset.label ?? ''}
          onChange={(e) => onLabelChange(asset.id, e.target.value)}
          placeholder="이름"
          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-[11px]"
        />
      </div>
      <div className="flex flex-col gap-1 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => onReplaceImage(asset.id)}
          className="p-1.5 rounded hover:bg-[#222] text-gray-400 hover:text-white"
          title="이미지 변경"
        >
          <ImageIcon size={14} />
        </button>
      </div>
    </div>
  )
}

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
  const [imageCategoryTab, setImageCategoryTab] = useState<AssetType>('character')
  const [imageDropActive, setImageDropActive] = useState(false)
  const [uiThemeMode, setUiThemeMode] = useState<'basic'|'json'>('basic')
  const [uiThemeJsonText, setUiThemeJsonText] = useState('')
  const [expandedRegexScriptId, setExpandedRegexScriptId] = useState<string | null>(null)
  const [expandedScenarioRuleId, setExpandedScenarioRuleId] = useState<string | null>(null)
  const [expandedExtraInterfaceId, setExpandedExtraInterfaceId] = useState<string | null>(null)

  /** 비동기 FileReader 완료 시점의 iface 클로저 오래됨 방지 */
  const ifaceRef = useRef<InterfaceConfig | null>(null)
  ifaceRef.current = iface

  useEffect(() => {
    void (async () => {
      const loaded = await loadCharacterDraft()
      let baseIface = (loaded.interfaceConfig as InterfaceConfig | undefined) ?? createInitialInterfaceConfig()
      const ds = baseIface.dialogueScript?.trim()
      if (ds && (!baseIface.scenarioRules || baseIface.scenarioRules.length === 0)) {
        baseIface = {
          ...baseIface,
          scenarioRules: [{ id: uuidv4(), name: '규칙 1', content: ds }],
        }
        await saveCharacterDraft({ interfaceConfig: baseIface })
      }
      const draftSynced = { ...loaded, interfaceConfig: baseIface }
      setDraft(draftSynced)
      await persistCharacterDraft(draftSynced)
      setIface(baseIface)
    })()
  }, [])

  const patchDraft = (patch: Partial<CharacterDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      void persistCharacterDraft(next)
      return next
    })
  }

  const patchInterface = (patch: Partial<InterfaceConfig>) => {
    setIface((prev) => {
      const base = prev ?? createInitialInterfaceConfig()
      return { ...base, ...patch }
    })
    setDraft((dPrev) => {
      const ifaceBase = dPrev.interfaceConfig ?? createInitialInterfaceConfig()
      const nextIface: InterfaceConfig = { ...ifaceBase, ...patch }
      const dNext = { ...dPrev, interfaceConfig: nextIface }
      void persistCharacterDraft(dNext)
      return dNext
    })
  }

  const handleSave = async () => {
    if (typeof window === 'undefined' || !iface) return
    const id = ((draft as any).id as string | undefined) || uuidv4()
    const character = {
      ...draft,
      id,
      name: String((draft as any).name ?? '').trim() || '제목 없음',
      description: String((draft as any).description ?? ''),
      personality: String((draft as any).personality ?? ''),
      situation: String((draft as any).situation ?? ''),
      interfaceConfig: iface,
      isPublic: (draft as any).isPublic ?? (draft as any).is_public ?? true,
      is_public: (draft as any).is_public ?? (draft as any).isPublic ?? true,
    } as LocalCharacter

    const result = await saveLocalCharacter(character)
    if (!result.ok) {
      alert(result.error)
      return
    }
    if (!(draft as any).id) patchDraft({ id } as any)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 's') {
        e.preventDefault()
        void handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleCodeChange = (value: string) => {
    patchInterface({ code: value })
  }

  const addAssetsFromFiles = (files: FileList | null, typeOverride?: AssetType) => {
    if (!files?.length || !iface) return
    const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    const fileArray = Array.from(files).filter((f) => imageTypes.includes(f.type))
    if (fileArray.length === 0) {
      alert('선택한 파일 중 지원하는 이미지가 없습니다. (PNG, JPEG, GIF, WebP, SVG)')
      return
    }
    const targetType = typeOverride ?? addAssetType
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
      const cur = ifaceRef.current
      if (!cur) return
      const newRefs: AssetRef[] = results.map(({ file, url }) => ({
        id: uuidv4(),
        type: targetType,
        sourceType: 'upload',
        url,
        label: file.name.replace(/\.[^/.]+$/, '') || file.name,
      }))
      patchInterface({ assets: [...cur.assets, ...newRefs] })
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
      const cur = ifaceRef.current
      if (!cur) return
      const next = cur.assets.map((a) =>
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
              return (
                <DatingSimScreenPreview
                  screen={previewConfig}
                  assets={iface.assets}
                  uiTheme={iface.uiTheme}
                  extraInterfaceEntries={iface.extraInterfaceEntries}
                  regexScripts={iface.regexScripts}
                  characterSpriteLiftPx={iface.characterSpriteLiftPx}
                />
              )
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
                  ['script', '스크립트', FileCode2],
                  ['extraInterface', '추가 인터페이스 설정', Layers],
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

                const selectImageCategory = (t: AssetType) => {
                  setImageCategoryTab(t)
                  setAddAssetType(t)
                }

                const categoryLabel =
                  imageCategoryTab === 'background'
                    ? '배경 이미지'
                    : imageCategoryTab === 'character'
                      ? '캐릭터 이미지'
                      : '기타 이미지'

                const listForTab =
                  imageCategoryTab === 'background'
                    ? backgroundAssets
                    : imageCategoryTab === 'character'
                      ? characterAssets
                      : otherAssets

                return (
                  <div className="space-y-4">
                    <input
                      ref={imagesFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addAssetsFromFiles(e.target.files, imageCategoryTab)
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
                        addAssetsFromFiles(e.target.files, imageCategoryTab)
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

                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['background', '배경 이미지'] as const,
                          ['character', '캐릭터 이미지'] as const,
                          ['ui', '기타 이미지'] as const,
                        ]
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => selectImageCategory(id)}
                          className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium leading-tight transition-colors ${
                            imageCategoryTab === id
                              ? 'border-white bg-white text-black'
                              : 'border-[#444] bg-[#0c0c0f] text-gray-300 hover:border-[#666]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-[#333] bg-[#0a0a0c] p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-200">{categoryLabel} 추가</span>
                        <span className="text-[10px] text-gray-500">파일은 Ctrl+클릭으로 여러 장 선택 가능</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onDragEnter={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setImageDropActive(true)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setImageDropActive(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDropActive(false)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setImageDropActive(false)
                          addAssetsFromFiles(e.dataTransfer.files, imageCategoryTab)
                        }}
                        className={`rounded-lg border-2 border-dashed px-3 py-6 text-center transition-colors ${
                          imageDropActive
                            ? 'border-pink-400/80 bg-pink-500/10'
                            : 'border-[#444] bg-[#080808] hover:border-[#555]'
                        }`}
                      >
                        <Upload className="mx-auto mb-2 text-gray-500" size={22} />
                        <p className="text-[11px] text-gray-400 mb-1">이미지를 여기에 끌어다 놓기</p>
                        <p className="text-[10px] text-gray-600">현재 선택: {categoryLabel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => imagesFileInputRef.current?.click()}
                          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg border border-[#444] bg-[#111] px-3 py-2 text-xs hover:border-white"
                        >
                          <Plus size={14} /> 파일 (다중 선택)
                        </button>
                        <button
                          type="button"
                          onClick={() => imagesFolderInputRef.current?.click()}
                          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg border border-[#444] bg-[#111] px-3 py-2 text-xs hover:border-white"
                        >
                          <FolderOpen size={14} /> 폴더
                        </button>
                      </div>
                    </div>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-400">{categoryLabel} 목록</h3>
                      <div className="space-y-2">
                        {listForTab.length === 0 ? (
                          <p className="text-[11px] text-gray-500 py-3 text-center rounded-lg border border-dashed border-[#333]">
                            아직 없습니다. 위에서 추가하세요.
                          </p>
                        ) : (
                          listForTab.map((asset) => (
                            <ImageAssetCard
                              key={asset.id}
                              asset={asset}
                              onLabelChange={(id, label) => {
                                patchInterface({
                                  assets: iface!.assets.map((a) =>
                                    a.id === id ? { ...a, label } : a
                                  ),
                                })
                              }}
                              onRemove={(id) => {
                                patchInterface({
                                  assets: iface!.assets.filter((a) => a.id !== id),
                                })
                              }}
                              onReplaceImage={startReplaceAssetImage}
                            />
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

                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-semibold">채팅방 캐릭터 위치 (위로 올리기)</label>
                      <p className="text-[11px] text-gray-500">
                        숫자를 키우면 스탠딩이 대화창 쪽으로 더 올라갑니다. (0 = 기본)
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={280}
                          step={4}
                          value={iface.characterSpriteLiftPx ?? 0}
                          onChange={(e) =>
                            patchInterface({ characterSpriteLiftPx: Number(e.target.value) || 0 })
                          }
                          className="flex-1 accent-[#e45463]"
                        />
                        <input
                          type="number"
                          min={0}
                          max={400}
                          value={iface.characterSpriteLiftPx ?? 0}
                          onChange={(e) =>
                            patchInterface({
                              characterSpriteLiftPx: Math.max(
                                0,
                                Math.min(400, Math.floor(Number(e.target.value) || 0))
                              ),
                            })
                          }
                          className="w-20 bg-[#111] border border-[#333] rounded px-2 py-1.5 text-sm text-white"
                        />
                        <span className="text-xs text-gray-500 w-8">px</span>
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
                const rules = iface.scenarioRules ?? []

                const scenarioRulesToDialogueScript = (list: ScenarioRuleEntry[]) =>
                  list
                    .map((r) => r.content.trim())
                    .filter(Boolean)
                    .join('\n\n---\n\n')

                const setScenarioRules = (next: ScenarioRuleEntry[]) => {
                  patchInterface({
                    scenarioRules: next,
                    dialogueScript: scenarioRulesToDialogueScript(next),
                  })
                }

                const addScenarioRule = () => {
                  const next = [
                    ...rules,
                    { id: uuidv4(), name: `규칙 ${rules.length + 1}`, content: '' },
                  ]
                  setScenarioRules(next)
                  setExpandedScenarioRuleId(next[next.length - 1].id)
                }

                const updateScenarioRule = (id: string, patch: Partial<ScenarioRuleEntry>) => {
                  const next = rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
                  setScenarioRules(next)
                }

                const removeScenarioRule = (id: string) => {
                  if (!window.confirm('이 규칙 행을 삭제할까요?')) return
                  const next = rules.filter((r) => r.id !== id)
                  setScenarioRules(next)
                  if (expandedScenarioRuleId === id) setExpandedScenarioRuleId(null)
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block font-semibold">시나리오 및 게임 규칙</label>
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <button
                          type="button"
                          onClick={addScenarioRule}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#444] text-xs hover:border-white"
                        >
                          <Plus size={14} /> 규칙 추가
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400">
                      행을 눌러 내용을 펼치거나 접을 수 있습니다. 각 행은 <b>dialogueScript</b>에 합쳐져 저장됩니다.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
                          const hasAny = rules.some((r) => r.content.trim())
                          if (hasAny && !window.confirm('예시로 첫 번째 행을 덮어쓰고 나머지를 비울까요?')) return
                          const one: ScenarioRuleEntry = {
                            id: rules[0]?.id ?? uuidv4(),
                            name: '예시 규칙',
                            content: example,
                          }
                          setScenarioRules([one])
                          setExpandedScenarioRuleId(one.id)
                        }}
                        className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
                      >
                        예시 템플릿 넣기
                      </button>
                    </div>

                    <div className="border border-[#333] rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-[#111] text-gray-400">
                          <tr>
                            <th className="w-8 px-2 py-2 text-left" />
                            <th className="px-2 py-2 text-left min-w-[100px]">이름</th>
                            <th className="w-10 px-2 py-2 text-right" />
                          </tr>
                        </thead>
                        <tbody>
                          {rules.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                                규칙이 없습니다. &quot;규칙 추가&quot;를 누르세요.
                              </td>
                            </tr>
                          ) : (
                            rules.map((r) => {
                              const open = expandedScenarioRuleId === r.id
                              return (
                                <Fragment key={r.id}>
                                  <tr
                                    onClick={() =>
                                      setExpandedScenarioRuleId((p) => (p === r.id ? null : r.id))
                                    }
                                    className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                                  >
                                    <td className="px-2 py-2 align-middle text-gray-500">
                                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        value={r.name}
                                        onChange={(e) => updateScenarioRule(r.id, { name: e.target.value })}
                                        className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                                        placeholder="규칙 이름"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => removeScenarioRule(r.id)}
                                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                        title="삭제"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                  {open && (
                                    <tr className="border-t border-[#222] bg-[#0b0b0f]">
                                      <td colSpan={3} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                        <label className="block text-[10px] text-gray-500 mb-1">
                                          내용 ({isJson ? 'JSON' : '자연어'})
                                        </label>
                                        <textarea
                                          value={r.content}
                                          onChange={(e) => updateScenarioRule(r.id, { content: e.target.value })}
                                          className="w-full min-h-[160px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                                          placeholder={
                                            isJson
                                              ? 'JSON 형식으로 규칙을 입력하세요.'
                                              : '자연어(텍스트) 형태로 규칙을 입력하세요.'
                                          }
                                          spellCheck={false}
                                        />
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
                  </div>
                )
              })()}

              {activeTab === 'script' && (() => {
                const scripts = iface.regexScripts ?? []
                const scriptTypeLabels: Record<RegexScriptType, string> = {
                  modify_input: 'Modify Input (사용자 입력)',
                  modify_output: 'Modify Output (캐릭터 출력)',
                  modify_request: 'Modify Request (전송 데이터)',
                  modify_display: 'Modify Display (표시만)',
                }

                const addRegexScript = () => {
                  const next: RegexScriptEntry = {
                    id: uuidv4(),
                    name: '새 규칙',
                    scriptType: 'modify_display',
                    pattern: '',
                    replacement: '',
                    enabled: true,
                  }
                  patchInterface({ regexScripts: [...scripts, next] })
                  setExpandedRegexScriptId(next.id)
                }

                const updateRegexScript = (id: string, patch: Partial<RegexScriptEntry>) => {
                  patchInterface({
                    regexScripts: scripts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
                  })
                }

                const removeRegexScript = (id: string) => {
                  if (!window.confirm('이 정규식 스크립트를 삭제할까요?')) return
                  patchInterface({ regexScripts: scripts.filter((s) => s.id !== id) })
                  if (expandedRegexScriptId === id) setExpandedRegexScriptId(null)
                }

                return (
                  <div className="space-y-5">
                    <div>
                      <label className="block mb-2 font-semibold">백그라운드 임베딩</label>
                      <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                        RisuAI의 Background embedding과 같이, 채팅 요청 시 <b>시스템·백그라운드 컨텍스트에 항상 붙는</b>{' '}
                        텍스트입니다. 세계관 고정 규칙, 출력 형식, 금지 사항 등을 넣을 수 있습니다. (실제 병합은 /chat
                        연동 시 적용)
                      </p>
                      <textarea
                        value={iface.backgroundEmbedding ?? ''}
                        onChange={(e) => patchInterface({ backgroundEmbedding: e.target.value })}
                        className="w-full min-h-[140px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                        placeholder="예: 항상 3인칭 서술로 응답한다. HTML 태그는 사용하지 않는다."
                        spellCheck={false}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <label className="block font-semibold">정규식 스크립트 (Regex Script)</label>
                          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                            RisuAI와 동일한 개념: <b>IN</b>(정규식)에 맞는 문자열을 <b>OUT</b>(치환문)으로 바꿉니다.
                            Modify Display는 채팅 로그는 그대로 두고 화면에만 다르게 보이게 할 때 씁니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addRegexScript}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#444] text-xs hover:border-white"
                        >
                          <Plus size={14} /> 규칙 추가
                        </button>
                      </div>

                      <ul className="text-[10px] text-gray-500 space-y-0.5 list-disc list-inside">
                        <li>Modify Input — 사용자가 보낸 메시지를 API 전에 수정</li>
                        <li>Modify Output — 모델 응답을 저장/후처리 전에 수정</li>
                        <li>Modify Request — 전송 직전 전체 채팅 데이터 수정</li>
                        <li>Modify Display — 표시 텍스트만 바꾸고 저장 데이터는 유지</li>
                      </ul>

                      <div className="border border-[#333] rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-[#111] text-gray-400">
                            <tr>
                              <th className="w-8 px-2 py-2 text-left" />
                              <th className="px-2 py-2 text-left min-w-[80px]">이름</th>
                              <th className="px-2 py-2 text-left min-w-[140px]">타입</th>
                              <th className="px-2 py-2 text-center w-14">사용</th>
                              <th className="w-10 px-2 py-2 text-right" />
                            </tr>
                          </thead>
                          <tbody>
                            {scripts.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                                  규칙이 없습니다. &quot;규칙 추가&quot;를 눌러 행을 눌러 IN/OUT을 설정하세요.
                                </td>
                              </tr>
                            ) : (
                              scripts.map((s) => {
                                const open = expandedRegexScriptId === s.id
                                return (
                                  <Fragment key={s.id}>
                                    <tr
                                      onClick={() =>
                                        setExpandedRegexScriptId((p) => (p === s.id ? null : s.id))
                                      }
                                      className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                                    >
                                      <td className="px-2 py-2 align-middle text-gray-500">
                                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </td>
                                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          value={s.name}
                                          onChange={(e) => updateRegexScript(s.id, { name: e.target.value })}
                                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                                          placeholder="이름"
                                        />
                                      </td>
                                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={s.scriptType}
                                          onChange={(e) =>
                                            updateRegexScript(s.id, {
                                              scriptType: e.target.value as RegexScriptType,
                                            })
                                          }
                                          className="w-full min-w-0 bg-[#111] border border-[#333] rounded px-2 py-1 text-[10px]"
                                        >
                                          {(Object.keys(scriptTypeLabels) as RegexScriptType[]).map((k) => (
                                            <option key={k} value={k}>
                                              {scriptTypeLabels[k]}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={s.enabled}
                                          onChange={(e) =>
                                            updateRegexScript(s.id, { enabled: e.target.checked })
                                          }
                                          className="align-middle"
                                        />
                                      </td>
                                      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => removeRegexScript(s.id)}
                                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                          title="삭제"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                    {open && (
                                      <tr className="border-t border-[#222] bg-[#0b0b0f]">
                                        <td colSpan={5} className="px-3 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                                          <div>
                                            <label className="block text-[10px] text-gray-500 mb-1">
                                              IN (정규식 · Matches)
                                            </label>
                                            <input
                                              value={s.pattern}
                                              onChange={(e) =>
                                                updateRegexScript(s.id, { pattern: e.target.value })
                                              }
                                              className="w-full bg-[#090909] border border-[#333] rounded px-2 py-1.5 text-xs font-mono"
                                              placeholder="예: \\[status\\]"
                                              spellCheck={false}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-gray-500 mb-1">
                                              OUT (치환 · Replacement)
                                            </label>
                                            <textarea
                                              value={s.replacement}
                                              onChange={(e) =>
                                                updateRegexScript(s.id, { replacement: e.target.value })
                                              }
                                              className="w-full min-h-[88px] bg-[#090909] border border-[#333] rounded px-2 py-1.5 text-xs font-mono"
                                              placeholder="매칭된 부분을 이 문자열로 바꿉니다. $1, $2 …"
                                              spellCheck={false}
                                            />
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
                    </div>
                  </div>
                )
              })()}

              {activeTab === 'extraInterface' && (() => {
                const entries = iface.extraInterfaceEntries ?? []

                const setEntries = (next: ExtraInterfaceEntry[]) => {
                  patchInterface({ extraInterfaceEntries: next })
                }

                const addEntry = () => {
                  const row: ExtraInterfaceEntry = {
                    id: uuidv4(),
                    name: `설정 ${entries.length + 1}`,
                    json: '{\n  "icons": [],\n  "characterLayout": {}\n}',
                  }
                  setEntries([...entries, row])
                  setExpandedExtraInterfaceId(row.id)
                }

                const updateEntry = (id: string, patch: Partial<ExtraInterfaceEntry>) => {
                  setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)))
                }

                const removeEntry = (id: string) => {
                  if (!window.confirm('이 항목을 삭제할까요?')) return
                  setEntries(entries.filter((e) => e.id !== id))
                  if (expandedExtraInterfaceId === id) setExpandedExtraInterfaceId(null)
                }

                const exampleJson = `{
  "icons": [
    { "id": "inventory", "label": "가방", "position": "bottom-right", "lucide": "Backpack" }
  ],
  "characterLayout": {
    "liftPx": 96,
    "scale": 0.95,
    "maxWidthPx": 280,
    "heightVh": 40,
    "multi": {
      "sideBySide": true,
      "gapPx": 20,
      "maxPerRow": 3,
      "align": "end",
      "justify": "center"
    }
  },
  "overlays": []
}`

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block font-semibold">추가 인터페이스 설정</label>
                      <button
                        type="button"
                        onClick={addEntry}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#444] text-xs hover:border-white"
                      >
                        <Plus size={14} /> 항목 추가
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      채팅·게임 화면에 올릴 <b>아이콘, 버튼, 오버레이</b> 등을 JSON으로 정의합니다.{' '}
                      <b className="text-gray-300">characterLayout</b>으로 스프라이트 <b>위치(liftPx)</b>,{' '}
                      <b>크기(scale, heightVh, maxWidthPx)</b>를 조정할 수 있고, 한 메시지에{' '}
                      <code className="text-[10px] text-pink-300/90">&lt;img=…&gt;</code> 캐릭터 태그가 여러 개일 때{' '}
                      <b>multi.sideBySide</b> 등으로 <b>옆으로 나열·줄바꿈(maxPerRow)</b>할 수 있습니다. 행을 눌러 JSON을
                      펼쳐 편집하세요. (항목이 여러 개면 뒤쪽 JSON이 앞쪽 characterLayout을 덮어씁니다.)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const row: ExtraInterfaceEntry = {
                          id: uuidv4(),
                          name: '예시: 상단 아이콘',
                          json: exampleJson,
                        }
                        if (entries.length > 0 && !window.confirm('예시 항목을 목록에 추가할까요?')) return
                        setEntries([...entries, row])
                        setExpandedExtraInterfaceId(row.id)
                      }}
                      className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
                    >
                      예시 JSON 항목 추가
                    </button>

                    <div className="border border-[#333] rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-[#111] text-gray-400">
                          <tr>
                            <th className="w-8 px-2 py-2 text-left" />
                            <th className="px-2 py-2 text-left min-w-[100px]">이름</th>
                            <th className="w-10 px-2 py-2 text-right" />
                          </tr>
                        </thead>
                        <tbody>
                          {entries.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                                항목이 없습니다. &quot;항목 추가&quot;로 JSON 블록을 만드세요.
                              </td>
                            </tr>
                          ) : (
                            entries.map((e) => {
                              const open = expandedExtraInterfaceId === e.id
                              return (
                                <Fragment key={e.id}>
                                  <tr
                                    onClick={() =>
                                      setExpandedExtraInterfaceId((p) => (p === e.id ? null : e.id))
                                    }
                                    className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                                  >
                                    <td className="px-2 py-2 align-middle text-gray-500">
                                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}>
                                      <input
                                        value={e.name}
                                        onChange={(ev) => updateEntry(e.id, { name: ev.target.value })}
                                        className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                                        placeholder="블록 이름"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => removeEntry(e.id)}
                                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                        title="삭제"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                  {open && (
                                    <tr className="border-t border-[#222] bg-[#0b0b0f]">
                                      <td colSpan={3} className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                                        <label className="block text-[10px] text-gray-500 mb-1">JSON</label>
                                        <textarea
                                          value={e.json}
                                          onChange={(ev) => updateEntry(e.id, { json: ev.target.value })}
                                          className="w-full min-h-[200px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                                          placeholder={exampleJson}
                                          spellCheck={false}
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1">
                                          유효한 JSON인지는 저장 시 검사하지 않습니다. 키 구조는 클라이언트 구현에
                                          맞추면 됩니다.
                                        </p>
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
                {saveStatus === 'saved' ? '✓ 저장되었습니다!' : '캐릭터 저장 (Ctrl+S)'}
              </button>
              <p className="mt-2 text-[10px] text-gray-500 leading-relaxed text-center">
                데이터는 이 브라우저의 <strong className="text-gray-400">IndexedDB</strong>에 저장됩니다(용량은
                localStorage보다 훨씬 넉넉하지만 무제한은 아님). 장 수가 적어도 고해상도 이미지는 base64로 커질 수
                있습니다. localhost와 배포 URL은 저장소가 따로입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

