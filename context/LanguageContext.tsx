'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppLanguage } from '@/lib/appSettings'
import { getAppLanguage } from '@/lib/appSettings'
import { APP_LANGUAGE_CHANGED_EVENT, translate } from '@/lib/i18n/translate'

type LanguageContextValue = {
  lang: AppLanguage
  t: (path: string, vars?: Record<string, string | number>) => string
  refreshLanguage: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>('ko')

  const refreshLanguage = useCallback(async () => {
    const l = await getAppLanguage()
    setLang(l)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l === 'en' ? 'en' : 'ko'
    }
  }, [])

  useEffect(() => {
    void refreshLanguage()
  }, [refreshLanguage])

  useEffect(() => {
    const fn = () => void refreshLanguage()
    window.addEventListener(APP_LANGUAGE_CHANGED_EVENT, fn)
    return () => window.removeEventListener(APP_LANGUAGE_CHANGED_EVENT, fn)
  }, [refreshLanguage])

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(lang, path, vars),
    [lang]
  )

  const value = useMemo(
    () => ({ lang, t, refreshLanguage }),
    [lang, t, refreshLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useTranslation must be used within LanguageProvider')
  }
  return ctx
}
