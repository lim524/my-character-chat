import { kvGet, kvSet } from './idbKV'

/** IndexedDB(kv) 키 — 마이페이지/설정 (RisuAI-style). */
export const APP_LANGUAGE_KEY = 'app-language'
export const ENABLED_MODULES_KEY = 'enabled-modules'
export const CHAT_OPTIONS_KEY = 'chat-options'
export const BOT_SYSTEM_PROMPT_APPEND_KEY = 'bot-system-prompt-append'
export const PROMPTS_KEY = 'prompts'
export const MODULES_CONFIG_KEY = 'modules.config'

// New (bundle + api inputs)
export const API_PROVIDERS_KEY = 'api.providers'
export const API_MODELS_KEY = 'api.models'
export const CHAT_PARAMETERS_KEY = 'chat.parameters'
export const PROMPTS_BUNDLES_KEY = 'bundles.prompts'
export const MODULES_BUNDLES_KEY = 'bundles.modules'

export type AppLanguage = 'ko' | 'en'

export interface EnabledModules {
  openai: boolean
  claude: boolean
  gemini: boolean
}

export const DEFAULT_ENABLED_MODULES: EnabledModules = {
  openai: true,
  claude: true,
  gemini: true,
}

export async function getAppLanguage(): Promise<AppLanguage> {
  if (typeof window === 'undefined') return 'ko'
  const v = await kvGet(APP_LANGUAGE_KEY)
  return v === 'en' ? 'en' : 'ko'
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(APP_LANGUAGE_KEY, lang)
}

export async function getEnabledModules(): Promise<EnabledModules> {
  if (typeof window === 'undefined') return DEFAULT_ENABLED_MODULES
  try {
    const raw = await kvGet(ENABLED_MODULES_KEY)
    if (!raw) return DEFAULT_ENABLED_MODULES
    const parsed = JSON.parse(raw)
    return {
      openai: parsed.openai !== false,
      claude: parsed.claude !== false,
      gemini: parsed.gemini !== false,
    }
  } catch {
    return DEFAULT_ENABLED_MODULES
  }
}

export async function setEnabledModules(m: EnabledModules): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(ENABLED_MODULES_KEY, JSON.stringify(m))
}

export async function getBotSystemPromptAppend(): Promise<string> {
  if (typeof window === 'undefined') return ''
  return (await kvGet(BOT_SYSTEM_PROMPT_APPEND_KEY)) ?? ''
}

export async function setBotSystemPromptAppend(s: string): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(BOT_SYSTEM_PROMPT_APPEND_KEY, s)
}

export interface Prompts {
  main: string
  character: string
  jailbreak: string
}

export const DEFAULT_PROMPTS: Prompts = {
  main: '',
  character: '',
  jailbreak: '',
}

export async function getPrompts(): Promise<Prompts> {
  if (typeof window === 'undefined') return DEFAULT_PROMPTS
  try {
    const raw = await kvGet(PROMPTS_KEY)
    if (!raw) return DEFAULT_PROMPTS
    const parsed = JSON.parse(raw)
    return {
      main: typeof parsed.main === 'string' ? parsed.main : '',
      character: typeof parsed.character === 'string' ? parsed.character : '',
      jailbreak: typeof parsed.jailbreak === 'string' ? parsed.jailbreak : '',
    }
  } catch {
    return DEFAULT_PROMPTS
  }
}

export async function setPrompts(p: Prompts): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(PROMPTS_KEY, JSON.stringify(p))
}

export type LorebookEntry = {
  id: string
  keywords: string[]
  content: string
}

export type RegexRule = {
  id: string
  pattern: string
  replace: string
  flags: string
}

export type AssetItem = {
  id: string
  type: 'image' | 'audio'
  name: string
  url: string
}

export interface ModulesConfig {
  lorebook: {
    enabled: boolean
    entries: LorebookEntry[]
  }
  regex: {
    enabled: boolean
    rules: RegexRule[]
  }
  assets: {
    enabled: boolean
    items: AssetItem[]
  }
}

export const DEFAULT_MODULES_CONFIG: ModulesConfig = {
  lorebook: { enabled: false, entries: [] },
  regex: { enabled: false, rules: [] },
  assets: { enabled: false, items: [] },
}

export async function getModulesConfig(): Promise<ModulesConfig> {
  if (typeof window === 'undefined') return DEFAULT_MODULES_CONFIG
  try {
    const raw = await kvGet(MODULES_CONFIG_KEY)
    if (!raw) return DEFAULT_MODULES_CONFIG
    const parsed = JSON.parse(raw)
    return {
      lorebook: {
        enabled: parsed?.lorebook?.enabled === true,
        entries: Array.isArray(parsed?.lorebook?.entries) ? parsed.lorebook.entries : [],
      },
      regex: {
        enabled: parsed?.regex?.enabled === true,
        rules: Array.isArray(parsed?.regex?.rules) ? parsed.regex.rules : [],
      },
      assets: {
        enabled: parsed?.assets?.enabled === true,
        items: Array.isArray(parsed?.assets?.items) ? parsed.assets.items : [],
      },
    }
  } catch {
    return DEFAULT_MODULES_CONFIG
  }
}

export async function setModulesConfig(cfg: ModulesConfig): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(MODULES_CONFIG_KEY, JSON.stringify(cfg))
}

// --- Provider API keys + models ---
export type ProviderId = 'openai' | 'openrouter' | 'gemini' | 'anthropic'

export interface ApiProviders {
  openai: { apiKey: string }
  openrouter: { apiKey: string }
  gemini: { apiKey: string }
  anthropic: { apiKey: string }
}

export const DEFAULT_API_PROVIDERS: ApiProviders = {
  openai: { apiKey: '' },
  openrouter: { apiKey: '' },
  gemini: { apiKey: '' },
  anthropic: { apiKey: '' },
}

export type ApiModels = Record<ProviderId, string[]>

export const DEFAULT_API_MODELS: ApiModels = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  openrouter: [],
  gemini: ['gemini-2.5-flash-preview-04-17', 'gemini-2.5-pro-preview-03-25'],
  anthropic: ['claude-3-5-haiku-20241022', 'claude-3-7-sonnet-20250219'],
}

export async function getApiProviders(): Promise<ApiProviders> {
  if (typeof window === 'undefined') return DEFAULT_API_PROVIDERS
  try {
    const raw = await kvGet(API_PROVIDERS_KEY)
    if (!raw) return DEFAULT_API_PROVIDERS
    const p = JSON.parse(raw)
    const getKey = (k: unknown) => (typeof k === 'string' ? k : '')
    return {
      openai: { apiKey: getKey(p?.openai?.apiKey) },
      openrouter: { apiKey: getKey(p?.openrouter?.apiKey) },
      gemini: { apiKey: getKey(p?.gemini?.apiKey) },
      anthropic: { apiKey: getKey(p?.anthropic?.apiKey) },
    }
  } catch {
    return DEFAULT_API_PROVIDERS
  }
}

export async function setApiProviders(providers: ApiProviders): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(API_PROVIDERS_KEY, JSON.stringify(providers))
}

export async function getApiModels(): Promise<ApiModels> {
  if (typeof window === 'undefined') return DEFAULT_API_MODELS
  try {
    const raw = await kvGet(API_MODELS_KEY)
    if (!raw) return DEFAULT_API_MODELS
    const m = JSON.parse(raw)
    const clean = (arr: unknown) =>
      Array.isArray(arr)
        ? arr.filter((x) => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
        : []
    return {
      openai: clean(m?.openai),
      openrouter: clean(m?.openrouter),
      gemini: clean(m?.gemini),
      anthropic: clean(m?.anthropic),
    }
  } catch {
    return DEFAULT_API_MODELS
  }
}

export async function setApiModels(models: ApiModels): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(API_MODELS_KEY, JSON.stringify(models))
}

// --- Chat parameters ---
export interface ChatParameters {
  temperature: number
  maxInputChars: number
  maxOutputChars: number
}

export const DEFAULT_CHAT_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  maxInputChars: 4000,
  maxOutputChars: 4000,
}

export async function getChatParameters(): Promise<ChatParameters> {
  if (typeof window === 'undefined') return DEFAULT_CHAT_PARAMETERS
  try {
    const raw = await kvGet(CHAT_PARAMETERS_KEY)
    if (!raw) return DEFAULT_CHAT_PARAMETERS
    const p = JSON.parse(raw)
    const t = Number(p?.temperature)
    const inC = Number(p?.maxInputChars)
    const outC = Number(p?.maxOutputChars)
    return {
      temperature: Number.isFinite(t) ? Math.max(0, Math.min(2, t)) : DEFAULT_CHAT_PARAMETERS.temperature,
      maxInputChars: Number.isFinite(inC) ? Math.max(100, Math.min(200000, inC)) : DEFAULT_CHAT_PARAMETERS.maxInputChars,
      maxOutputChars: Number.isFinite(outC) ? Math.max(100, Math.min(200000, outC)) : DEFAULT_CHAT_PARAMETERS.maxOutputChars,
    }
  } catch {
    return DEFAULT_CHAT_PARAMETERS
  }
}

export async function setChatParameters(params: ChatParameters): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(CHAT_PARAMETERS_KEY, JSON.stringify(params))
}

// --- Bundles (Prompts) ---
export interface PromptBundle {
  id: string
  name: string
  description: string
  enabled: boolean
  mainPrompt: string
  characterPrompt: string
  jailbreakPrompt: string
  systemPromptAppend: string
}

export async function getPromptBundles(): Promise<PromptBundle[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(PROMPTS_BUNDLES_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
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
  } catch {
    return []
  }
}

export async function setPromptBundles(bundles: PromptBundle[]): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(PROMPTS_BUNDLES_KEY, JSON.stringify(bundles))
}

// --- Bundles (Modules) ---
export interface ModuleBundle {
  id: string
  name: string
  description: string
  enabled: boolean
  lorebook: ModulesConfig['lorebook']
  regex: ModulesConfig['regex']
  assets: ModulesConfig['assets']
}

export async function getModuleBundles(): Promise<ModuleBundle[]> {
  if (typeof window === 'undefined') return []
  try {
    const raw = await kvGet(MODULES_BUNDLES_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
        name: typeof x.name === 'string' ? x.name : '',
        description: typeof x.description === 'string' ? x.description : '',
        enabled: x.enabled === true,
        lorebook: x.lorebook && typeof x.lorebook === 'object' ? x.lorebook : DEFAULT_MODULES_CONFIG.lorebook,
        regex: x.regex && typeof x.regex === 'object' ? x.regex : DEFAULT_MODULES_CONFIG.regex,
        assets: x.assets && typeof x.assets === 'object' ? x.assets : DEFAULT_MODULES_CONFIG.assets,
      }))
  } catch {
    return []
  }
}

export async function setModuleBundles(bundles: ModuleBundle[]): Promise<void> {
  if (typeof window === 'undefined') return
  await kvSet(MODULES_BUNDLES_KEY, JSON.stringify(bundles))
}
