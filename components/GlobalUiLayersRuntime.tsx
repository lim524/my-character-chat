'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  GLOBAL_UI_LAYERS_UPDATED_EVENT,
  getGlobalUiLayers,
  type GlobalUiLayer,
} from '@/lib/globalUiLayers'
import {
  applyGameVariablePlaceholders,
  GAME_VARIABLES_UPDATED_EVENT,
} from '@/lib/gameVariables'
import { sanitizeCustomCss } from '@/lib/interfaceConfigSanitizer'

/** 설정에 저장된 전역 레이어를 순서대로 적용합니다 (CSS → HTML 오버레이 → JS). */
export default function GlobalUiLayersRuntime() {
  const [layers, setLayers] = useState<GlobalUiLayer[]>([])
  const [gameVarMap, setGameVarMap] = useState<Record<string, string | number | boolean>>({})

  useEffect(() => {
    void getGlobalUiLayers().then(setLayers)
    const onUpdate = () => {
      void getGlobalUiLayers().then(setLayers)
    }
    window.addEventListener(GLOBAL_UI_LAYERS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(GLOBAL_UI_LAYERS_UPDATED_EVENT, onUpdate)
  }, [])

  useEffect(() => {
    const onVars = (e: Event) => {
      const d = (e as CustomEvent<Record<string, string | number | boolean>>).detail
      if (d && typeof d === 'object') setGameVarMap({ ...d })
    }
    window.addEventListener(GAME_VARIABLES_UPDATED_EVENT, onVars as EventListener)
    return () => window.removeEventListener(GAME_VARIABLES_UPDATED_EVENT, onVars as EventListener)
  }, [])

  const active = useMemo(() => layers.filter((l) => l.enabled), [layers])

  useEffect(() => {
    const cleanups: Array<() => void> = []
    for (const layer of active) {
      const code = layer.javascript.trim()
      if (!code) continue
      try {
        const fn = new Function(code)
        const ret = fn()
        if (typeof ret === 'function') cleanups.push(ret as () => void)
      } catch (e) {
        console.error(`[전역 UI 레이어 JS] ${layer.name || layer.id}`, e)
      }
    }
    return () => {
      for (const c of cleanups) {
        try {
          c()
        } catch {
          /* ignore */
        }
      }
    }
  }, [active])

  return (
    <>
      {active.map((layer) => {
        const css = sanitizeCustomCss(layer.css)
        if (!css) return null
        return (
          <style
            key={`css-${layer.id}`}
            data-global-ui-layer={layer.id}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        )
      })}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden
        data-global-ui-root
      >
        {active.map((layer) => {
          const html = layer.html.trim()
          if (!html) return null
          const rendered = applyGameVariablePlaceholders(html, gameVarMap)
          return (
            <div
              key={`html-${layer.id}`}
              data-global-ui-layer={layer.id}
              className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          )
        })}
      </div>
    </>
  )
}
