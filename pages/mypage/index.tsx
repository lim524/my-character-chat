import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Bot,
  Boxes,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  KeyRound,
  Languages,
  Pencil,
  Plus,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  DEFAULT_API_MODELS,
  DEFAULT_API_PROVIDERS,
  DEFAULT_CHAT_PARAMETERS,
  DEFAULT_MODULES_CONFIG,
  getApiModels,
  getApiProviders,
  getAppLanguage,
  getChatParameters,
  getModuleBundles,
  getPromptBundles,
  setApiModels,
  setApiProviders,
  setAppLanguage,
  setChatParameters,
  setModuleBundles,
  setPromptBundles,
  type ApiModels,
  type ApiProviders,
  type AppLanguage,
  type ModuleBundle,
  type PromptBundle,
  type ProviderId,
} from '@/lib/appSettings'

type MenuId = 'chatbot' | 'language'
type ChatbotTabId = 'api' | 'parameters' | 'prompts' | 'modules'

const MENU_ITEMS: { id: MenuId; label: string; icon: React.ReactNode }[] = [
  { id: 'chatbot', label: '채팅 봇', icon: <Bot className="w-5 h-5" /> },
  { id: 'language', label: '언어', icon: <Languages className="w-5 h-5" /> },
]

const CHATBOT_TABS: { id: ChatbotTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'api', label: 'API', icon: <KeyRound className="w-4 h-4" /> },
  { id: 'parameters', label: '파라미터', icon: <Sliders className="w-4 h-4" /> },
  { id: 'prompts', label: '프롬프트', icon: <FileText className="w-4 h-4" /> },
  { id: 'modules', label: '모듈', icon: <Boxes className="w-4 h-4" /> },
]

const PROVIDER_LABEL: Record<ProviderId, string> = {
  openai: 'OpenAI (GPT)',
  openrouter: 'OpenRouter',
  gemini: 'Gemini',
  anthropic: 'Claude (Anthropic)',
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? '')))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export default function MyPage() {
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState<MenuId>('chatbot')
  const [activeChatbotTab, setActiveChatbotTab] = useState<ChatbotTabId>('api')

  const [language, setLanguage] = useState<AppLanguage>('ko')
  const [providers, setProvidersState] = useState<ApiProviders>(DEFAULT_API_PROVIDERS)
  const [models, setModelsState] = useState<ApiModels>(DEFAULT_API_MODELS)
  const [params, setParamsState] = useState(DEFAULT_CHAT_PARAMETERS)
  const [promptBundles, setPromptBundlesState] = useState<PromptBundle[]>([])
  const [moduleBundles, setModuleBundlesState] = useState<ModuleBundle[]>([])

  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState<Record<ProviderId, boolean>>({
    openai: false,
    openrouter: false,
    gemini: false,
    anthropic: false,
  })
  const [newModel, setNewModel] = useState<Record<ProviderId, string>>({
    openai: '',
    openrouter: '',
    gemini: '',
    anthropic: '',
  })

  const promptImportRef = useRef<HTMLInputElement | null>(null)
  const moduleImportRef = useRef<HTMLInputElement | null>(null)

  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [promptDraft, setPromptDraft] = useState<PromptBundle | null>(null)

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [moduleDraft, setModuleDraft] = useState<ModuleBundle | null>(null)

  useEffect(() => {
    void (async () => {
      setLanguage(await getAppLanguage())
      setProvidersState(await getApiProviders())
      setModelsState(await getApiModels())
      setParamsState(await getChatParameters())
      setPromptBundlesState(await getPromptBundles())
      setModuleBundlesState(await getModuleBundles())
    })()
  }, [])

  const handleSave = async () => {
    try {
      await setAppLanguage(language)
      await setApiProviders(providers)
      await setApiModels(models)
      await setChatParameters(params)
      await setPromptBundles(promptBundles)
      await setModuleBundles(moduleBundles)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('[mypage] 설정 저장 실패', e)
      alert(
        '저장에 실패했습니다. 브라우저가 IndexedDB를 허용하는지, 사이트 데이터가 차단되지 않았는지 확인해 주세요.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-20 flex">
      <aside className="w-52 flex-shrink-0 border-r border-[#333] bg-[#1f1f1f] flex flex-col">
        <nav className="p-2 flex flex-col gap-0.5">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition ${
                activeMenu === item.id
                  ? 'bg-[#333] text-white'
                  : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto p-2 border-t border-[#333]">
          <button
            onClick={() => router.push('/characters')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200 transition"
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-sm font-medium">캐릭터 관리</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {activeMenu === 'chatbot' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-6">
              <div className="w-44 flex-shrink-0">
                <div className="text-sm text-gray-400 mb-2">채팅 봇</div>
                <div className="flex flex-col gap-1">
                  {CHATBOT_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveChatbotTab(tab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        activeChatbotTab === tab.id
                          ? 'bg-[#2a2a2a] border-[#555] text-white'
                          : 'bg-transparent border-transparent text-gray-400 hover:bg-[#222] hover:text-gray-200'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="max-w-2xl mx-auto space-y-6">
                  {activeChatbotTab === 'api' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h2 className="text-xl font-bold">API</h2>
                        <p className="text-sm text-gray-400 mt-2">
                          로컬 전용입니다. 여기서 API 키와 사용할 모델 목록을 입력하세요.
                        </p>
                        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                          <b>모델</b>은 <b>＋ 추가 / 삭제 시마다 IndexedDB에 바로 저장</b>됩니다. API 키·프롬프트 번들 등
                          나머지는 하단 <b>「설정 저장」</b>을 눌러야 반영됩니다.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {(Object.keys(PROVIDER_LABEL) as ProviderId[]).map((pid) => (
                          <div
                            key={pid}
                            className="bg-[#202020] border border-[#333] rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold">{PROVIDER_LABEL[pid]}</div>
                              <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setShowKey((prev) => ({ ...prev, [pid]: !prev[pid] }))}
                                title={showKey[pid] ? '숨기기' : '보기'}
                              >
                                {showKey[pid] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm text-gray-300 mb-1">API Key</label>
                              <input
                                type={showKey[pid] ? 'text' : 'password'}
                                value={providers[pid].apiKey}
                                onChange={(e) =>
                                  setProvidersState((prev) => ({
                                    ...prev,
                                    [pid]: { apiKey: e.target.value },
                                  }))
                                }
                                placeholder="IndexedDB에 평문 저장"
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Models</label>
                              <div className="flex gap-2">
                                <input
                                  value={newModel[pid]}
                                  onChange={(e) => setNewModel((prev) => ({ ...prev, [pid]: e.target.value }))}
                                  placeholder={pid === 'openrouter' ? '예: openrouter/anthropic/claude-3.5-sonnet' : '예: gpt-4o'}
                                  className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                                />
                                <button
                                  onClick={() => {
                                    const v = newModel[pid].trim()
                                    if (!v) return
                                    setModelsState((prev) => {
                                      const next: ApiModels = {
                                        ...prev,
                                        [pid]: Array.from(new Set([...(prev[pid] ?? []), v])),
                                      }
                                      void setApiModels(next).catch((err) => {
                                        console.error(err)
                                        alert(
                                          '모델 목록 저장에 실패했습니다. IndexedDB(사이트 데이터)를 확인해 주세요.'
                                        )
                                      })
                                      return next
                                    })
                                    setNewModel((prev) => ({ ...prev, [pid]: '' }))
                                  }}
                                  className="px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                                  title="추가"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(models[pid] ?? []).map((m) => (
                                  <span
                                    key={m}
                                    className="inline-flex items-center gap-1 bg-[#2a2a2a] border border-[#444] px-2 py-1 rounded text-xs text-gray-200"
                                  >
                                    {m}
                                    <button
                                      onClick={() =>
                                        setModelsState((prev) => {
                                          const next: ApiModels = {
                                            ...prev,
                                            [pid]: (prev[pid] ?? []).filter((x) => x !== m),
                                          }
                                          void setApiModels(next).catch((err) => {
                                            console.error(err)
                                            alert(
                                              '모델 목록 저장에 실패했습니다. IndexedDB(사이트 데이터)를 확인해 주세요.'
                                            )
                                          })
                                          return next
                                        })
                                      }
                                      className="text-gray-400 hover:text-white"
                                      title="삭제"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeChatbotTab === 'parameters' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-xl font-bold">파라미터</h2>
                        <p className="text-sm text-gray-400 mt-2">
                          입력/출력 길이 제한과 temperature를 설정합니다.
                        </p>
                      </div>
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Temperature (0~2)</label>
                          <input
                            type="number"
                            min={0}
                            max={2}
                            step={0.1}
                            value={params.temperature}
                            onChange={(e) =>
                              setParamsState((prev) => ({
                                ...prev,
                                temperature: Math.max(0, Math.min(2, parseFloat(e.target.value) || 0.7)),
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">최대 Input 길이 (chars)</label>
                            <input
                              type="number"
                              min={100}
                              max={200000}
                              value={params.maxInputChars}
                              onChange={(e) =>
                                setParamsState((prev) => ({
                                  ...prev,
                                  maxInputChars: parseInt(e.target.value, 10) || 4000,
                                }))
                              }
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">최대 Output 길이 (chars)</label>
                            <input
                              type="number"
                              min={100}
                              max={200000}
                              value={params.maxOutputChars}
                              onChange={(e) =>
                                setParamsState((prev) => ({
                                  ...prev,
                                  maxOutputChars: parseInt(e.target.value, 10) || 4000,
                                }))
                              }
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompts Bundles */}
                  {activeChatbotTab === 'prompts' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-xl font-bold">프롬프트 번들</h2>
                        <p className="text-sm text-gray-400 mt-2">
                          번들을 생성/관리하고 활성화(복수)할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const id = crypto.randomUUID()
                            setEditingPromptId(id)
                            setPromptDraft({
                              id,
                              name: '',
                              description: '',
                              enabled: true,
                              mainPrompt: '',
                              characterPrompt: '',
                              jailbreakPrompt: '',
                              systemPromptAppend: '',
                            })
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                        >
                          <Plus className="w-4 h-4" />
                          생성
                        </button>
                        <button
                          onClick={() => promptImportRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                        >
                          <Upload className="w-4 h-4" />
                          Import
                        </button>
                        <button
                          onClick={() => downloadJson('prompts-bundles.json', promptBundles)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        <input
                          ref={promptImportRef}
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              const json = await readJsonFile(file)
                              const arr = Array.isArray(json) ? json : []
                              const imported: PromptBundle[] = arr
                                .filter((x) => x && typeof x === 'object')
                                .map((x: any) => ({
                                  id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
                                  name: typeof x.name === 'string' ? x.name : '',
                                  description: typeof x.description === 'string' ? x.description : '',
                                  enabled: x.enabled === true,
                                  mainPrompt: typeof x.mainPrompt === 'string' ? x.mainPrompt : '',
                                  characterPrompt: typeof x.characterPrompt === 'string' ? x.characterPrompt : '',
                                  jailbreakPrompt: typeof x.jailbreakPrompt === 'string' ? x.jailbreakPrompt : '',
                                  systemPromptAppend: typeof x.systemPromptAppend === 'string' ? x.systemPromptAppend : '',
                                }))
                              setPromptBundlesState(imported)
                            } catch {
                              alert('Import 실패: JSON 형식을 확인해 주세요.')
                            } finally {
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>

                      {editingPromptId && promptDraft ? (
                        <div className="bg-[#202020] border border-[#333] rounded-lg p-4 space-y-4 text-left">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">번들 편집</div>
                            <button
                              className="text-gray-400 hover:text-white"
                              onClick={() => {
                                setEditingPromptId(null)
                                setPromptDraft(null)
                              }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">이름</label>
                              <input
                                value={promptDraft.name}
                                onChange={(e) => setPromptDraft({ ...promptDraft, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                              />
                            </div>
                            <div className="flex items-end justify-between gap-2">
                              <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={promptDraft.enabled}
                                  onChange={() => setPromptDraft({ ...promptDraft, enabled: !promptDraft.enabled })}
                                  className="w-4 h-4"
                                />
                                활성화
                              </label>
                              <button
                                onClick={() => downloadJson(`prompt-bundle-${promptDraft.id}.json`, promptDraft)}
                                className="text-sm px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">설명</label>
                            <textarea
                              value={promptDraft.description}
                              onChange={(e) => setPromptDraft({ ...promptDraft, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Main Prompt</label>
                            <textarea
                              value={promptDraft.mainPrompt}
                              onChange={(e) => setPromptDraft({ ...promptDraft, mainPrompt: e.target.value })}
                              rows={5}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Character Prompt</label>
                            <textarea
                              value={promptDraft.characterPrompt}
                              onChange={(e) => setPromptDraft({ ...promptDraft, characterPrompt: e.target.value })}
                              rows={5}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Jailbreak</label>
                            <textarea
                              value={promptDraft.jailbreakPrompt}
                              onChange={(e) => setPromptDraft({ ...promptDraft, jailbreakPrompt: e.target.value })}
                              rows={5}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">추가 시스템 프롬프트</label>
                            <textarea
                              value={promptDraft.systemPromptAppend}
                              onChange={(e) => setPromptDraft({ ...promptDraft, systemPromptAppend: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setPromptBundlesState((prev) => {
                                  const exists = prev.some((b) => b.id === promptDraft.id)
                                  return exists
                                    ? prev.map((b) => (b.id === promptDraft.id ? promptDraft : b))
                                    : [promptDraft, ...prev]
                                })
                                setEditingPromptId(null)
                                setPromptDraft(null)
                              }}
                              className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {promptBundles.length === 0 ? (
                            <div className="text-center text-sm text-gray-400 py-10">
                              아직 번들이 없습니다. “생성”을 눌러 추가하세요.
                            </div>
                          ) : (
                            promptBundles.map((b) => (
                              <div key={b.id} className="bg-[#202020] border border-[#333] rounded-lg p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-semibold truncate">{b.name || '이름 없음'}</div>
                                    <div className="text-xs text-gray-400 line-clamp-2">{b.description}</div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() =>
                                        setPromptBundlesState((prev) =>
                                          prev.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x))
                                        )
                                      }
                                      className="text-gray-300 hover:text-white"
                                      title={b.enabled ? '비활성화' : '활성화'}
                                    >
                                      {b.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingPromptId(b.id)
                                        setPromptDraft(b)
                                      }}
                                      className="text-gray-300 hover:text-white"
                                      title="편집"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => downloadJson(`prompt-bundle-${b.id}.json`, b)}
                                      className="text-gray-300 hover:text-white"
                                      title="단일 Export"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!confirm('이 번들을 삭제할까요?')) return
                                        setPromptBundlesState((prev) => prev.filter((x) => x.id !== b.id))
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modules Bundles */}
                  {activeChatbotTab === 'modules' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-xl font-bold">모듈 번들</h2>
                        <p className="text-sm text-gray-400 mt-2">
                          번들을 생성/관리하고 활성화(복수)할 수 있습니다. (이번 단계에서는 저장만)
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const id = crypto.randomUUID()
                            setEditingModuleId(id)
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
                          accept="application/json"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              const json = await readJsonFile(file)
                              const arr = Array.isArray(json) ? json : []
                              const imported: ModuleBundle[] = arr
                                .filter((x) => x && typeof x === 'object')
                                .map((x: any) => ({
                                  id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
                                  name: typeof x.name === 'string' ? x.name : '',
                                  description: typeof x.description === 'string' ? x.description : '',
                                  enabled: x.enabled === true,
                                  lorebook: x.lorebook ?? DEFAULT_MODULES_CONFIG.lorebook,
                                  regex: x.regex ?? DEFAULT_MODULES_CONFIG.regex,
                                  assets: x.assets ?? DEFAULT_MODULES_CONFIG.assets,
                                }))
                              setModuleBundlesState(imported)
                            } catch {
                              alert('Import 실패: JSON 형식을 확인해 주세요.')
                            } finally {
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>

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

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">이름</label>
                              <input
                                value={moduleDraft.name}
                                onChange={(e) => setModuleDraft({ ...moduleDraft, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                              />
                            </div>
                            <div className="flex items-end justify-between gap-2">
                              <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={moduleDraft.enabled}
                                  onChange={() => setModuleDraft({ ...moduleDraft, enabled: !moduleDraft.enabled })}
                                  className="w-4 h-4"
                                />
                                활성화
                              </label>
                              <button
                                onClick={() => downloadJson(`module-bundle-${moduleDraft.id}.json`, moduleDraft)}
                                className="text-sm px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
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
                              rows={2}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white resize-none"
                            />
                          </div>

                          <div className="text-sm text-gray-400">
                            Lorebook/Regex/Assets는 아직 “동작”은 없지만, 번들 안에서 편집/저장할 수 있습니다.
                          </div>

                          <div className="space-y-4">
                            <div className="bg-[#1a1a1a] border border-[#333] rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm">Lorebook</div>
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
                                  enabled
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
                                    // ignore parse while typing
                                  }
                                }}
                                rows={6}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white text-xs font-mono resize-none"
                              />
                              <div className="text-[11px] text-gray-500">
                                형식: <code>[{'{'} id, keywords: string[], content {'}'}]</code>
                              </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#333] rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm">Regex</div>
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
                                  enabled
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
                                  } catch {
                                    // ignore
                                  }
                                }}
                                rows={6}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white text-xs font-mono resize-none"
                              />
                              <div className="text-[11px] text-gray-500">
                                형식: <code>[{'{'} id, pattern, replace, flags {'}'}]</code>
                              </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#333] rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm">Assets</div>
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
                                  enabled
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
                                  } catch {
                                    // ignore
                                  }
                                }}
                                rows={6}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white text-xs font-mono resize-none"
                              />
                              <div className="text-[11px] text-gray-500">
                                형식: <code>[{'{'} id, type: 'image'|'audio', name, url {'}'}]</code>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
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
                              className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {moduleBundles.length === 0 ? (
                            <div className="text-center text-sm text-gray-400 py-10">
                              아직 번들이 없습니다. “생성”을 눌러 추가하세요.
                            </div>
                          ) : (
                            moduleBundles.map((b) => (
                              <div key={b.id} className="bg-[#202020] border border-[#333] rounded-lg p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-semibold truncate">{b.name || '이름 없음'}</div>
                                    <div className="text-xs text-gray-400 line-clamp-2">{b.description}</div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() =>
                                        setModuleBundlesState((prev) =>
                                          prev.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x))
                                        )
                                      }
                                      className="text-gray-300 hover:text-white"
                                    >
                                      {b.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingModuleId(b.id)
                                        setModuleDraft(b)
                                      }}
                                      className="text-gray-300 hover:text-white"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => downloadJson(`module-bundle-${b.id}.json`, b)}
                                      className="text-gray-300 hover:text-white"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!confirm('이 번들을 삭제할까요?')) return
                                        setModuleBundlesState((prev) => prev.filter((x) => x.id !== b.id))
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'language' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">언어</h2>
              <p className="text-sm text-gray-400 mt-2">앱 표시 언어를 설정합니다.</p>
            </div>
            <div className="text-left flex justify-center">
              <div className="w-full max-w-sm">
                <label className="block text-sm text-gray-300 mb-2">앱 표시 언어</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#333]">
          <div className="max-w-2xl mx-auto flex justify-center">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              {saved ? '저장됨' : '설정 저장'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
