import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '@/context/LanguageContext'
import dynamic from 'next/dynamic'
import TopNav from '@/components/TopNav'
import { CreateDialogueTab } from '@/components/create/CreateDialogueTab'
import { CreateExtraInterfaceTab } from '@/components/create/CreateExtraInterfaceTab'
import { CreateImagesTab } from '@/components/create/CreateImagesTab'
import { CreateLorebookTab } from '@/components/create/CreateLorebookTab'
import { CreateProfileTab } from '@/components/create/CreateProfileTab'
import GlobalUiLayersEditor from '@/components/GlobalUiLayersEditor'
import CreateAiGuideModal from '@/components/create/CreateAiGuideModal'
import { CreateGameVariablesTab } from '@/components/create/CreateGameVariablesTab'
import { CreateScreenTab } from '@/components/create/CreateScreenTab'
import { CreateScriptTab } from '@/components/create/CreateScriptTab'
import type { SidebarTabId } from '@/components/create/types'
import {
  loadCharacterDraft,
  persistCharacterDraft,
  saveCharacterDraft,
  type AssetRef,
  type AssetType,
  type CharacterDraft,
  type InterfaceConfig,
  type LoreEntry,
  type ScreenConfig,
} from '@/lib/interfaceConfig'
import { createInitialInterfaceConfig } from '@/lib/interfaceEval'
import {
  getUserPersona,
} from '@/lib/appSettings'
import type { GlobalUiLayer } from '@/lib/globalUiLayers'
import { v4 as uuidv4 } from 'uuid'
import {
  User,
  BookOpen,
  Image as ImageIcon,
  Monitor,
  MessageCircle,
  Layers,
  FileCode2,
  LayoutTemplate,
  Braces,
} from 'lucide-react'
import { saveLocalCharacter, type LocalCharacter } from '@/lib/localStorage'
import { downloadCharacterCardJson } from '@/lib/characterCardInterop'
import { importCharacterFromFile } from '@/lib/cardImportRouter'
import {
  DEFAULT_CHARACTER_LIFT_PX,
  effectiveCharacterLiftPx,
  parseMergedCharacterLayoutFromExtraEntries,
} from '@/lib/interfaceRuntime'
import {
  parseExternalLoreEntries,
  parseTextToLoreEntries,
  parseExternalRegexScripts,
  parseExternalPromptBundle,
} from '@/lib/externalImportUtils'
import type { RegexScriptType } from '@/lib/interfaceConfig'

const DatingSimScreenPreview = dynamic(
  () => import('@/components/DatingSimScreenPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-gray-500">
        프리뷰 로딩…
      </div>
    ),
  }
)

const GlobalUiLayersRuntime = dynamic(() => import('@/components/GlobalUiLayersRuntime'), {
  ssr: false,
})

export default function CreatePage() {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<CharacterDraft>({})
  const [iface, setIface] = useState<InterfaceConfig | null>(null)
  const [activeTab, setActiveTab] = useState<SidebarTabId>('profile')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saved'>('idle')
  const [expandedLoreId, setExpandedLoreId] = useState<string | null>(null)
  const lorebookGlobalImportRef = useRef<HTMLInputElement>(null)
  const lorebookSingleImportRef = useRef<HTMLInputElement>(null)
  const [lorebookImportTargetId, setLorebookImportTargetId] = useState<string | null>(null)
  const imagesFileInputRef = useRef<HTMLInputElement>(null)
  const imagesFolderInputRef = useRef<HTMLInputElement>(null)
  const imageReplaceInputRef = useRef<HTMLInputElement>(null)
  const [imageReplaceTargetId, setImageReplaceTargetId] = useState<string | null>(null)
  const lorebookFolderImportRef = useRef<HTMLInputElement>(null)
  const scriptFileImportRef = useRef<HTMLInputElement>(null)
  const scriptFolderImportRef = useRef<HTMLInputElement>(null)
  const [addAssetType, setAddAssetType] = useState<AssetType>('character')
  const [imageCategoryTab, setImageCategoryTab] = useState<AssetType>('character')
  const [imageDropActive, setImageDropActive] = useState(false)
  const [uiThemeJsonText, setUiThemeJsonText] = useState('')
  const [expandedRegexScriptId, setExpandedRegexScriptId] = useState<string | null>(null)
  const [expandedScenarioRuleId, setExpandedScenarioRuleId] = useState<string | null>(null)
  const [expandedExtraInterfaceId, setExpandedExtraInterfaceId] = useState<string | null>(null)
  const [expandedGameVariableId, setExpandedGameVariableId] = useState<string | null>(null)
  const cardImportRef = useRef<HTMLInputElement>(null)
  const [globalUiLayers, setGlobalUiLayersState] = useState<GlobalUiLayer[]>([])
  /** 드래프트 비동기 로드 전에 빈 배열로 persistCharacterDraft 하는 것 방지 */
  const [globalUiDraftHydrated, setGlobalUiDraftHydrated] = useState(false)
  const [aiGuideOpen, setAiGuideOpen] = useState(false)

  const previewCharacterLiftPx = useMemo(() => {
    if (!iface) return DEFAULT_CHARACTER_LIFT_PX
    const layout = parseMergedCharacterLayoutFromExtraEntries(iface.extraInterfaceEntries)
    return effectiveCharacterLiftPx(iface.characterSpriteLiftPx, layout)
  }, [iface])

  const createTabBar = useMemo(
    () =>
      [
        ['profile', 'create.tabProfile', User],
        ['lorebook', 'create.tabLorebook', BookOpen],
        ['images', 'create.tabImages', ImageIcon],
        ['screen', 'create.tabScreen', Monitor],
        ['dialogue', 'create.tabDialogue', MessageCircle],
        ['script', 'create.tabScript', FileCode2],
        ['extraInterface', 'create.tabExtra', Layers],
        ['globalUi', 'create.tabGlobalUi', LayoutTemplate],
        ['gameVariables', 'create.tabGameVars', Braces],
      ] as [SidebarTabId, string, typeof User][],
    []
  )

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
      
      const globalPersona = await getUserPersona()
      const draftLayers: GlobalUiLayer[] = Array.isArray(loaded.globalUiLayers)
        ? loaded.globalUiLayers
        : []
      const draftSynced = {
        ...loaded,
        interfaceConfig: baseIface,
        globalUiLayers: draftLayers,
        userName: loaded.userName || globalPersona.name,
        userDescription: loaded.userDescription || globalPersona.description,
      }
      setDraft(draftSynced)
      await persistCharacterDraft(draftSynced)
      setIface(baseIface)
      setGlobalUiLayersState(draftLayers)
      setGlobalUiDraftHydrated(true)
    })()
  }, [])

  useEffect(() => {
    if (!globalUiDraftHydrated) return
    setDraft((prev) => {
      const same =
        JSON.stringify(prev.globalUiLayers ?? []) === JSON.stringify(globalUiLayers)
      if (same) return prev
      const next = { ...prev, globalUiLayers }
      void persistCharacterDraft(next)
      return next
    })
  }, [globalUiLayers, globalUiDraftHydrated])

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
    const id = draft.id || uuidv4()
    const character: LocalCharacter = {
      id,
      name: (draft.name ?? '').trim() || '제목 없음',
      description: draft.description ?? '',
      personality: draft.personality ?? '',
      situation: draft.situation ?? '',
      firstLine: draft.firstLine ?? '',
      imageUrl: (draft.imageUrl as string) ?? draft.image_url ?? '',
      userName: draft.userName ?? draft.user_name ?? '',
      userRole: (draft.userRole as string) ?? draft.user_role ?? '',
      userDescription: draft.userDescription ?? draft.user_description ?? '',
      worldSetting: draft.worldSetting ?? draft.world_setting ?? draft.world_scenario ?? '',
      supporting: draft.supporting ?? [],
      protagonist: draft.protagonist ?? [],
      tags: draft.tags ?? [],
      isAdult: draft.isAdult ?? draft.is_adult ?? false,
      isPublic: draft.isPublic ?? draft.is_public ?? true,
      emotionImages: draft.emotionImages ?? draft.emotion_images ?? [],
      details: (draft.details as Record<string, unknown>) ?? {},
      interfaceConfig: iface,
      globalUiLayers,
    }

    const result = await saveLocalCharacter(character)
    if (!result.ok) {
      alert(result.error)
      return
    }
    if (!draft.id) patchDraft({ id })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleExportCharacterCard = () => {
    if (!iface) return
    const id = ((draft as CharacterDraft & { id?: string }).id as string | undefined) || uuidv4()
    const withLore = draft as CharacterDraft & { loreEntries?: LoreEntry[] }
    const exportChar = {
      ...draft,
      id,
      name: String(draft.name ?? '').trim() || 'Unnamed',
      description: String(draft.description ?? ''),
      personality: String(draft.personality ?? ''),
      situation: String(draft.situation ?? ''),
      firstLine: draft.firstLine,
      imageUrl: draft.imageUrl,
      emotionImages: draft.emotionImages,
      tags: draft.tags,
      userName: draft.userName,
      userRole: draft.userRole,
      userDescription: draft.userDescription,
      worldSetting: draft.worldSetting,
      supporting: draft.supporting,
      protagonist: draft.protagonist,
      isAdult: draft.isAdult,
      isPublic: draft.isPublic,
      details: draft.details ?? {},
      interfaceConfig: iface,
      loreEntries: withLore.loreEntries,
    } as LocalCharacter & { loreEntries?: LoreEntry[] }
    downloadCharacterCardJson(exportChar, { globalUiLayers })
  }

  const handleCardImportFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    try {
      const { character, warnings, globalUiLayers: importedGlobalLayers } =
        await importCharacterFromFile(file)
      const ic = character.interfaceConfig ?? createInitialInterfaceConfig()
      const importedLore = character as LocalCharacter & { loreEntries?: LoreEntry[] }
      let nextDraft: CharacterDraft = {
        ...draft,
        id: character.id,
        name: character.name,
        description: character.description,
        firstLine: character.firstLine,
        personality: character.personality,
        situation: character.situation,
        worldSetting: character.worldSetting ?? character.world_setting,
        tags: character.tags,
        isPublic: character.isPublic ?? character.is_public ?? true,
        isAdult: character.isAdult ?? character.is_adult,
        imageUrl: character.imageUrl ?? character.image_url,
        emotionImages: character.emotionImages ?? character.emotion_images,
        userName: character.userName ?? character.user_name,
        userRole: character.userRole ?? character.user_role,
        userDescription: character.userDescription ?? character.user_description,
        supporting: character.supporting,
        protagonist: character.protagonist,
        details: character.details ?? {},
        loreEntries: importedLore.loreEntries,
        interfaceConfig: ic,
      }
      if (importedGlobalLayers !== undefined) {
        nextDraft = { ...nextDraft, globalUiLayers: importedGlobalLayers }
        setGlobalUiLayersState(importedGlobalLayers)
      }
      setDraft(nextDraft)
      setIface(ic)
      await persistCharacterDraft(nextDraft)
      if (warnings.length) alert(warnings.join('\n'))
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : '카드 가져오기에 실패했습니다.')
    }
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
  
  const onLorebookFiles = async (files: FileList | null, targetId?: string | null) => {
    if (!files || files.length === 0) return
    const allNewEntries: LoreEntry[] = []
    
    for (const file of Array.from(files)) {
      const text = await file.text()
      if (
        file.name.toLowerCase().endsWith('.json') ||
        file.name.toLowerCase().endsWith('.risuai') ||
        file.name.toLowerCase().endsWith('.risum')
      ) {
        try {
          const json = JSON.parse(text)
          const entries = parseExternalLoreEntries(json)
          allNewEntries.push(...entries)
        } catch (e) {
          console.error('Failed to parse JSON lorebook', file.name, e)
        }
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        const entries = parseTextToLoreEntries(text, file.name)
        allNewEntries.push(...entries)
      }
    }

    if (allNewEntries.length === 0) return

    if (targetId) {
      // Single entry replacement
      const one = allNewEntries[0]
      const current = (draft.loreEntries as LoreEntry[] | undefined) ?? []
      patchDraft({
        loreEntries: current.map((e) => (e.id === targetId ? { ...one, id: targetId } : e))
      })
    } else {
      // Global append
      const current = (draft.loreEntries as LoreEntry[] | undefined) ?? []
      // Re-assign IDs to avoid collisions if multiple imports happen
      const final = allNewEntries.map(e => ({ ...e, id: uuidv4() }))
      patchDraft({ loreEntries: [...current, ...final] })
    }
  }

  const onScriptFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !iface) return
    const nextRegex = [...(iface.regexScripts || [])]
    let nextBackground = iface.backgroundEmbedding || ''

    for (const file of Array.from(files)) {
      const text = await file.text()
      if (
        file.name.toLowerCase().endsWith('.json') ||
        file.name.toLowerCase().endsWith('.risuai') ||
        file.name.toLowerCase().endsWith('.risum')
      ) {
        try {
          const json = JSON.parse(text)
          // Look for regex scripts
          const scripts = parseExternalRegexScripts(json)
          if (scripts.length > 0) {
            nextRegex.push(...scripts.map(s => ({
              id: uuidv4(),
              name: String(s.name || 'Imported Rule'),
              scriptType: (s.scriptType as RegexScriptType) || 'modify_display',
              pattern: String(s.pattern || ''),
              replacement: String(s.replacement || ''),
              enabled: s.enabled !== false,
            })))
          }
          // Look for prompt presets (background embedding)
          const bundle = parseExternalPromptBundle(json, file.name)
          if (bundle?.mainPrompt) {
            if (nextBackground.trim()) nextBackground += '\n\n'
            nextBackground += bundle.mainPrompt
          }
        } catch (e) {
          console.error('Failed to parse JSON script', file.name, e)
        }
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        if (nextBackground.trim()) nextBackground += '\n\n'
        nextBackground += text.trim()
      }
    }

    patchInterface({
      regexScripts: nextRegex,
      backgroundEmbedding: nextBackground,
    })
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
        {/* 프리뷰: 채팅방과 동일하게 남는 영역 전체(가로·세로) 사용 */}
        <div className="absolute inset-0 min-h-0 flex flex-col">
          <div className="relative min-h-0 flex-1 w-full">
            {(() => {
              const initialBg = (draft.details as Record<string, unknown>)?.initialBackground as string | undefined
              const initialChar = (draft.details as Record<string, unknown>)?.initialCharacter as string | undefined
              const previewConfig: ScreenConfig = {
                background: initialBg,
                characters: initialChar ? [{ slot: 'center', assetId: initialChar }] : [],
                dialogue: {
                  speakerName: draft.name || t('create.previewUnknown'),
                  text: draft.firstLine || t('create.previewFirstLine')
                }
              }
              return (
                <>
                  <DatingSimScreenPreview
                    screen={previewConfig}
                    assets={iface.assets}
                    uiTheme={iface.uiTheme}
                    extraInterfaceEntries={iface.extraInterfaceEntries}
                    regexScripts={iface.regexScripts}
                    characterSpriteLiftPx={previewCharacterLiftPx}
                    customCSS={iface.customCSS}
                  />
                  <GlobalUiLayersRuntime layers={globalUiLayers} layout="embedded" />
                </>
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
          {t('create.openSettings')}
        </button>

        {/* 사이드바 오버레이 */}
        {sidebarOpen && (
          <div className="absolute inset-y-0 left-0 w-[420px] max-w-[90vw] z-40 bg-[#050508]/95 border-r border-[#222] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#222]">
              <span className="text-sm font-semibold text-gray-200 tracking-wide">{t('create.sidebarTitle')}</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-[#111] border border-[#333] text-sm flex items-center justify-center hover:bg-[#1a1a1a]"
              >
                ✕
              </button>
            </div>

            <div className="flex px-4 pt-4 pb-3 gap-2 flex-wrap">
              {createTabBar.map(([id, labelKey, Icon]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={t(labelKey)}
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
                <CreateProfileTab draft={draft} patchDraft={patchDraft} />
              )}

              {activeTab === 'lorebook' && (
                <CreateLorebookTab
                  draft={draft}
                  patchDraft={patchDraft}
                  expandedLoreId={expandedLoreId}
                  setExpandedLoreId={setExpandedLoreId}
                  lorebookGlobalImportRef={lorebookGlobalImportRef}
                  lorebookFolderImportRef={lorebookFolderImportRef}
                  lorebookSingleImportRef={lorebookSingleImportRef}
                  lorebookImportTargetId={lorebookImportTargetId}
                  setLorebookImportTargetId={setLorebookImportTargetId}
                  onLorebookFiles={onLorebookFiles}
                />
              )}

              {activeTab === 'images' && (
                <CreateImagesTab
                  iface={iface}
                  patchInterface={patchInterface}
                  imageCategoryTab={imageCategoryTab}
                  setImageCategoryTab={setImageCategoryTab}
                  setAddAssetType={setAddAssetType}
                  addAssetsFromFiles={addAssetsFromFiles}
                  imagesFileInputRef={imagesFileInputRef}
                  imagesFolderInputRef={imagesFolderInputRef}
                  imageReplaceInputRef={imageReplaceInputRef}
                  onReplaceAssetImage={onReplaceAssetImage}
                  startReplaceAssetImage={startReplaceAssetImage}
                  imageDropActive={imageDropActive}
                  setImageDropActive={setImageDropActive}
                />
              )}

              {activeTab === 'screen' && (
                <CreateScreenTab
                  draft={draft}
                  patchDraft={patchDraft}
                  iface={iface}
                  patchInterface={patchInterface}
                  uiThemeJsonText={uiThemeJsonText}
                  setUiThemeJsonText={setUiThemeJsonText}
                />
              )}

              {activeTab === 'dialogue' && (
                <CreateDialogueTab
                  iface={iface}
                  patchInterface={patchInterface}
                  expandedScenarioRuleId={expandedScenarioRuleId}
                  setExpandedScenarioRuleId={setExpandedScenarioRuleId}
                />
              )}

              {activeTab === 'script' && (
                <CreateScriptTab
                  iface={iface}
                  patchInterface={patchInterface}
                  expandedRegexScriptId={expandedRegexScriptId}
                  setExpandedRegexScriptId={setExpandedRegexScriptId}
                  scriptFileImportRef={scriptFileImportRef}
                  scriptFolderImportRef={scriptFolderImportRef}
                  onScriptFiles={onScriptFiles}
                />
              )}

              {activeTab === 'extraInterface' && (
                <CreateExtraInterfaceTab
                  iface={iface}
                  patchInterface={patchInterface}
                  expandedExtraInterfaceId={expandedExtraInterfaceId}
                  setExpandedExtraInterfaceId={setExpandedExtraInterfaceId}
                />
              )}

              {activeTab === 'gameVariables' && (
                <CreateGameVariablesTab
                  iface={iface}
                  patchInterface={patchInterface}
                  expandedId={expandedGameVariableId}
                  setExpandedId={setExpandedGameVariableId}
                />
              )}

              {activeTab === 'globalUi' && (
                <GlobalUiLayersEditor
                  variant="create"
                  layers={globalUiLayers}
                  onLayersChange={setGlobalUiLayersState}
                  showSaveButton={false}
                />
              )}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 px-5 py-4 bg-[#050508]/95 border-t border-[#222] space-y-2">
              <input
                ref={cardImportRef}
                type="file"
                accept=".json,.png,.charx,.zip,application/json,image/png,application/zip"
                className="hidden"
                onChange={handleCardImportFile}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cardImportRef.current?.click()}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border border-[#444] bg-[#111] hover:bg-[#1a1a1a] text-gray-200"
                >
                  {t('create.cardImport')}
                </button>
                <button
                  type="button"
                  onClick={handleExportCharacterCard}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border border-[#444] bg-[#111] hover:bg-[#1a1a1a] text-gray-200"
                >
                  {t('create.cardExport')}
                </button>
              </div>
              <button
                onClick={handleSave}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#e45463] hover:bg-[#d04352] text-white'
                }`}
              >
                {saveStatus === 'saved' ? t('create.savedCharacter') : t('create.saveCharacter')}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAiGuideOpen(true)}
          className="fixed bottom-5 right-5 z-[55] rounded-full border border-[#444] bg-[#111]/95 px-4 py-2 text-xs font-medium text-gray-200 shadow-lg backdrop-blur-md hover:border-white/35 hover:bg-[#1a1a1a]"
        >
          {t('create.aiGuide')}
        </button>
        <CreateAiGuideModal open={aiGuideOpen} onClose={() => setAiGuideOpen(false)} />
      </div>
    </div>
  )
}

