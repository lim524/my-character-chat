import type { InterfaceConfig, ScreenConfig } from './interfaceConfig'

declare global {
  // eslint-disable-next-line no-var
  var __lastDefinedScreen: ScreenConfig | undefined
}

export function createInitialInterfaceConfig(): InterfaceConfig {
  return {
    code: '',
    layoutPreset: 'dating-sim-v1',
    assets: [],
    backgroundEmbedding: '',
    regexScripts: [],
    scenarioRules: [],
    extraInterfaceEntries: [],
    gameVariables: [],
  }
}


export function runInterfaceCode(code: string): ScreenConfig | null {
  if (typeof window === 'undefined') return null

  let captured: ScreenConfig | undefined

  function defineScreen(config: ScreenConfig) {
    captured = config
  }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('defineScreen', `${code}\nreturn null;`)
    fn(defineScreen)
    return captured ?? null
  } catch (e) {
    console.error('interface code eval error', e)
    return null
  }
}

