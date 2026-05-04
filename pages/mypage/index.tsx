import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { useTranslation } from '@/context/LanguageContext'
import { APP_LANGUAGE_CHANGED_EVENT } from '@/lib/i18n/translate'

type MenuId = 'chatbot' | 'persona' | 'language'
type ChatbotTabId = 'api' | 'parameters' | 'prompts' | 'modules'

const PROVIDER_LABEL: Record<ProviderId, string> = {
  openai: 'OpenAI (GPT)',
  openrouter: 'OpenRouter',
  gemini: 'Gemini',
  anthropic: 'Claude (Anthropic)',
}


export default function MyPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState<MenuId>('chatbot')
  const [activeChatbotTab, setActiveChatbotTab] = useState<ChatbotTabId>('api')

  const MENU_ITEMS = useMemo(
    () =>
      [
        { id: 'chatbot' as const, label: t('mypage.menuChatbot'), icon: <Bot className="w-5 h-5" /> },
        { id: 'persona' as const, label: t('mypage.menuPersona'), icon: <User className="w-5 h-5" /> },
        { id: 'language' as const, label: t('mypage.menuLanguage'), icon: <Languages className="w-5 h-5" /> },
      ] satisfies { id: MenuId; label: string; icon: ReactNode }[],
    [t]
  )

  const CHATBOT_TABS = useMemo(
    () =>
      [
        { id: 'api' as const, label: t('mypage.tabApi'), icon: <KeyRound className="w-4 h-4" /> },
        { id: 'parameters' as const, label: t('mypage.tabParameters'), icon: <Sliders className="w-4 h-4" /> },
        { id: 'prompts' as const, label: t('mypage.tabPrompts'), icon: <FileText className="w-4 h-4" /> },
        { id: 'modules' as const, label: t('mypage.tabModules'), icon: <Boxes className="w-4 h-4" /> },
      ] satisfies { id: ChatbotTabId; label: string; icon: ReactNode }[],
    [t]
  )

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
      window.dispatchEvent(new Event(APP_LANGUAGE_CHANGED_EVENT))
    } catch (e) {
      console.error('[mypage] 설정 저장 실패', e)
      alert(t('mypage.alertSaveFail'))
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
            <span className="text-sm font-medium">{t('mypage.characterManage')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {activeMenu === 'persona' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{t('mypage.personaTitle')}</h2>
              <p className="text-sm text-gray-400 mt-2">
                {t('mypage.personaIntro1')}
                <br />
                {t('mypage.personaIntro2')}
              </p>
            </div>

            <div className="bg-[#202020] border border-[#333] rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('mypage.name')}</label>
                <input
                  value={userPersona.name}
                  onChange={(e) => setUserPersonaState({ ...userPersona, name: e.target.value })}
                  placeholder={t('mypage.namePlaceholder')}
                  className="w-full px-4 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-lg text-white focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('mypage.personaDescLabel')}
                </label>
                <textarea
                  value={userPersona.description}
                  onChange={(e) => setUserPersonaState({ ...userPersona, description: e.target.value })}
                  placeholder={t('mypage.personaDescPlaceholder')}
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
                <div className="text-sm text-gray-400 mb-2">{t('mypage.chatbotSidebar')}</div>
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
                        <h2 className="text-xl font-bold">{t('mypage.apiHeading')}</h2>
                        <p className="text-sm text-gray-400 mt-2">{t('mypage.apiLead')}</p>
                        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                          {t('mypage.apiWarn')}
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
                                title={showKey[pid] ? t('mypage.hide') : t('mypage.show')}
                              >
                                {showKey[pid] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm text-gray-300 mb-1">{t('mypage.labelApiKey')}</label>
                              <input
                                type={showKey[pid] ? 'text' : 'password'}
                                value={providers[pid].apiKey}
                                onChange={(e) =>
                                  setProvidersState((prev) => ({
                                    ...prev,
                                    [pid]: { apiKey: e.target.value },
                                  }))
                                }
                                placeholder={t('mypage.phIndexedDb')}
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-300 mb-1">{t('mypage.labelModels')}</label>
                              <div className="flex gap-2">
                                <input
                                  value={newModel[pid]}
                                  onChange={(e) => setNewModel((prev) => ({ ...prev, [pid]: e.target.value }))}
                                  placeholder={
                                    pid === 'openrouter' ? t('mypage.phModelOr') : t('mypage.phModelGpt')
                                  }
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
                                        alert(t('mypage.alertModelFail'))
                                      })
                                      return next
                                    })
                                    setNewModel((prev) => ({ ...prev, [pid]: '' }))
                                  }}
                                  className="px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
                                  title={t('mypage.titleAdd')}
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
                                            alert(t('mypage.alertModelFail'))
                                          })
                                          return next
                                        })
                                      }
                                      className="text-gray-400 hover:text-white"
                                      title={t('mypage.titleRemove')}
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
                        <h2 className="text-xl font-bold">{t('mypage.paramsHeading')}</h2>
                        <p className="text-sm text-gray-400 mt-2">{t('mypage.paramsLead')}</p>
                      </div>
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">{t('mypage.tempLabel')}</label>
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
                            <label className="block text-sm text-gray-300 mb-1">{t('mypage.maxInLabel')}</label>
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
                            <label className="block text-sm text-gray-300 mb-1">{t('mypage.maxOutLabel')}</label>
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
              <h2 className="text-xl font-bold">{t('mypage.langHeading')}</h2>
              <p className="text-sm text-gray-400 mt-2">{t('mypage.langLead')}</p>
            </div>
            <div className="text-left flex justify-center">
              <div className="w-full max-w-sm">
                <label className="block text-sm text-gray-300 mb-2">{t('mypage.langLabel')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-white"
                >
                  <option value="ko">{t('mypage.langKo')}</option>
                  <option value="en">{t('mypage.langEn')}</option>
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
              {saved ? t('mypage.savedBtn') : t('mypage.saveBtn')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
