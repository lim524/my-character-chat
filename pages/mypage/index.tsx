import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Bot,
  Boxes,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  KeyRound,
  Languages,
  Plus,
  Sliders,
  User,
  X,
} from 'lucide-react'
import {
  DEFAULT_API_MODELS,
  DEFAULT_API_PROVIDERS,
  DEFAULT_CHAT_PARAMETERS,
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
  getUserPersona,
  setUserPersona,
  type ApiModels,
  type ApiProviders,
  type AppLanguage,
  type ModuleBundle,
  type PromptBundle,
  type ProviderId,
  type UserPersona,
} from '@/lib/appSettings'
import { PromptSettingsTab } from '@/components/settings/PromptSettingsTab'
import { ModuleSettingsTab } from '@/components/settings/ModuleSettingsTab'

type MenuId = 'chatbot' | 'persona' | 'language'
type ChatbotTabId = 'api' | 'parameters' | 'prompts' | 'modules'

const MENU_ITEMS: { id: MenuId; label: string; icon: React.ReactNode }[] = [
  { id: 'chatbot', label: '채팅 봇', icon: <Bot className="w-5 h-5" /> },
  { id: 'persona', label: '유저 페르소나', icon: <User className="w-5 h-5" /> },
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
  const [userPersona, setUserPersonaState] = useState<UserPersona>({ name: '', description: '' })

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


  useEffect(() => {
    void (async () => {
      setLanguage(await getAppLanguage())
      setProvidersState(await getApiProviders())
      setModelsState(await getApiModels())
      setParamsState(await getChatParameters())
      setPromptBundlesState(await getPromptBundles())
      setModuleBundlesState(await getModuleBundles())
      setUserPersonaState(await getUserPersona())
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
      await setUserPersona(userPersona)
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
        {activeMenu === 'persona' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">유저 페르소나</h2>
              <p className="text-sm text-gray-400 mt-2">
                모든 채팅방에서 기본으로 사용될 당신의 정보를 입력하세요.<br/>
                캐릭터별로 별도의 유저 설정이 있다면 해당 설정이 우선 적용됩니다.
              </p>
            </div>

            <div className="bg-[#202020] border border-[#333] rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input
                  value={userPersona.name}
                  onChange={(e) => setUserPersonaState({ ...userPersona, name: e.target.value })}
                  placeholder="사용자"
                  className="w-full px-4 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-lg text-white focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">설명 (페르소나)</label>
                <textarea
                  value={userPersona.description}
                  onChange={(e) => setUserPersonaState({ ...userPersona, description: e.target.value })}
                  placeholder="당신의 성격, 외모, 캐릭터와의 관계 등을 자유롭게 적어보세요."
                  rows={8}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-white focus:border-white/30 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

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
                    <PromptSettingsTab
                      promptBundles={promptBundles}
                      setPromptBundlesState={setPromptBundlesState}
                    />
                  )}

                  {/* Modules Bundles */}
                  {activeChatbotTab === 'modules' && (
                    <ModuleSettingsTab
                      moduleBundles={moduleBundles}
                      setModuleBundlesState={setModuleBundlesState}
                    />
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
