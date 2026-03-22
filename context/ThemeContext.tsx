import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { kvGet, kvSet } from '@/lib/idbKV'

type ThemeId = 'light' | 'dark' | 'violet'

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

const THEME_STORAGE_KEY = 'app-theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyThemeToDocument(theme: ThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('light')

  useEffect(() => {
    if (typeof window === 'undefined') return
    void (async () => {
      try {
        const saved = (await kvGet(THEME_STORAGE_KEY)) as ThemeId | null
        if (saved === 'light' || saved === 'dark' || saved === 'violet') {
          setThemeState(saved)
          applyThemeToDocument(saved)
        } else {
          setThemeState('light')
          applyThemeToDocument('light')
        }
      } catch {
        setThemeState('light')
        applyThemeToDocument('light')
      }
    })()
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      void kvSet(THEME_STORAGE_KEY, t).catch(() => {})
    }
    applyThemeToDocument(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

